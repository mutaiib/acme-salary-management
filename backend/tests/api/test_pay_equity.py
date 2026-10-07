"""FR-11, FR-12, FR-13, NFR-07: pay equity."""

import pytest

from app.seed import generate_dataset, write_dataset


def staff(make, country, currency, gender, salaries, **overrides):
    for salary in salaries:
        make.employee(
            country=country, currency=currency, gender=gender, salary_minor=salary, **overrides
        )


@pytest.fixture
def acme(make):
    make.rate("USD", 1_000_000)
    make.rate("EUR", 1_080_000)
    make.rate("INR", 12_000)
    # United States: men have 100,000 and women have 90,000. The gap is 10%.
    staff(make, "US", "USD", "male", [10_000_000] * 5)
    staff(make, "US", "USD", "female", [9_000_000] * 5)
    # Germany: the mean gap is 3% and the median gap is 0%.
    staff(make, "DE", "EUR", "male", [6_000_000] * 5)
    staff(make, "DE", "EUR", "female", [6_000_000, 6_000_000, 6_000_000, 5_550_000, 5_550_000])
    # India: only 4 men.
    staff(make, "IN", "INR", "male", [200_000_000] * 4)
    staff(make, "IN", "INR", "female", [100_000_000] * 5)


def equity(client):
    response = client.get("/api/insights/pay-equity")
    assert response.status_code == 200
    return response.json()


def country(body, code):
    return next(item for item in body["countries"] if item["key"] == code)


def test_shows_the_mean_gap_and_the_median_gap_of_a_country(client, acme):
    assert country(equity(client), "US") == {
        "key": "US",
        "label": "United States",
        "currency": "USD",
        "men": 5,
        "women": 5,
        "mean_gap_pct": 10.0,
        "median_gap_pct": 10.0,
        "is_flagged": True,
        "has_enough_data": True,
    }


def test_the_mean_gap_and_the_median_gap_can_be_different(client, acme):
    germany = country(equity(client), "DE")

    assert germany["mean_gap_pct"] == 3.0
    assert germany["median_gap_pct"] == 0.0


def test_a_country_with_a_mean_gap_of_3_percent_has_no_flag(client, acme):
    assert country(equity(client), "DE")["is_flagged"] is False


def test_a_country_with_fewer_than_5_men_shows_no_gap(client, acme):
    india = country(equity(client), "IN")

    assert india["has_enough_data"] is False
    assert india["mean_gap_pct"] is None
    assert india["median_gap_pct"] is None
    assert india["is_flagged"] is False
    assert (india["men"], india["women"]) == (4, 5)


def test_shows_the_gap_of_the_organization_in_the_reporting_currency(client, make):
    make.rate("USD", 1_000_000)
    make.rate("EUR", 1_080_000)
    # Men: 5 x 100,000 USD. Women: 5 x 50,000 EUR = 5 x 54,000 USD. The gap is 46%.
    staff(make, "US", "USD", "male", [10_000_000] * 5)
    staff(make, "DE", "EUR", "female", [5_000_000] * 5)

    organization = equity(client)["organization"]

    assert organization["label"] == "Organization"
    assert organization["currency"] == "USD"
    assert organization["mean_gap_pct"] == 46.0
    assert organization["median_gap_pct"] == 46.0
    assert organization["is_flagged"] is True


def test_a_negative_gap_shows_that_women_have_the_higher_pay(client, make):
    make.rate("USD", 1_000_000)
    staff(make, "US", "USD", "male", [8_000_000] * 5)
    staff(make, "US", "USD", "female", [10_000_000] * 5)

    assert country(equity(client), "US")["mean_gap_pct"] == -25.0


def test_an_inactive_employee_does_not_count_in_a_gap(client, acme, make):
    staff(make, "US", "USD", "female", [1_000_000] * 3, status="inactive")

    united_states = country(equity(client), "US")

    assert united_states["women"] == 5
    assert united_states["mean_gap_pct"] == 10.0


def test_lists_the_flagged_countries_first_and_the_countries_without_data_last(client, acme):
    assert [item["key"] for item in equity(client)["countries"]] == ["US", "DE", "IN"]


def test_shows_no_gap_for_the_organization_when_there_are_no_employees(client):
    body = equity(client)

    assert body["organization"]["has_enough_data"] is False
    assert body["organization"]["mean_gap_pct"] is None
    assert body["countries"] == []


def test_states_the_flag_threshold_and_the_minimum_group_size(client):
    body = equity(client)

    assert body["flag_threshold_pct"] == 5.0
    assert body["min_group_size"] == 5


def test_flags_exactly_the_countries_that_the_seed_script_planted(client, session):
    dataset = generate_dataset(count=10_000, seed=42)
    write_dataset(session, dataset)

    flagged = {item["key"] for item in equity(client)["countries"] if item["is_flagged"]}

    assert flagged == set(dataset.planted.gap_countries)


def test_flags_a_country_when_only_the_median_gap_is_more_than_5_percent(client, make):
    make.rate("USD", 1_000_000)
    staff(make, "US", "USD", "male", [10_000_000] * 5)
    staff(make, "US", "USD", "female", [9_400_000, 9_400_000, 9_400_000, 11_000_000, 10_800_000])

    united_states = country(equity(client), "US")

    assert united_states["mean_gap_pct"] == 0.0
    assert united_states["median_gap_pct"] == 6.0
    assert united_states["is_flagged"] is True


def test_flags_a_country_when_only_the_mean_gap_is_more_than_5_percent(client, make):
    make.rate("USD", 1_000_000)
    staff(make, "US", "USD", "male", [10_000_000] * 5)
    staff(make, "US", "USD", "female", [10_000_000, 10_000_000, 10_000_000, 8_500_000, 8_500_000])

    united_states = country(equity(client), "US")

    assert united_states["mean_gap_pct"] == 6.0
    assert united_states["median_gap_pct"] == 0.0
    assert united_states["is_flagged"] is True


def test_the_median_gap_of_a_group_with_an_even_headcount_uses_the_two_middle_salaries(
    client, make
):
    make.rate("USD", 1_000_000)
    staff(
        make,
        "US",
        "USD",
        "male",
        [8_000_000, 9_000_000, 9_000_000, 11_000_000, 11_000_000, 12_000_000],
    )
    staff(make, "US", "USD", "female", [9_000_000] * 6)

    # Median of men: (9,000,000 + 11,000,000) / 2 = 10,000,000. The gap is 10%.
    assert country(equity(client), "US")["median_gap_pct"] == 10.0


def test_lists_the_country_with_the_largest_gap_first_when_two_countries_have_a_flag(client, make):
    make.rate("USD", 1_000_000)
    make.rate("EUR", 1_080_000)
    staff(make, "US", "USD", "male", [10_000_000] * 5)
    staff(make, "US", "USD", "female", [9_000_000] * 5)
    staff(make, "DE", "EUR", "male", [10_000_000] * 5)
    staff(make, "DE", "EUR", "female", [8_000_000] * 5)

    assert [item["key"] for item in equity(client)["countries"]] == ["DE", "US"]


def test_an_employee_without_an_exchange_rate_is_not_in_a_gap(client, make):
    make.rate("USD", 1_000_000)
    staff(make, "US", "USD", "male", [10_000_000] * 5)
    staff(make, "US", "USD", "female", [9_000_000] * 5)
    staff(make, "DE", "EUR", "male", [10_000_000] * 5)
    staff(make, "DE", "EUR", "female", [5_000_000] * 5)

    body = equity(client)

    assert [item["key"] for item in body["countries"]] == ["US"]
    assert body["organization"]["men"] == 5
