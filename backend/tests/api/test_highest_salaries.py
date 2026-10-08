"""FR-19, FR-13: the 10 active employees with the highest salary."""

import pytest


@pytest.fixture(autouse=True)
def rates(make):
    make.rate("USD", 1_000_000)
    make.rate("EUR", 1_100_000)


def highest(client, **params):
    response = client.get("/api/insights/highest-salaries", params=params)
    assert response.status_code == 200
    return response.json()


def codes(rows):
    return [row["employee_code"] for row in rows]


def test_gives_an_empty_list_when_there_is_no_active_employee(client):
    assert highest(client) == []


def test_puts_the_highest_salary_in_dollars_first(client, make):
    make.employee(employee_code="A", salary_minor=1_000_000)
    make.employee(employee_code="B", salary_minor=3_000_000)
    make.employee(employee_code="C", salary_minor=2_000_000)

    assert codes(highest(client)) == ["B", "C", "A"]


def test_puts_a_salary_in_euro_that_is_lower_as_a_number_but_higher_in_dollars_first(client, make):
    make.employee(employee_code="US", country="US", currency="USD", salary_minor=2_000_000)
    make.employee(employee_code="DE", country="DE", currency="EUR", salary_minor=1_900_000)

    rows = highest(client)

    # 1,900,000 EUR minor is 2,090,000 USD minor.
    assert codes(rows) == ["DE", "US"]
    assert rows[0]["salary_minor"] == 1_900_000
    assert rows[0]["salary_reporting_minor"] == 2_090_000


def test_orders_an_equal_salary_by_employee_code(client, make):
    for code in ("E3", "E1", "E2"):
        make.employee(employee_code=code, salary_minor=5_000_000)

    assert codes(highest(client)) == ["E1", "E2", "E3"]


def test_keeps_the_lowest_codes_when_an_equal_salary_crosses_the_limit(client, make):
    for code in ("E07", "E03", "E10", "E01", "E05", "E09", "E02", "E00", "E08", "E04", "E06"):
        make.employee(employee_code=code, salary_minor=5_000_000)

    assert codes(highest(client)) == [f"E{number:02d}" for number in range(10)]


def test_gives_at_most_10_employees(client, make):
    for number in range(12):
        make.employee(employee_code=f"E{number:02d}", salary_minor=1_000_000 + number)

    rows = highest(client)

    assert len(rows) == 10
    assert codes(rows)[0] == "E11"
    assert "E00" not in codes(rows)


def test_gives_the_employees_of_one_country_only(client, make):
    make.employee(employee_code="US1", country="US", salary_minor=9_000_000)
    make.employee(employee_code="DE1", country="DE", currency="EUR", salary_minor=1_000_000)
    make.employee(employee_code="DE2", country="DE", currency="EUR", salary_minor=2_000_000)

    assert codes(highest(client, country="DE")) == ["DE2", "DE1"]


def test_gives_the_fields_of_a_row(client, make):
    employee = make.employee(
        employee_code="A", job_title="Designer", job_level=3, department="Design"
    )

    row = highest(client)[0]

    assert row == {
        "id": employee.id,
        "employee_code": "A",
        "full_name": employee.full_name,
        "job_title": "Designer",
        "job_level": 3,
        "department": "Design",
        "country": "US",
        "currency": "USD",
        "salary_minor": 6_500_000,
        "salary_reporting_minor": 6_500_000,
        "compa_ratio": None,
    }


def test_gives_the_compa_ratio_of_the_salary_band_of_the_country(client, make):
    make.band(job_level=2, country="US", mid_minor=5_000_000)
    make.employee(salary_minor=6_500_000, job_level=2, country="US")

    assert highest(client)[0]["compa_ratio"] == 1.3


def test_keeps_an_employee_with_no_salary_band_with_a_compa_ratio_of_null(client, make):
    make.band(job_level=2, country="US")
    make.employee(employee_code="BAND", job_level=2, salary_minor=1_000_000)
    make.employee(employee_code="FREE", job_level=5, salary_minor=2_000_000)

    rows = {row["employee_code"]: row for row in highest(client)}

    assert rows["FREE"]["compa_ratio"] is None
    # 1,000,000 over the default midpoint of 6,500,000.
    assert rows["BAND"]["compa_ratio"] == 0.15


def test_gives_a_compa_ratio_of_null_when_only_another_country_has_a_band_at_the_level(
    client, make
):
    make.band(job_level=2, country="US")
    make.employee(employee_code="US1", country="US", job_level=2, salary_minor=1_000_000)
    make.employee(
        employee_code="DE1", country="DE", currency="EUR", job_level=2, salary_minor=1_000_000
    )

    rows = {row["employee_code"]: row for row in highest(client)}

    assert rows["US1"]["compa_ratio"] == 0.15
    assert rows["DE1"]["compa_ratio"] is None


def test_does_not_list_an_inactive_employee(client, make):
    make.employee(employee_code="ON", salary_minor=1_000_000)
    make.employee(employee_code="OFF", status="inactive", salary_minor=90_000_000)

    assert codes(highest(client)) == ["ON"]


def test_does_not_list_an_employee_whose_currency_has_no_rate(client, make):
    make.employee(employee_code="ON", salary_minor=1_000_000)
    make.employee(employee_code="NORATE", currency="INR", salary_minor=90_000_000)

    assert codes(highest(client)) == ["ON"]
