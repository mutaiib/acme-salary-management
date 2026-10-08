"""FR-17: the salary distribution of the active employees, in the reporting currency.

Tests: tests/api/test_salary_distribution.py, tests/unit/test_distribution.py.
"""

from dataclasses import dataclass

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.calculations.distribution import SalaryBracket, bracket_width_minor, brackets
from app.models import Employee
from app.reference import REPORTING_CURRENCY
from app.services.sql import active_employees_with_rate, reporting_minor

MAX_BRACKETS = 15


@dataclass(frozen=True)
class SalaryDistribution:
    reporting_currency: str
    bracket_width_minor: int
    brackets: list[SalaryBracket]


def salary_distribution(session: Session) -> SalaryDistribution:
    """The headcount of each salary bracket. With no active employee, the list is empty."""
    salary = reporting_minor(Employee.salary_minor)
    highest = session.execute(active_employees_with_rate(func.max(salary))).scalar()
    if highest is None:
        return SalaryDistribution(REPORTING_CURRENCY, bracket_width_minor(0, MAX_BRACKETS), [])

    width_minor = bracket_width_minor(int(highest), MAX_BRACKETS)
    index = salary // width_minor
    counts = session.execute(active_employees_with_rate(index, func.count()).group_by(index)).all()
    return SalaryDistribution(
        reporting_currency=REPORTING_CURRENCY,
        bracket_width_minor=width_minor,
        brackets=brackets({int(i): count for i, count in counts}, width_minor),
    )
