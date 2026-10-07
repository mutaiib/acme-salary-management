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
from app.reference import COUNTRIES, REPORTING_CURRENCY
from app.services.sql import active_employees_with_rate, median_by_group, usd_minor

MEN, WOMEN = "male", "female"
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


def pay_equity(session: Session) -> PayEquity:
    """The gap for the organization (in the reporting currency) and for each country
    (in the local currency). A gap in one country needs no exchange rate."""
    organization = _gaps(session, literal(ORGANIZATION), usd_minor(Employee.salary_minor))
    countries = _gaps(session, Employee.country, Employee.salary_minor)
    return PayEquity(
        organization=organization.get(ORGANIZATION) or _gap(ORGANIZATION, {}, {}, {}),
        countries=sorted(countries.values(), key=_flagged_first),
        flag_threshold_pct=FLAG_THRESHOLD_PCT,
        min_group_size=MIN_GROUP_SIZE,
    )


def _gaps(session: Session, group: ColumnElement, pay: ColumnElement[int]) -> dict[str, Gap]:
    counts: dict[tuple, int] = {}
    totals: dict[tuple, int] = {}
    rows = session.execute(
        active_employees_with_rate(group, Employee.gender, func.count(), func.sum(pay)).group_by(
            group, Employee.gender
        )
    )
    for key, gender, count, total in rows:
        counts[(key, gender)] = count
        totals[(key, gender)] = int(total)

    group_and_gender = (group + ":" + Employee.gender).label("grp")
    medians = {
        tuple(key.split(":")): median
        for key, median in median_by_group(
            session, active_employees_with_rate(group_and_gender, pay.label("val"))
        ).items()
    }
    return {key: _gap(key, counts, totals, medians) for key in {key for key, _ in counts}}


def _gap(key: str, counts: dict, totals: dict, medians: dict) -> Gap:
    men, women = counts.get((key, MEN), 0), counts.get((key, WOMEN), 0)
    is_organization = key == ORGANIZATION
    label = "Organization" if is_organization else COUNTRIES[key].name
    currency = REPORTING_CURRENCY if is_organization else COUNTRIES[key].currency
    if not has_enough_data(men, women):
        return Gap(key, label, currency, men, women, None, None, False, False)

    mean_gap = gap_pct(Fraction(totals[(key, MEN)], men), Fraction(totals[(key, WOMEN)], women))
    median_gap = gap_pct(medians[(key, MEN)], medians[(key, WOMEN)])
    return Gap(
        key=key,
        label=label,
        currency=currency,
        men=men,
        women=women,
        mean_gap_pct=mean_gap,
        median_gap_pct=median_gap,
        is_flagged=is_flagged(mean_gap, median_gap),
        has_enough_data=True,
    )


def _flagged_first(gap: Gap) -> tuple:
    """Flagged countries first, then the largest mean gap, then the countries without data."""
    size = abs(gap.mean_gap_pct) if gap.mean_gap_pct is not None else Decimal(-1)
    return (not gap.is_flagged, not gap.has_enough_data, -size, gap.label)
