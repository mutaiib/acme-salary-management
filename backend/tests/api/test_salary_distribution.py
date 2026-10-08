"""FR-17, FR-13, FR-20: the salary distribution of the active employees."""

import pytest


@pytest.fixture(autouse=True)
def rates(make):
    make.rate("USD", 1_000_000)
    make.rate("EUR", 1_100_000)


def distribution(client):
    response = client.get("/api/insights/salary-distribution")
    assert response.status_code == 200
    return response.json()


def headcounts(body):
    return [bracket["headcount"] for bracket in body["brackets"]]


def test_gives_no_bracket_when_there_is_no_active_employee(client):
    body = distribution(client)

    assert body["brackets"] == []
    assert body["reporting_currency"] == "USD"


def test_gives_no_bracket_when_the_only_employee_is_inactive(client, make):
    make.employee(status="inactive", salary_minor=5_000_000)

    assert distribution(client)["brackets"] == []


def test_counts_the_active_employees_in_brackets_of_one_width(client, make):
    for salary in (1_000_000, 1_500_000, 3_000_000):
        make.employee(salary_minor=salary)

    body = distribution(client)

    # Width 200,000 minor needs 16 brackets for 3,000,000, so the width is 500,000.
    assert body["bracket_width_minor"] == 500_000
    assert body["brackets"][0] == {"from_minor": 0, "to_minor": 500_000, "headcount": 0}
    assert sum(headcounts(body)) == 3


def test_starts_at_zero_and_has_no_gap_between_brackets(client, make):
    make.employee(salary_minor=300_000)
    make.employee(salary_minor=4_200_000)

    brackets = distribution(client)["brackets"]

    assert brackets[0]["from_minor"] == 0
    for lower, upper in zip(brackets, brackets[1:], strict=False):
        assert lower["to_minor"] == upper["from_minor"]
    assert len(brackets) <= 15


def test_gives_a_headcount_of_zero_to_an_empty_bracket_between_two_others(client, make):
    make.employee(salary_minor=100_000)
    make.employee(salary_minor=2_900_000)

    counts = headcounts(distribution(client))

    assert counts[0] == 1
    assert counts[-1] == 1
    assert 0 in counts[1:-1]


def test_puts_a_salary_on_a_bracket_limit_in_the_higher_bracket(client, make):
    for salary in (999_999, 1_000_000, 3_000_000):
        make.employee(salary_minor=salary)

    body = distribution(client)

    # The width is 500,000. A salary of one minor unit below a limit stays in the lower bracket.
    assert body["bracket_width_minor"] == 500_000
    assert headcounts(body) == [0, 1, 1, 0, 0, 0, 1]
    assert body["brackets"][-1] == {"from_minor": 3_000_000, "to_minor": 3_500_000, "headcount": 1}


def test_counts_a_salary_in_euro_in_its_bracket_in_dollars(client, make):
    make.employee(country="US", currency="USD", salary_minor=1_000_000)
    make.employee(country="DE", currency="EUR", salary_minor=2_000_000)

    body = distribution(client)

    # 2,000,000 EUR minor is 2,200,000 USD minor.
    last = body["brackets"][-1]
    assert last["from_minor"] <= 2_200_000 < last["to_minor"]
    assert last["headcount"] == 1


def test_does_not_count_an_inactive_employee(client, make):
    make.employee(salary_minor=1_000_000)
    make.employee(status="inactive", salary_minor=90_000_000)

    body = distribution(client)

    assert sum(headcounts(body)) == 1
    assert body["brackets"][-1]["to_minor"] <= 2_000_000


def test_does_not_count_an_employee_whose_currency_has_no_rate(client, make):
    make.employee(salary_minor=1_000_000)
    make.employee(currency="INR", salary_minor=9_000_000)

    assert sum(headcounts(distribution(client))) == 1


def test_has_the_headcount_of_the_pay_overview(client, make):
    for salary in (800_000, 1_700_000, 2_500_000, 6_400_000):
        make.employee(salary_minor=salary)
    make.employee(status="inactive")

    overview = client.get("/api/insights/overview").json()

    assert sum(headcounts(distribution(client))) == overview["headcount"]


def test_each_bracket_headcount_is_equal_to_the_total_of_the_list_with_that_bracket(client, make):
    for salary in (100_000, 800_000, 1_000_000, 1_700_000, 2_500_000, 2_500_000, 6_400_000):
        make.employee(salary_minor=salary)
    make.employee(currency="EUR", salary_minor=2_000_000)
    # 5,454,545 EUR minor is 5,999,999.5 USD minor. A half rounds up, so it is in the bracket
    # that starts at 6,000,000. The distribution and the list must round it the same way.
    make.employee(currency="EUR", salary_minor=5_454_545)
    make.employee(status="inactive", salary_minor=2_000_000)

    brackets = distribution(client)["brackets"]
    assert any(bracket["from_minor"] == 6_000_000 for bracket in brackets)
    for bracket in brackets:
        params = {
            "status": "active",
            "salary_from_minor": bracket["from_minor"],
            "salary_to_minor": bracket["to_minor"],
        }
        assert client.get("/api/employees", params=params).json()["total"] == bracket["headcount"]
