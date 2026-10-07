from sqlalchemy import func, select

from app.models import Employee, ExchangeRate, SalaryBand, SalaryChange
from app.seed import generate_dataset, write_dataset


def count(session, model) -> int:
    return session.scalar(select(func.count()).select_from(model))


def test_stores_each_employee_band_and_exchange_rate(session):
    dataset = generate_dataset(count=200, seed=42)

    write_dataset(session, dataset)

    assert count(session, Employee) == 200
    assert count(session, SalaryBand) == len(dataset.bands)
    assert count(session, ExchangeRate) == len(dataset.rates)


def test_stores_the_first_salary_of_each_employee_in_the_salary_history(session):
    write_dataset(session, generate_dataset(count=200, seed=42))

    first = session.scalars(select(SalaryChange).where(SalaryChange.employee_id == 1)).one()
    employee = session.get(Employee, 1)

    assert count(session, SalaryChange) == 200
    assert first.old_salary_minor is None
    assert first.new_salary_minor == employee.salary_minor
    assert first.effective_date == employee.hire_date
