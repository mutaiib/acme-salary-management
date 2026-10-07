from dataclasses import dataclass
from datetime import date
from typing import Literal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Employee
from app.reference import COUNTRIES, REPORTING_CURRENCY
from app.services.meta import rates_as_of
from app.services.sql import active_employees_with_rate, median_by_group, usd_minor

GroupBy = Literal["country", "department", "job_level"]

GROUP_COLUMNS = {
    "country": Employee.country,
    "department": Employee.department,
    "job_level": Employee.job_level,
}


@dataclass(frozen=True)
class GroupFigures:
    key: str
    label: str
    headcount: int
    payroll_cost_minor: int
    # The currency of the minimum, the median and the maximum.
    currency: str
    min_minor: int
    median_minor: int
    max_minor: int


@dataclass(frozen=True)
class Overview:
    reporting_currency: str
    payroll_cost_minor: int
    headcount: int
    rates_as_of: date | None
    group_by: str
    groups: list[GroupFigures]


def overview(session: Session, group_by: GroupBy) -> Overview:
    """The payroll cost and the salary figures of the active employees, by group.

    The payroll cost is always in the reporting currency. The salaries of one country
    have one currency, so a country shows them in the local currency. A department
    or a job level has many currencies, so it shows them in the reporting currency.
    """
    group = GROUP_COLUMNS[group_by]
    cost = usd_minor(Employee.salary_minor)
    salary = Employee.salary_minor if group_by == "country" else cost

    aggregates = session.execute(
        active_employees_with_rate(
            group, func.count(), func.sum(cost), func.min(salary), func.max(salary)
        ).group_by(group)
    ).all()
    medians = median_by_group(
        session, active_employees_with_rate(group.label("grp"), salary.label("val"))
    )

    groups = [
        GroupFigures(
            key=str(key),
            label=_label(group_by, key),
            headcount=headcount,
            payroll_cost_minor=int(cost_minor),
            currency=COUNTRIES[key].currency if group_by == "country" else REPORTING_CURRENCY,
            min_minor=int(min_minor),
            median_minor=medians[key],
            max_minor=int(max_minor),
        )
        for key, headcount, cost_minor, min_minor, max_minor in aggregates
    ]
    return Overview(
        reporting_currency=REPORTING_CURRENCY,
        payroll_cost_minor=sum(g.payroll_cost_minor for g in groups),
        headcount=sum(g.headcount for g in groups),
        rates_as_of=rates_as_of(session),
        group_by=group_by,
        groups=_ordered(group_by, groups),
    )


def _label(group_by: GroupBy, key) -> str:
    if group_by == "country":
        return COUNTRIES[key].name
    if group_by == "job_level":
        return f"Level {key}"
    return str(key)


def _ordered(group_by: GroupBy, groups: list[GroupFigures]) -> list[GroupFigures]:
    if group_by == "job_level":
        return sorted(groups, key=lambda g: int(g.key))
    return sorted(groups, key=lambda g: g.payroll_cost_minor, reverse=True)
