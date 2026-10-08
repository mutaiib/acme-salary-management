"""FR-07, FR-08, FR-15, FR-16: salary bands and the position of a salary in its band.

Tests: tests/api/test_bands.py, test_employee_detail.py, tests/unit/test_ranges.py.
"""

import logging
from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.calculations.ranges import (
    InvalidBandError,
    RangeStatus,
    compa_ratio,
    range_penetration,
    range_status,
    validate_band,
)
from app.errors import DomainError, NotFoundError
from app.models import Employee, SalaryBand
from app.reference import REPORTING_CURRENCY
from app.services.pay_health import BandEffect, effect_by_band, effect_of_limits

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class RangePosition:
    """Where the salary of one employee is in the salary band of the job."""

    band: SalaryBand | None
    compa_ratio: Decimal | None
    range_penetration: Decimal | None
    range_status: RangeStatus


@dataclass(frozen=True)
class BandFigures:
    """A salary band, with the headcount and the counts below range and above range."""

    id: int
    job_level: int
    country: str
    currency: str
    min_minor: int
    mid_minor: int
    max_minor: int
    headcount: int
    below_count: int
    above_count: int


def list_band_figures(session: Session, country: str | None = None) -> list[BandFigures]:
    statement = select(SalaryBand).order_by(SalaryBand.country, SalaryBand.job_level)
    if country:
        statement = statement.where(SalaryBand.country == country)
    effects = effect_by_band(session, country)
    no_employee = BandEffect(0, 0, 0, 0)
    return [
        _with_effect(band, effects.get(band.id, no_employee)) for band in session.scalars(statement)
    ]


def _with_effect(band: SalaryBand, effect: BandEffect) -> BandFigures:
    return BandFigures(
        id=band.id,
        job_level=band.job_level,
        country=band.country,
        currency=band.currency,
        min_minor=band.min_minor,
        mid_minor=band.mid_minor,
        max_minor=band.max_minor,
        headcount=effect.headcount,
        below_count=effect.below_count,
        above_count=effect.above_count,
    )


@dataclass(frozen=True)
class BandChangePreview:
    """The figures of a band with its current limits and with the proposed limits."""

    current: BandEffect
    proposed: BandEffect
    reporting_currency: str


def preview_band_change(
    session: Session, band_id: int, min_minor: int, mid_minor: int, max_minor: int
) -> BandChangePreview:
    """Shows what a band change does. It saves nothing."""
    band = _valid_band(session, band_id, min_minor, mid_minor, max_minor)
    return BandChangePreview(
        current=effect_of_limits(session, band, band.min_minor, band.max_minor),
        proposed=effect_of_limits(session, band, min_minor, max_minor),
        reporting_currency=REPORTING_CURRENCY,
    )


def _valid_band(
    session: Session, band_id: int, min_minor: int, mid_minor: int, max_minor: int
) -> SalaryBand:
    band = session.get(SalaryBand, band_id)
    if band is None:
        raise NotFoundError("salary band")
    try:
        validate_band(min_minor, mid_minor, max_minor)
    except InvalidBandError as error:
        raise DomainError(error.field, error.cause) from error
    return band


def update_band(
    session: Session, band_id: int, min_minor: int, mid_minor: int, max_minor: int
) -> SalaryBand:
    band = _valid_band(session, band_id, min_minor, mid_minor, max_minor)
    band.min_minor, band.mid_minor, band.max_minor = min_minor, mid_minor, max_minor
    session.commit()
    logger.info(
        "Band change: band=%s min=%s mid=%s max=%s", band.id, min_minor, mid_minor, max_minor
    )
    return band


def position_of(session: Session, employee: Employee) -> RangePosition:
    """Calculates the position at read time, so a band change shows at once."""
    band = session.scalars(
        select(SalaryBand).where(
            SalaryBand.job_level == employee.job_level, SalaryBand.country == employee.country
        )
    ).one_or_none()
    if band is None:
        return RangePosition(None, None, None, RangeStatus.NO_BAND)
    return RangePosition(
        band=band,
        compa_ratio=compa_ratio(employee.salary_minor, band.mid_minor),
        range_penetration=range_penetration(employee.salary_minor, band.min_minor, band.max_minor),
        range_status=range_status(employee.salary_minor, band.min_minor, band.max_minor),
    )
