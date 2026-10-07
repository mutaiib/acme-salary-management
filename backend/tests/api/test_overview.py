"""FR-01, FR-02, FR-13: the pay overview."""

from datetime import date

import pytest
from sqlalchemy import select

from app.calculations.money import convert_minor, median_minor
from app.models import Employee, ExchangeRate

RATES = {"USD": 1_000_000, "EUR": 1_080_000, "INR": 12_000}


@pytest.fixture
def acme(make):
    """Six active employees in three countries, and one inactive employee."""
    for currency, rate in RATES.items():
        make.rate(currency, rate, as_of=date(2026, 1, 1))
    us = {"country": "US", "currency": "USD"}
    de = {"country": "DE", "currency": "EUR"}
    make.employee(**us, department="Engineering", job_level=2, salary_minor=6_000_000)
    make.employee(**us, department="Sales", job_level=3, salary_minor=9_000_000)
    make.employee(**us, department="Engineering", job_level=2, salary_minor=7_000_000)
    make.employee(**de, department="Engineering", job_level=2, salary_minor=5_000_000)
    make.employee(**de, department="Sales", job_level=3, salary_minor=6_111_111)
    make.employee(
        country="IN",
        currency="INR",
        department="Engineering",
        job_level=2,
        salary_minor=150_000_000,
    )
    make.employee(**us, status="inactive", salary_minor=99_999_900)


def overview(client, group_by="country"):
    response = client.get("/api/insights/overview", params={"group_by": group_by})
    assert response.status_code == 200
    return response.json()


def group(body, key):
    return next(item for item in body["groups"] if item["key"] == key)


def test_shows_the_total_payroll_cost_in_the_reporting_currency(client, acme):
    body = overview(client)

    # 60,000 + 90,000 + 70,000 + 54,000 + 66,000 + 18,000 USD
    assert body["payroll_cost_minor"] == 35_800_000
    assert body["reporting_currency"] == "USD"


def test_shows_the_headcount_of_the_active_employees(client, acme):
    assert overview(client)["headcount"] == 6


def test_shows_the_date_of_the_exchange_rates(client, acme):
    assert overview(client)["rates_as_of"] == "2026-01-01"


def test_a_country_shows_the_cost_in_usd_and_the_salaries_in_the_local_currency(client, acme):
    germany = group(overview(client, "country"), "DE")

    assert germany == {
        "key": "DE",
        "label": "Germany",
        "headcount": 2,
        "payroll_cost_minor": 12_000_000,
        "currency": "EUR",
        "min_minor": 5_000_000,
        "median_minor": 5_555_556,
        "max_minor": 6_111_111,
    }


def test_a_country_with_an_odd_headcount_shows_the_middle_salary_as_the_median(client, acme):
    assert group(overview(client, "country"), "US")["median_minor"] == 7_000_000


def test_a_department_shows_all_figures_in_usd(client, acme):
    engineering = group(overview(client, "department"), "Engineering")

    assert engineering == {
        "key": "Engineering",
        "label": "Engineering",
        "headcount": 4,
        "payroll_cost_minor": 20_200_000,
        "currency": "USD",
        "min_minor": 1_800_000,
        "median_minor": 5_700_000,
        "max_minor": 7_000_000,
    }


def test_a_job_level_shows_all_figures_in_usd(client, acme):
    level_3 = group(overview(client, "job_level"), "3")

    assert level_3 == {
        "key": "3",
        "label": "Level 3",
        "headcount": 2,
        "payroll_cost_minor": 15_600_000,
        "currency": "USD",
        "min_minor": 6_600_000,
        "median_minor": 7_800_000,
        "max_minor": 9_000_000,
    }


def test_the_payroll_cost_is_equal_to_the_sum_of_the_group_costs(client, acme):
    for group_by in ("country", "department", "job_level"):
        body = overview(client, group_by)
        assert sum(item["payroll_cost_minor"] for item in body["groups"]) == 35_800_000


def test_an_inactive_employee_does_not_count_in_a_group(client, acme):
    assert group(overview(client, "country"), "US")["headcount"] == 3
    assert group(overview(client, "country"), "US")["max_minor"] == 9_000_000


def test_a_deactivation_lowers_the_headcount_and_the_payroll_cost(client, acme, session):
    employee = session.scalars(select(Employee).where(Employee.salary_minor == 9_000_000)).one()

    client.post(f"/api/employees/{employee.id}/deactivate")

    body = overview(client)
    assert body["headcount"] == 5
    assert body["payroll_cost_minor"] == 26_800_000


def test_lists_the_countries_with_the_highest_payroll_cost_first(client, acme):
    assert [item["key"] for item in overview(client, "country")["groups"]] == ["US", "DE", "IN"]


def test_lists_the_job_levels_in_level_order_and_not_in_cost_order(client, make):
    make.rate("USD", 1_000_000)
    make.employee(job_level=4, salary_minor=20_000_000)
    make.employee(job_level=1, salary_minor=1_000_000)

    assert [item["key"] for item in overview(client, "job_level")["groups"]] == ["1", "4"]


def test_an_employee_without_an_exchange_rate_is_not_in_the_overview(client, make):
    make.rate("USD", 1_000_000)
    make.employee(currency="USD", salary_minor=6_000_000)
    make.employee(country="BR", currency="BRL", salary_minor=9_000_000)

    body = overview(client, "department")

    assert body["headcount"] == 1
    assert body["payroll_cost_minor"] == 6_000_000


def test_the_sql_figures_agree_with_the_pure_calculations(client, acme, session):
    rates = {r.currency: r.rate_micro for r in session.scalars(select(ExchangeRate))}
    active = session.scalars(select(Employee).where(Employee.status == "active")).all()
    in_usd = [convert_minor(e.salary_minor, rates[e.currency]) for e in active]
    sales_in_usd = [
        convert_minor(e.salary_minor, rates[e.currency]) for e in active if e.department == "Sales"
    ]

    body = overview(client, "department")

    assert body["payroll_cost_minor"] == sum(in_usd)
    assert group(body, "Sales")["median_minor"] == median_minor(sales_in_usd)


def test_shows_zero_when_there_are_no_employees(client):
    body = overview(client)

    assert body["headcount"] == 0
    assert body["payroll_cost_minor"] == 0
    assert body["groups"] == []


def test_refuses_a_grouping_that_is_not_supported(client):
    response = client.get("/api/insights/overview", params={"group_by": "gender"})

    assert response.status_code == 422
    assert response.json()["detail"][0]["field"] == "group_by"
