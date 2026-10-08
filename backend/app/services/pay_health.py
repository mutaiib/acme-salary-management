"""FR-09, FR-10, FR-15, FR-16, FR-18, FR-20: the outliers, the correction cost, the figures of
each band and the outliers by group.

Tests: tests/api/test_pay_health.py.
"""

from dataclasses import dataclass
from typing import Literal

from sqlalchemy import ColumnElement, Row, Select, case, func, literal, or_
from sqlalchemy.orm import Session

from app.calculations.ranges import RangeStatus
from app.models import Employee, SalaryBand
from app.reference import REPORTING_CURRENCY, GroupBy
from app.services.overview import GROUP_COLUMNS, group_label
from app.services.pagination import Page, paginate
from app.services.sql import active_employees_with_rate, matches_search, reporting_minor

OutlierStatus = Literal["below", "above"]


@dataclass(frozen=True)
class PayHealthSummary:
    below_count: int
    above_count: int
    correction_cost_minor: int
    # The payroll cost of all active employees. The correction cost is a part of it.
    payroll_cost_minor: int
    reporting_currency: str


def summary(session: Session) -> PayHealthSummary:
    below_count, above_count, cost = session.execute(
        _active_employees_with_band(*_outlier_figures())
    ).one()
    payroll_cost = session.execute(
        active_employees_with_rate(
            func.coalesce(func.sum(reporting_minor(Employee.salary_minor)), 0)
        )
    ).scalar_one()
    return PayHealthSummary(
        below_count=below_count,
        above_count=above_count,
        correction_cost_minor=int(cost),
        payroll_cost_minor=int(payroll_cost),
        reporting_currency=REPORTING_CURRENCY,
    )


@dataclass(frozen=True)
class BandEffect:
    """The figures of the employees of one salary band."""

    headcount: int
    below_count: int
    above_count: int
    correction_cost_minor: int


def effect_by_band(session: Session, country: str | None = None) -> dict[int, BandEffect]:
    """The figures of each band that has an employee, with the band id as the key."""
    query = _active_employees_with_band(SalaryBand.id, func.count(), *_outlier_figures()).group_by(
        SalaryBand.id
    )
    if country:
        query = query.where(SalaryBand.country == country)
    return {
        band_id: BandEffect(headcount, below_count, above_count, int(cost))
        for band_id, headcount, below_count, above_count, cost in session.execute(query)
    }


def effect_of_limits(
    session: Session, band: SalaryBand, min_minor: int, max_minor: int
) -> BandEffect:
    """The figures of the employees of `band` if the band had these limits."""
    below = _is_below(min_minor)
    headcount, below_count, above_count, cost = session.execute(
        active_employees_with_rate(
            func.count(),
            func.count().filter(below),
            func.count().filter(_is_above(max_minor)),
            func.coalesce(
                func.sum(reporting_minor(min_minor - Employee.salary_minor)).filter(below), 0
            ),
        ).where(Employee.country == band.country, Employee.job_level == band.job_level)
    ).one()
    return BandEffect(headcount, below_count, above_count, int(cost))


@dataclass(frozen=True)
class OutlierGroup:
    key: str
    label: str
    headcount: int
    below_count: int
    above_count: int


def outliers_by_group(session: Session, group_by: GroupBy) -> list[OutlierGroup]:
    """The employees with a band and their outliers, by country, department or job level.

    The groups with the most outliers are first. Job levels are in the order of the level.
    """
    group = GROUP_COLUMNS[group_by]
    rows = session.execute(
        _active_employees_with_band(
            group,
            func.count(),
            func.count().filter(_is_outside(RangeStatus.BELOW)),
            func.count().filter(_is_outside(RangeStatus.ABOVE)),
        ).group_by(group)
    )
    groups = [
        OutlierGroup(str(key), group_label(group_by, key), headcount, below_count, above_count)
        for key, headcount, below_count, above_count in rows
    ]
    if group_by == "job_level":
        return sorted(groups, key=lambda g: int(g.key))
    return sorted(groups, key=lambda g: (-(g.below_count + g.above_count), g.label))


def list_outliers(
    session: Session,
    status: OutlierStatus | None,
    country: str | None,
    department: str | None,
    job_level: int | None,
    search: str | None,
    page: int,
    page_size: int,
) -> Page[Row]:
    """One page of the outliers, with the employee who is farthest from the band first.

    Without a status, the list has the below-range and the above-range employees.
    Each row has the pay data of the employee, `range_status`, `band_limit_minor` (the
    band minimum for a below-range employee, the band maximum for an above-range one)
    and `difference_minor`.
    """
    is_below = _is_outside(RangeStatus.BELOW)
    limit, difference = (
        case((is_below, column), else_=other)
        for column, other in zip(
            _LIMIT_AND_DIFFERENCE[RangeStatus.BELOW],
            _LIMIT_AND_DIFFERENCE[RangeStatus.ABOVE],
            strict=True,
        )
    )
    matching = select_outliers(
        status,
        country,
        department,
        job_level,
        search,
        Employee.id,
        Employee.employee_code,
        Employee.full_name,
        Employee.job_title,
        Employee.job_level,
        Employee.department,
        Employee.country,
        Employee.currency,
        Employee.salary_minor,
        case(
            (is_below, literal(RangeStatus.BELOW.value)), else_=literal(RangeStatus.ABOVE.value)
        ).label("range_status"),
        limit.label("band_limit_minor"),
        difference.label("difference_minor"),
    )

    # The list has many currencies, so the order uses the difference as a part of the
    # band limit, in units of 0.01%. Integer arithmetic keeps money away from floats.
    farthest_first = (difference * 10_000 // limit).desc()
    return paginate(session, matching, (farthest_first, Employee.employee_code), page, page_size)


def select_outliers(
    status: OutlierStatus | None,
    country: str | None,
    department: str | None,
    job_level: int | None,
    search: str | None,
    *columns: ColumnElement,
) -> Select:
    """A query on the outliers that match the criteria, without pagination.

    The query joins `Employee`, `SalaryBand` and `ExchangeRate`, so `columns` can use them.
    """
    is_listed = (
        _is_outside(RangeStatus(status))
        if status
        else or_(_is_outside(RangeStatus.BELOW), _is_outside(RangeStatus.ABOVE))
    )
    matching = _active_employees_with_band(*columns).where(is_listed)
    if country:
        matching = matching.where(Employee.country == country)
    if department:
        matching = matching.where(Employee.department == department)
    if job_level:
        matching = matching.where(Employee.job_level == job_level)
    if search:
        matching = matching.where(matches_search(search))
    return matching


def _active_employees_with_band(*columns: ColumnElement) -> Select:
    return active_employees_with_rate(*columns).join(
        SalaryBand,
        (SalaryBand.job_level == Employee.job_level) & (SalaryBand.country == Employee.country),
    )


def _outlier_figures() -> tuple[ColumnElement[int], ColumnElement[int], ColumnElement[int]]:
    """The count below range, the count above range and the correction cost of a group."""
    below = _is_outside(RangeStatus.BELOW)
    return (
        func.count().filter(below),
        func.count().filter(_is_outside(RangeStatus.ABOVE)),
        func.coalesce(func.sum(reporting_minor(_DIFFERENCE_TO_MINIMUM)).filter(below), 0),
    )


def _is_below(minimum: ColumnElement[int] | int) -> ColumnElement[bool]:
    return Employee.salary_minor < minimum


def _is_above(maximum: ColumnElement[int] | int) -> ColumnElement[bool]:
    return Employee.salary_minor > maximum


# The definitions of an outlier in SQL. They agree with `calculations.ranges.range_status`:
# a salary equal to the minimum or the maximum is in range. A status that is not here
# raises a KeyError.
_IS_OUTSIDE: dict[RangeStatus, ColumnElement[bool]] = {
    RangeStatus.BELOW: _is_below(SalaryBand.min_minor),
    RangeStatus.ABOVE: _is_above(SalaryBand.max_minor),
}

# How far a below-range salary is under the band minimum. It is the cost to bring it to the minimum.
_DIFFERENCE_TO_MINIMUM: ColumnElement[int] = SalaryBand.min_minor - Employee.salary_minor

# The band limit that the salary is outside, and the distance of the salary from it.
_LIMIT_AND_DIFFERENCE: dict[RangeStatus, tuple[ColumnElement[int], ColumnElement[int]]] = {
    RangeStatus.BELOW: (SalaryBand.min_minor, _DIFFERENCE_TO_MINIMUM),
    RangeStatus.ABOVE: (SalaryBand.max_minor, Employee.salary_minor - SalaryBand.max_minor),
}


def _is_outside(status: RangeStatus) -> ColumnElement[bool]:
    return _IS_OUTSIDE[status]
