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

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class RangePosition:
    """Where the salary of one employee is in the salary band of the job."""

    band: SalaryBand | None
    compa_ratio: Decimal | None
    range_penetration: Decimal | None
    range_status: RangeStatus


def list_bands(session: Session, country: str | None = None) -> list[SalaryBand]:
    statement = select(SalaryBand).order_by(SalaryBand.country, SalaryBand.job_level)
    if country:
        statement = statement.where(SalaryBand.country == country)
    return list(session.scalars(statement))


def update_band(
    session: Session, band_id: int, min_minor: int, mid_minor: int, max_minor: int
) -> SalaryBand:
    band = session.get(SalaryBand, band_id)
    if band is None:
        raise NotFoundError("salary band")
    try:
        validate_band(min_minor, mid_minor, max_minor)
    except InvalidBandError as error:
        raise DomainError(error.field, error.cause) from error
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
