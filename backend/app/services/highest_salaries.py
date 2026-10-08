"""FR-19, FR-13: the active employees with the highest salary in the reporting currency.

Tests: tests/api/test_highest_salaries.py.
"""

from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import Row
from sqlalchemy.orm import Session

from app.calculations.ranges import compa_ratio
from app.models import Employee, SalaryBand
from app.services.sql import active_employees_with_rate, reporting_minor

TOP_COUNT = 10


@dataclass(frozen=True)
class HighSalary:
    id: int
    employee_code: str
    full_name: str
    job_title: str
    job_level: int
    department: str
    country: str
    currency: str
    salary_minor: int
    salary_reporting_minor: int
    # None for an employee whose country and job level have no salary band.
    compa_ratio: Decimal | None


def highest_salaries(session: Session, country: str | None = None) -> list[HighSalary]:
    """The `TOP_COUNT` employees with the highest salary in the reporting currency.

    An equal salary is in the order of the employee code.
    """
    salary_reporting = reporting_minor(Employee.salary_minor)
    query = (
        active_employees_with_rate(
            Employee.id,
            Employee.employee_code,
            Employee.full_name,
            Employee.job_title,
            Employee.job_level,
            Employee.department,
            Employee.country,
            Employee.currency,
            Employee.salary_minor,
            salary_reporting.label("salary_reporting_minor"),
            SalaryBand.mid_minor,
        )
        .outerjoin(
            SalaryBand,
            (SalaryBand.job_level == Employee.job_level) & (SalaryBand.country == Employee.country),
        )
        .order_by(salary_reporting.desc(), Employee.employee_code)
        .limit(TOP_COUNT)
    )
    if country:
        query = query.where(Employee.country == country)
    return [_high_salary(row) for row in session.execute(query)]


def _high_salary(row: Row) -> HighSalary:
    fields = dict(row._mapping)
    mid_minor = fields.pop("mid_minor")
    ratio = compa_ratio(fields["salary_minor"], mid_minor) if mid_minor else None
    return HighSalary(**fields, compa_ratio=ratio)
