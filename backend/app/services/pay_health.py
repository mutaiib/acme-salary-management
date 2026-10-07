from dataclasses import dataclass
from typing import Literal

from sqlalchemy import ColumnElement, Select, func, select
from sqlalchemy.orm import Session

from app.models import Employee, ExchangeRate, SalaryBand
from app.reference import ACTIVE, REPORTING_CURRENCY
from app.services.employees import Page
from app.services.sql import usd_minor

OutlierStatus = Literal["below", "above"]


@dataclass(frozen=True)
class PayHealthSummary:
    below_count: int
    above_count: int
    correction_cost_minor: int
    reporting_currency: str


@dataclass(frozen=True)
class Outlier:
    employee: Employee
    # The band minimum for a below-range employee, the band maximum for an above-range one.
    band_limit_minor: int
    difference_minor: int


def summary(session: Session) -> PayHealthSummary:
    below = _is_outside("below")
    above = _is_outside("above")
    _, difference_to_minimum = _limit_and_difference("below")
    gap_to_minimum = usd_minor(difference_to_minimum)
    below_count, above_count, cost = session.execute(
        _active_employees_with_band(
            func.count().filter(below),
            func.count().filter(above),
            func.coalesce(func.sum(gap_to_minimum).filter(below), 0),
        ).join(ExchangeRate, ExchangeRate.currency == Employee.currency)
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
) -> Page[Outlier]:
    limit, difference = _limit_and_difference(status)
    matching = _active_employees_with_band(
        Employee, limit.label("band_limit"), difference.label("difference")
    ).where(_is_outside(status))
    if country:
        matching = matching.where(Employee.country == country)
    if job_level is not None:
        matching = matching.where(Employee.job_level == job_level)

    total = session.scalar(select(func.count()).select_from(matching.subquery())) or 0
    # The list has many currencies, so the order uses the difference as a part of the
    # band limit, in units of 0.01%. Integer arithmetic keeps money away from floats.
    farthest_first = (difference * 10_000 // limit).desc()
    rows = session.execute(
        matching.order_by(farthest_first, Employee.employee_code)
        .limit(page_size)
        .offset((page - 1) * page_size)
    ).all()
    items = [Outlier(employee, band_limit, diff) for employee, band_limit, diff in rows]
    return Page(items=items, page=page, page_size=page_size, total=total)


def _active_employees_with_band(*columns) -> Select:
    return (
        select(*columns)
        .select_from(Employee)
        .join(
            SalaryBand,
            (SalaryBand.job_level == Employee.job_level) & (SalaryBand.country == Employee.country),
        )
        .where(Employee.status == ACTIVE)
    )


def _is_outside(status: OutlierStatus) -> ColumnElement[bool]:
    """The one definition of an outlier in SQL. It agrees with `calculations.ranges.range_status`:
    a salary equal to the minimum or the maximum is in range."""
    if status == "below":
        return Employee.salary_minor < SalaryBand.min_minor
    return Employee.salary_minor > SalaryBand.max_minor


def _limit_and_difference(status: OutlierStatus) -> tuple[ColumnElement[int], ColumnElement[int]]:
    if status == "below":
        return SalaryBand.min_minor, SalaryBand.min_minor - Employee.salary_minor
    return SalaryBand.max_minor, Employee.salary_minor - SalaryBand.max_minor
