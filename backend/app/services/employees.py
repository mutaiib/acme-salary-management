from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Employee

DEFAULT_PAGE_SIZE = 25
MAX_PAGE_SIZE = 100


@dataclass(frozen=True)
class EmployeeQuery:
    page: int = 1
    page_size: int = DEFAULT_PAGE_SIZE


@dataclass(frozen=True)
class Page[T]:
    items: list[T]
    page: int
    page_size: int
    total: int


def list_employees(session: Session, query: EmployeeQuery) -> Page[Employee]:
    total = session.scalar(select(func.count()).select_from(Employee)) or 0
    rows = session.scalars(
        select(Employee)
        .order_by(Employee.employee_code)
        .limit(query.page_size)
        .offset((query.page - 1) * query.page_size)
    ).all()
    return Page(items=list(rows), page=query.page, page_size=query.page_size, total=total)
