import pytest

from app.seed import generate_dataset, write_dataset

BAND = {"min_minor": 5_000_000, "mid_minor": 6_000_000, "max_minor": 7_000_000}


@pytest.fixture
def acme(make):
    """One band in the US and one in Germany, with employees below, in and above each band."""
    make.rate("USD", 1_000_000)
    make.rate("EUR", 1_080_000)
    make.band(country="US", job_level=2, **BAND)
    make.band(country="DE", job_level=3, currency="EUR", **BAND)
    us = {"country": "US", "currency": "USD", "job_level": 2}
    de = {"country": "DE", "currency": "EUR", "job_level": 3}
    make.employee(**us, full_name="Below By 5000", salary_minor=4_500_000)
    make.employee(**us, full_name="At Minimum", salary_minor=5_000_000)
    make.employee(**us, full_name="In Range", salary_minor=6_000_000)
    make.employee(**us, full_name="At Maximum", salary_minor=7_000_000)
    make.employee(**us, full_name="Above By 10000", salary_minor=8_000_000)
    make.employee(**de, full_name="Below By 10000 EUR", salary_minor=4_000_000)
    make.employee(**us, full_name="Inactive Below", salary_minor=1_000_000, status="inactive")
    make.employee(country="IN", currency="INR", job_level=2, full_name="No Band")


def summary(client):
    return client.get("/api/insights/pay-health").json()


def outliers(client, status, **params):
    response = client.get("/api/insights/pay-health/employees", params={"status": status, **params})
    assert response.status_code == 200
    return response.json()


def names(body):
    return [item["full_name"] for item in body["items"]]


def test_counts_the_employees_below_range_and_above_range(client, acme):
    body = summary(client)

    assert body["below_count"] == 2
    assert body["above_count"] == 1


def test_a_salary_at_the_minimum_or_the_maximum_is_not_an_outlier(client, acme):
    listed = names(outliers(client, "below")) + names(outliers(client, "above"))

    assert "At Minimum" not in listed
    assert "At Maximum" not in listed


def test_the_correction_cost_is_the_sum_of_the_differences_to_the_minimum_in_usd(client, acme):
    # 5,000 USD + 10,000 EUR x 1.08 = 15,800 USD
    assert summary(client)["correction_cost_minor"] == 1_580_000
    assert summary(client)["reporting_currency"] == "USD"


def test_lists_a_below_range_employee_with_the_band_minimum_and_the_difference(client, acme):
    item = next(i for i in outliers(client, "below")["items"] if i["full_name"] == "Below By 5000")

    assert item["salary_minor"] == 4_500_000
    assert item["band_limit_minor"] == 5_000_000
    assert item["difference_minor"] == 500_000
    assert item["currency"] == "USD"


def test_lists_an_above_range_employee_with_the_band_maximum_and_the_difference(client, acme):
    item = outliers(client, "above")["items"][0]

    assert item["full_name"] == "Above By 10000"
    assert item["band_limit_minor"] == 7_000_000
    assert item["difference_minor"] == 1_000_000


def test_lists_the_employee_who_is_farthest_from_the_band_first(client, acme):
    assert names(outliers(client, "below")) == ["Below By 10000 EUR", "Below By 5000"]


def test_the_list_total_is_equal_to_the_count(client, acme):
    assert outliers(client, "below")["total"] == summary(client)["below_count"]
    assert outliers(client, "above")["total"] == summary(client)["above_count"]


def test_filters_the_list_by_country(client, acme):
    assert names(outliers(client, "below", country="DE")) == ["Below By 10000 EUR"]


def test_filters_the_list_by_job_level(client, acme):
    assert names(outliers(client, "below", job_level=2)) == ["Below By 5000"]


def test_an_inactive_employee_is_not_an_outlier(client, acme):
    assert "Inactive Below" not in names(outliers(client, "below"))


def test_an_employee_without_a_band_is_not_an_outlier(client, acme):
    listed = names(outliers(client, "below")) + names(outliers(client, "above"))

    assert "No Band" not in listed


def test_a_correction_to_the_minimum_lowers_the_below_range_count_by_1(client, acme):
    employee_id = outliers(client, "below", country="US")["items"][0]["id"]

    client.post(
        f"/api/employees/{employee_id}/salary-changes",
        json={
            "new_salary_minor": 5_000_000,
            "reason": "Correction to the band minimum",
            "effective_date": "2026-03-01",
        },
    )

    body = summary(client)
    assert body["below_count"] == 1
    assert body["correction_cost_minor"] == 1_080_000


def test_paginates_the_list(client, make):
    make.rate("USD", 1_000_000)
    make.band(**BAND)
    for _ in range(30):
        make.employee(salary_minor=4_000_000)

    body = outliers(client, "below", page=2)

    assert len(body["items"]) == 5
    assert body["total"] == 30


def test_shows_zero_when_no_employee_is_outside_the_band(client, make):
    make.rate("USD", 1_000_000)
    make.band(**BAND)
    make.employee(salary_minor=6_000_000)

    assert summary(client) == {
        "below_count": 0,
        "above_count": 0,
        "correction_cost_minor": 0,
        "reporting_currency": "USD",
    }
    assert outliers(client, "below")["items"] == []


def test_refuses_a_status_that_is_not_below_or_above(client):
    response = client.get("/api/insights/pay-health/employees", params={"status": "in_range"})

    assert response.status_code == 422


def test_finds_exactly_the_outliers_that_the_seed_script_planted(client, session):
    dataset = generate_dataset(count=2_000, seed=42)
    write_dataset(session, dataset)

    body = summary(client)

    assert body["below_count"] == dataset.planted.below_range
    assert body["above_count"] == dataset.planted.above_range
