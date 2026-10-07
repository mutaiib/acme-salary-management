"""FR-09, FR-10: the outliers and the correction cost.

Tests: tests/api/test_pay_health.py.
"""

from dataclasses import dataclass
from typing import Literal

from sqlalchemy import ColumnElement, Row, Select, func
from sqlalchemy.orm import Session

from app.calculations.ranges import RangeStatus
from app.models import Employee, SalaryBand
from app.reference import REPORTING_CURRENCY
from app.services.pagination import Page, paginate
from app.services.sql import active_employees_with_rate, reporting_minor

OutlierStatus = Literal["below", "above"]


@dataclass(frozen=True)
class PayHealthSummary:
    below_count: int
    above_count: int
    correction_cost_minor: int
    reporting_currency: str


def summary(session: Session) -> PayHealthSummary:
    below = _is_outside(RangeStatus.BELOW)
    above = _is_outside(RangeStatus.ABOVE)
    _, difference_to_minimum = _LIMIT_AND_DIFFERENCE[RangeStatus.BELOW]
    below_count, above_count, cost = session.execute(
        _active_employees_with_band(
            func.count().filter(below),
            func.count().filter(above),
            func.coalesce(func.sum(reporting_minor(difference_to_minimum)).filter(below), 0),
        )
    ).one()
    return PayHealthSummary(
        below_count=below_count,
        above_count=above_count,
        correction_cost_minor=int(cost),
        reporting_currency=REPORTING_CURRENCY,
    )


def list_outliers(
    session: Session,
    status: OutlierStatus,
    country: str | None,
    job_level: int | None,
    page: int,
    page_size: int,
) -> Page[Row]:
    """One page of the outliers, with the employee who is farthest from the band first.

    Each row has the pay data of the employee, `band_limit_minor` (the band minimum
    for a below-range employee, the band maximum for an above-range one) and
    `difference_minor`.
    """
    range_status = RangeStatus(status)
    limit, difference = _LIMIT_AND_DIFFERENCE[range_status]
    matching = _active_employees_with_band(
        Employee.id,
        Employee.employee_code,
        Employee.full_name,
        Employee.job_title,
        Employee.job_level,
        Employee.department,
        Employee.country,
        Employee.currency,
        Employee.salary_minor,
        limit.label("band_limit_minor"),
        difference.label("difference_minor"),
    ).where(_is_outside(range_status))
    if country:
        matching = matching.where(Employee.country == country)
    if job_level:
        matching = matching.where(Employee.job_level == job_level)

    # The list has many currencies, so the order uses the difference as a part of the
    # band limit, in units of 0.01%. Integer arithmetic keeps money away from floats.
    farthest_first = (difference * 10_000 // limit).desc()
    return paginate(session, matching, (farthest_first, Employee.employee_code), page, page_size)


def _active_employees_with_band(*columns: ColumnElement) -> Select:
    return active_employees_with_rate(*columns).join(
        SalaryBand,
        (SalaryBand.job_level == Employee.job_level) & (SalaryBand.country == Employee.country),
    )


# The definitions of an outlier in SQL. They agree with `calculations.ranges.range_status`:
# a salary equal to the minimum or the maximum is in range. A status that is not here
# raises a KeyError.
_IS_OUTSIDE: dict[RangeStatus, ColumnElement[bool]] = {
    RangeStatus.BELOW: Employee.salary_minor < SalaryBand.min_minor,
    RangeStatus.ABOVE: Employee.salary_minor > SalaryBand.max_minor,
}

# The band limit that the salary is outside, and the distance of the salary from it.
_LIMIT_AND_DIFFERENCE: dict[RangeStatus, tuple[ColumnElement[int], ColumnElement[int]]] = {
    RangeStatus.BELOW: (SalaryBand.min_minor, SalaryBand.min_minor - Employee.salary_minor),
    RangeStatus.ABOVE: (SalaryBand.max_minor, Employee.salary_minor - SalaryBand.max_minor),
}


def _is_outside(status: RangeStatus) -> ColumnElement[bool]:
    return _IS_OUTSIDE[status]
