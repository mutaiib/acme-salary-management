from dataclasses import dataclass
from datetime import date, datetime

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.errors import DomainError, NotFoundError
from app.models import Employee, SalaryChange
from app.reference import ACTIVE, INACTIVE

DEFAULT_PAGE_SIZE = 25
MAX_PAGE_SIZE = 100

SORT_COLUMNS = {
    "employee_code": Employee.employee_code,
    "name": Employee.full_name,
    "hire_date": Employee.hire_date,
}
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
    sort: str = "employee_code"


@dataclass(frozen=True)
class Page[T]:
    items: list[T]
    page: int
    page_size: int
    total: int


def list_employees(session: Session, query: EmployeeQuery) -> Page[Employee]:
    matching = _matching(select(Employee), query)
    total = session.scalar(select(func.count()).select_from(matching.subquery())) or 0
    rows = session.scalars(
        matching.order_by(*_order(query.sort))
        .limit(query.page_size)
        .offset((query.page - 1) * query.page_size)
    ).all()
    return Page(items=list(rows), page=query.page, page_size=query.page_size, total=total)


def _matching(statement: Select, query: EmployeeQuery) -> Select:
    if query.search:
        pattern = f"%{_escape_like(query.search.strip())}%"
        statement = statement.where(
            or_(
                Employee.full_name.ilike(pattern, escape="\\"),
                Employee.email.ilike(pattern, escape="\\"),
                Employee.employee_code.ilike(pattern, escape="\\"),
            )
        )
    filters = {
        Employee.country: query.country,
        Employee.department: query.department,
        Employee.job_level: query.job_level,
        Employee.status: query.status,
    }
    for column, value in filters.items():
        if value is not None:
            statement = statement.where(column == value)
    return statement


def _escape_like(text: str) -> str:
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _order(sort: str) -> tuple:
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
    if new_salary_minor <= 0:
        raise DomainError("new_salary_minor", "The salary must be more than zero.")
    if not reason.strip():
        raise DomainError("reason", "Give a reason for the salary change.")
    if effective_date > today:
        raise DomainError("effective_date", "The effective date must not be in the future.")
    if new_salary_minor == employee.salary_minor:
        raise DomainError("new_salary_minor", "The new salary is equal to the current salary.")

    change = SalaryChange(
        employee_id=employee.id,
        old_salary_minor=employee.salary_minor,
        new_salary_minor=new_salary_minor,
        reason=reason.strip(),
        effective_date=effective_date,
        created_at=now,
    )
    employee.salary_minor = new_salary_minor
    session.add(change)
    session.commit()
    return change


def list_salary_changes(session: Session, employee_id: int) -> list[SalaryChange]:
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
    return employee


def _require_active(employee: Employee) -> None:
    if employee.status != ACTIVE:
        raise DomainError("employee", "The employee is not active.")
