"""FR-03, FR-04, FR-05, FR-06, FR-13: the employee list, salary changes and deactivation.

Tests: tests/api/test_employees_list.py, test_employee_search.py, test_salary_changes.py,
test_deactivate.py.
"""

import logging
from dataclasses import dataclass
from datetime import date, datetime

from sqlalchemy import ColumnElement, Select, func, literal, select
from sqlalchemy.orm import Session

from app.calculations.salary_changes import SalaryChangeError, validate_salary_change
from app.errors import EMPLOYEE_FIELD, DomainError, NotFoundError
from app.models import Employee, SalaryChange
from app.reference import ACTIVE, INACTIVE, REPORTING_CURRENCY
from app.services.pagination import DEFAULT_PAGE_SIZE, Page, paginate
from app.services.sql import (
    GROUP,
    VALUE,
    active_employees_with_rate,
    matches_search,
    median_by_group,
    reporting_minor,
)

logger = logging.getLogger(__name__)

DEFAULT_SORT = "employee_code"
SORT_COLUMNS = {
    DEFAULT_SORT: Employee.employee_code,
    "name": Employee.full_name,
    "hire_date": Employee.hire_date,
}
# A minus sign before the name gives the reverse order.
SORT_OPTIONS = tuple(SORT_COLUMNS) + tuple(f"-{name}" for name in SORT_COLUMNS)


@dataclass(frozen=True)
class EmployeeQuery:
    page: int = 1
    page_size: int = DEFAULT_PAGE_SIZE
    search: str | None = None
    country: str | None = None
    department: str | None = None
    job_level: int | None = None
    status: str | None = None
    sort: str = DEFAULT_SORT


def list_employees(session: Session, query: EmployeeQuery) -> Page[Employee]:
    return paginate(
        session,
        _matching(select(Employee), query),
        _order(query.sort),
        query.page,
        query.page_size,
        as_entities=True,
    )


@dataclass(frozen=True)
class SalaryFigures:
    """The lowest, the middle and the highest salary of a group of employees."""

    currency: str
    min_minor: int
    median_minor: int
    max_minor: int


@dataclass(frozen=True)
class EmployeeSummary:
    headcount: int
    payroll_cost_minor: int
    reporting_currency: str
    # True when all these employees have the same currency.
    has_one_currency: bool
    # None when no active employee matches.
    salary: SalaryFigures | None


_ALL = "all"


def summarize(session: Session, query: EmployeeQuery) -> EmployeeSummary:
    """The pay figures of the active employees that the list shows for the same query.

    The payroll cost is in the reporting currency. When all these employees have one
    currency, the salary figures are in that currency. If not, they are in the
    reporting currency.
    """

    def active_matching(*columns: ColumnElement) -> Select:
        return _matching(active_employees_with_rate(*columns), query)

    headcount, cost, currencies, a_currency = session.execute(
        active_matching(
            func.count(),
            func.coalesce(func.sum(reporting_minor(Employee.salary_minor)), 0),
            func.count(Employee.currency.distinct()),
            func.min(Employee.currency),
        )
    ).one()
    if headcount == 0:
        return EmployeeSummary(0, 0, REPORTING_CURRENCY, True, None)

    has_one_currency = currencies == 1
    salary = Employee.salary_minor if has_one_currency else reporting_minor(Employee.salary_minor)
    lowest, highest = session.execute(active_matching(func.min(salary), func.max(salary))).one()
    median = median_by_group(
        session, active_matching(literal(_ALL).label(GROUP), salary.label(VALUE))
    )[_ALL]
    return EmployeeSummary(
        headcount=headcount,
        payroll_cost_minor=int(cost),
        reporting_currency=REPORTING_CURRENCY,
        has_one_currency=has_one_currency,
        salary=SalaryFigures(
            currency=a_currency if has_one_currency else REPORTING_CURRENCY,
            min_minor=int(lowest),
            median_minor=median,
            max_minor=int(highest),
        ),
    )


def _matching(statement: Select, query: EmployeeQuery) -> Select:
    if query.search:
        statement = statement.where(matches_search(query.search))
    filters = {
        Employee.country: query.country,
        Employee.department: query.department,
        Employee.job_level: query.job_level,
        Employee.status: query.status,
    }
    for column, value in filters.items():
        # An empty value means "no filter", the same as in the other lists.
        if value:
            statement = statement.where(column == value)
    return statement


def _order(sort: str) -> tuple[ColumnElement, ...]:
    column = SORT_COLUMNS[sort.lstrip("-")]
    primary = column.desc() if sort.startswith("-") else column.asc()
    # The employee code makes the order stable when two rows have the same value.
    return primary, Employee.employee_code.asc()


def get_employee(session: Session, employee_id: int) -> Employee:
    employee = session.get(Employee, employee_id)
    if employee is None:
        raise NotFoundError("employee")
    return employee


def change_salary(
    session: Session,
    employee_id: int,
    new_salary_minor: int,
    reason: str,
    effective_date: date,
    today: date,
    now: datetime,
) -> SalaryChange:
    """Sets a new salary and records the change. The two writes are one transaction."""
    employee = get_employee(session, employee_id)
    _require_active(employee)
    try:
        validate_salary_change(
            current_salary_minor=employee.salary_minor,
            new_salary_minor=new_salary_minor,
            reason=reason,
            effective_date=effective_date,
            hire_date=employee.hire_date,
            last_change_date=_last_change_date(session, employee.id),
            today=today,
        )
    except SalaryChangeError as error:
        raise DomainError(error.field, error.cause) from error

    change = SalaryChange(
        employee=employee,
        old_salary_minor=employee.salary_minor,
        new_salary_minor=new_salary_minor,
        reason=reason.strip(),
        effective_date=effective_date,
        created_at=now,
    )
    employee.salary_minor = new_salary_minor
    session.add(change)
    session.commit()
    logger.info(
        "Salary change: employee=%s old=%s new=%s effective=%s",
        employee.id,
        change.old_salary_minor,
        change.new_salary_minor,
        change.effective_date,
    )
    return change


def _last_change_date(session: Session, employee_id: int) -> date | None:
    return session.scalar(
        select(func.max(SalaryChange.effective_date)).where(SalaryChange.employee_id == employee_id)
    )


def list_salary_changes(session: Session, employee_id: int) -> list[SalaryChange]:
    """The salary history of one employee, newest first."""
    get_employee(session, employee_id)
    return list(
        session.scalars(
            select(SalaryChange)
            .where(SalaryChange.employee_id == employee_id)
            .order_by(SalaryChange.effective_date.desc(), SalaryChange.id.desc())
        )
    )


def deactivate(session: Session, employee_id: int) -> Employee:
    employee = get_employee(session, employee_id)
    _require_active(employee)
    employee.status = INACTIVE
    session.commit()
    logger.info("Deactivation: employee=%s", employee.id)
    return employee


def _require_active(employee: Employee) -> None:
    if employee.status != ACTIVE:
        raise DomainError(EMPLOYEE_FIELD, "The employee is not active.")
