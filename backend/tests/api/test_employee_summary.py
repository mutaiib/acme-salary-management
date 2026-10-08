"""FR-01, FR-02, FR-03, FR-20: the pay figures of the employees that the list shows."""

import pytest


@pytest.fixture
def acme(make):
    """Engineering and Sales in the United States and in Germany, and one inactive employee."""
    make.rate("USD", 1_000_000)
    make.rate("EUR", 1_080_000)
    us = {"country": "US", "currency": "USD"}
    de = {"country": "DE", "currency": "EUR"}
    make.employee(**us, department="Engineering", job_level=2, salary_minor=6_000_000)
    make.employee(**us, department="Sales", job_level=3, salary_minor=9_000_000)
    make.employee(**de, department="Engineering", job_level=2, salary_minor=5_000_000)
    make.employee(**de, department="Engineering", job_level=3, salary_minor=7_000_000)
    make.employee(**de, department="Sales", job_level=3, salary_minor=6_000_000)
    make.employee(**de, department="Engineering", salary_minor=9_900_000, status="inactive")


def summary(client, **params):
    response = client.get("/api/employees/summary", params=params)
    assert response.status_code == 200
    return response.json()


def test_answers_what_one_department_costs_in_one_country(client, acme):
    body = summary(client, country="DE", department="Engineering")

    # 50,000 EUR + 70,000 EUR = 120,000 EUR = 129,600 USD.
    assert body["headcount"] == 2
    assert body["payroll_cost_minor"] == 12_960_000
    assert body["reporting_currency"] == "USD"


def test_shows_the_salaries_of_one_country_in_the_local_currency(client, acme):
    body = summary(client, country="DE")

    assert body["salary"] == {
        "currency": "EUR",
        "min_minor": 5_000_000,
        "median_minor": 6_000_000,
        "max_minor": 7_000_000,
    }


def test_shows_the_salaries_of_two_countries_in_the_reporting_currency(client, acme):
    body = summary(client, department="Engineering")

    # In USD: 54,000 60,000 75,600. The median is the middle value.
    assert body["salary"] == {
        "currency": "USD",
        "min_minor": 5_400_000,
        "median_minor": 6_000_000,
        "max_minor": 7_560_000,
    }


def test_the_median_of_an_even_number_of_salaries_is_the_mean_of_the_two_middle_salaries(
    client, acme
):
    # Germany, Engineering: 50,000 and 70,000 EUR.
    assert summary(client, country="DE", department="Engineering")["salary"]["median_minor"] == (
        6_000_000
    )


def test_states_when_the_employees_have_one_currency(client, acme):
    assert summary(client, country="DE")["has_one_currency"] is True
    assert summary(client, department="Engineering")["has_one_currency"] is False


def test_follows_the_job_level_filter(client, acme):
    assert summary(client, job_level=3)["headcount"] == 3


def test_follows_the_search_text(client, acme, make):
    make.employee(full_name="Asha Rao", country="US", currency="USD", salary_minor=8_000_000)

    body = summary(client, search="asha")

    assert body["headcount"] == 1
    assert body["payroll_cost_minor"] == 8_000_000


def test_counts_all_the_active_employees_without_a_filter(client, acme):
    body = summary(client)

    # 60,000 + 90,000 USD, and (50,000 + 70,000 + 60,000) EUR x 1.08 = 194,400 USD.
    assert body["headcount"] == 5
    assert body["payroll_cost_minor"] == 34_440_000


def test_an_inactive_employee_is_not_in_the_figures(client, acme):
    body = summary(client, country="DE", department="Engineering")

    assert body["salary"]["max_minor"] == 7_000_000


def test_a_list_of_inactive_employees_has_no_pay_figures(client, acme):
    body = summary(client, status="inactive")

    assert body["headcount"] == 0
    assert body["salary"] is None


def test_shows_zero_and_no_salary_figures_when_no_employee_matches(client, acme):
    body = summary(client, department="Legal")

    assert body == {
        "headcount": 0,
        "payroll_cost_minor": 0,
        "reporting_currency": "USD",
        "has_one_currency": True,
        "salary": None,
    }


def test_the_headcount_is_equal_to_the_total_of_the_list_of_active_employees(client, acme):
    filters = {"country": "DE", "status": "active"}

    listed = client.get("/api/employees", params=filters).json()["total"]

    assert summary(client, **filters)["headcount"] == listed


def test_sums_only_the_employees_of_the_salary_bracket(client, acme):
    body = summary(client, salary_from_minor=6_000_000, salary_to_minor=7_500_000, status="active")

    # 60,000 USD, 70,000 EUR (75,600 USD is out), 60,000 EUR (64,800 USD).
    assert body["headcount"] == 2
    assert body["payroll_cost_minor"] == 6_000_000 + 6_480_000


def test_the_summary_with_a_bracket_agrees_with_the_list(client, acme):
    filters = {"salary_from_minor": 5_000_000, "salary_to_minor": 7_000_000, "status": "active"}

    listed = client.get("/api/employees", params=filters).json()["total"]

    assert summary(client, **filters)["headcount"] == listed
