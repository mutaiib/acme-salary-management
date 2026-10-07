"""FR-11, FR-12, NFR-07: the unadjusted gender pay gap.

Tests: tests/api/test_pay_equity.py, tests/unit/test_pay_gap.py.
"""

from dataclasses import dataclass
from decimal import Decimal
from fractions import Fraction

from sqlalchemy import ColumnElement, func, literal
from sqlalchemy.orm import Session

from app.calculations.pay_gap import (
    FLAG_THRESHOLD_PCT,
    MIN_GROUP_SIZE,
    gap_pct,
    has_enough_data,
    is_flagged,
)
from app.models import Employee
from app.reference import COUNTRIES, FEMALE, MALE, REPORTING_CURRENCY
from app.services.sql import (
    GROUP,
    VALUE,
    active_employees_with_rate,
    median_by_group,
    reporting_minor,
)

ORGANIZATION = "organization"


@dataclass(frozen=True)
class Gap:
    """The unadjusted gender pay gap of one group. The gaps are None when the group is too small."""

    key: str
    label: str
    currency: str
    men: int
    women: int
    mean_gap_pct: Decimal | None
    median_gap_pct: Decimal | None
    is_flagged: bool
    has_enough_data: bool


@dataclass(frozen=True)
class PayEquity:
    organization: Gap
    countries: list[Gap]
    flag_threshold_pct: Decimal
    min_group_size: int


@dataclass(frozen=True)
class _Pay:
    """The pay of the men or of the women of one group."""

    count: int = 0
    total_minor: int = 0
    median_minor: int = 0


def pay_equity(session: Session) -> PayEquity:
    """The gap for the organization (in the reporting currency) and for each country
    (in the local currency)."""
    whole = _pay_by_group(
        session, literal(ORGANIZATION), reporting_minor(Employee.salary_minor)
    ).get(ORGANIZATION, {})
    organization = _gap(ORGANIZATION, "Organization", REPORTING_CURRENCY, whole)
    countries = [
        _gap(code, COUNTRIES[code].name, COUNTRIES[code].currency, pay)
        for code, pay in _pay_by_group(session, Employee.country, Employee.salary_minor).items()
    ]
    return PayEquity(
        organization=organization,
        countries=sorted(countries, key=_flagged_first),
        flag_threshold_pct=FLAG_THRESHOLD_PCT,
        min_group_size=MIN_GROUP_SIZE,
    )


def _pay_by_group(
    session: Session, group: ColumnElement, pay: ColumnElement[int]
) -> dict[str, dict[str, _Pay]]:
    """For each group, the pay of each gender: `{group: {gender: _Pay}}`."""
    medians = {
        gender: median_by_group(
            session,
            active_employees_with_rate(group.label(GROUP), pay.label(VALUE)).where(
                Employee.gender == gender
            ),
        )
        for gender in (MALE, FEMALE)
    }
    aggregates = session.execute(
        active_employees_with_rate(group, Employee.gender, func.count(), func.sum(pay)).group_by(
            group, Employee.gender
        )
    )
    result: dict[str, dict[str, _Pay]] = {}
    for key, gender, count, total in aggregates:
        result.setdefault(key, {})[gender] = _Pay(count, int(total), medians[gender][key])
    return result


def _gap(key: str, label: str, currency: str, pay: dict[str, _Pay]) -> Gap:
    men, women = pay.get(MALE, _Pay()), pay.get(FEMALE, _Pay())
    if not has_enough_data(men.count, women.count):
        return Gap(key, label, currency, men.count, women.count, None, None, False, False)

    mean_gap = gap_pct(
        Fraction(men.total_minor, men.count), Fraction(women.total_minor, women.count)
    )
    median_gap = gap_pct(men.median_minor, women.median_minor)
    return Gap(
        key=key,
        label=label,
        currency=currency,
        men=men.count,
        women=women.count,
        mean_gap_pct=mean_gap,
        median_gap_pct=median_gap,
        is_flagged=is_flagged(mean_gap, median_gap),
        has_enough_data=True,
    )


def _flagged_first(gap: Gap) -> tuple:
    """Flagged countries first, then the largest mean gap, then the countries without data."""
    size = abs(gap.mean_gap_pct) if gap.mean_gap_pct is not None else Decimal(-1)
    return (not gap.is_flagged, not gap.has_enough_data, -size, gap.label)
