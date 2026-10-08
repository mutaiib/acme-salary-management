"""FR-07, FR-15, FR-16: salary bands, the figures of each band and the preview of a change."""

import pytest


def test_lists_the_band_of_each_job_level_in_each_country(client, make):
    make.band(country="US", job_level=2)
    make.band(
        country="US", job_level=1, min_minor=3_600_000, mid_minor=4_500_000, max_minor=5_400_000
    )
    make.band(country="DE", job_level=1, currency="EUR")

    bands = client.get("/api/bands").json()

    assert [(b["country"], b["job_level"]) for b in bands] == [("DE", 1), ("US", 1), ("US", 2)]
    assert bands[1] | {"id": 0} == {
        "id": 0,
        "job_level": 1,
        "country": "US",
        "currency": "USD",
        "min_minor": 3_600_000,
        "mid_minor": 4_500_000,
        "max_minor": 5_400_000,
        "headcount": 0,
        "below_count": 0,
        "above_count": 0,
    }


def test_filters_the_bands_by_country(client, make):
    make.band(country="US")
    make.band(country="DE", currency="EUR")

    bands = client.get("/api/bands", params={"country": "DE"}).json()

    assert [b["country"] for b in bands] == ["DE"]


def test_changes_the_minimum_the_midpoint_and_the_maximum_of_a_band(client, make):
    band = make.band()

    response = client.put(
        f"/api/bands/{band.id}",
        json={"min_minor": 5_000_000, "mid_minor": 6_000_000, "max_minor": 7_000_000},
    )

    assert response.status_code == 200
    saved = client.get("/api/bands").json()[0]
    assert (saved["min_minor"], saved["mid_minor"], saved["max_minor"]) == (
        5_000_000,
        6_000_000,
        7_000_000,
    )


def test_refuses_a_minimum_that_is_not_less_than_the_midpoint(client, make):
    band = make.band()

    response = client.put(
        f"/api/bands/{band.id}",
        json={"min_minor": 6_000_000, "mid_minor": 6_000_000, "max_minor": 7_000_000},
    )

    assert response.status_code == 422
    assert response.json()["detail"][0] == {
        "field": "min_minor",
        "cause": "The minimum must be less than the midpoint.",
    }


def test_refuses_a_midpoint_that_is_not_less_than_the_maximum(client, make):
    band = make.band()

    response = client.put(
        f"/api/bands/{band.id}",
        json={"min_minor": 5_000_000, "mid_minor": 7_500_000, "max_minor": 7_000_000},
    )

    assert response.status_code == 422
    assert response.json()["detail"][0] == {
        "field": "mid_minor",
        "cause": "The midpoint must be less than the maximum.",
    }


def test_a_refused_change_keeps_the_band(client, make):
    band = make.band(min_minor=5_200_000)

    client.put(
        f"/api/bands/{band.id}",
        json={"min_minor": 9_000_000, "mid_minor": 6_000_000, "max_minor": 7_000_000},
    )

    assert client.get("/api/bands").json()[0]["min_minor"] == 5_200_000


def test_returns_404_for_a_band_that_does_not_exist(client):
    response = client.put(
        "/api/bands/999",
        json={"min_minor": 5_000_000, "mid_minor": 6_000_000, "max_minor": 7_000_000},
    )

    assert response.status_code == 404


def test_refuses_a_band_value_above_the_largest_amount_that_the_system_keeps(client, make):
    band = make.band()

    response = client.put(
        f"/api/bands/{band.id}",
        json={"min_minor": 5_000_000, "mid_minor": 6_000_000, "max_minor": 10**12 + 1},
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["field"] == "max_minor"


def test_refuses_a_minimum_that_is_not_more_than_zero(client, make):
    band = make.band()

    response = client.put(
        f"/api/bands/{band.id}",
        json={"min_minor": 0, "mid_minor": 6_000_000, "max_minor": 7_000_000},
    )

    assert response.status_code == 422
    assert response.json()["detail"][0] == {
        "field": "min_minor",
        "cause": "The minimum must be more than zero.",
    }


def test_counts_the_employees_of_each_band_and_those_below_or_above_range(client, make):
    make.rate("USD", 1_000_000)
    band = make.band(min_minor=5_000_000, mid_minor=6_000_000, max_minor=7_000_000)
    other_band = make.band(country="DE", currency="EUR")
    for salary in (4_999_999, 5_000_000, 6_000_000, 7_000_000, 7_000_001):
        make.employee(salary_minor=salary)
    make.employee(salary_minor=1_000_000, status="inactive")
    make.employee(salary_minor=1_000_000, job_level=3)

    bands = {b["id"]: b for b in client.get("/api/bands").json()}

    assert (bands[band.id]["headcount"], bands[band.id]["below_count"]) == (5, 1)
    assert bands[band.id]["above_count"] == 1
    other = bands[other_band.id]
    assert (other["headcount"], other["below_count"], other["above_count"]) == (0, 0, 0)


def test_a_band_with_no_employee_has_zero_in_each_count(client, make):
    make.rate("USD", 1_000_000)
    make.band()

    band = client.get("/api/bands").json()[0]

    assert (band["headcount"], band["below_count"], band["above_count"]) == (0, 0, 0)


def test_does_not_count_an_employee_who_has_no_exchange_rate(client, make):
    make.band()
    make.employee()

    assert client.get("/api/bands").json()[0]["headcount"] == 0


def preview(client, band, **limits):
    body = {"min_minor": 5_000_000, "mid_minor": 6_000_000, "max_minor": 7_000_000, **limits}
    return client.post(f"/api/bands/{band.id}/preview", json=body)


@pytest.fixture
def us_band(make):
    make.rate("USD", 1_000_000)
    make.rate("EUR", 1_100_000)
    band = make.band(min_minor=5_000_000, mid_minor=6_000_000, max_minor=7_000_000)
    for salary in (4_500_000, 5_000_000, 6_000_000, 7_000_000, 8_000_000):
        make.employee(salary_minor=salary)
    # These two have a low salary, but no band exists for their job level or their country.
    # They are not in the band of the preview.
    make.employee(salary_minor=1_000_000, job_level=3)
    make.employee(country="DE", currency="EUR", salary_minor=1_000_000)
    return band


def test_a_higher_minimum_moves_an_employee_below_range_and_raises_the_correction_cost(
    client, us_band
):
    body = preview(client, us_band, min_minor=5_500_000, mid_minor=6_000_000).json()

    assert body["current"] == {
        "headcount": 5,
        "below_count": 1,
        "above_count": 1,
        "correction_cost_minor": 500_000,
    }
    assert body["proposed"]["below_count"] == 2
    assert body["proposed"]["correction_cost_minor"] == 1_000_000 + 500_000


def test_a_lower_maximum_moves_an_employee_above_range(client, us_band):
    body = preview(client, us_band, max_minor=6_500_000).json()

    assert (body["current"]["above_count"], body["proposed"]["above_count"]) == (1, 2)
    assert body["proposed"]["headcount"] == 5


def test_a_salary_on_the_proposed_limit_is_not_outside(client, us_band):
    body = preview(client, us_band, min_minor=4_500_000, max_minor=8_000_000).json()

    assert (body["current"]["below_count"], body["current"]["above_count"]) == (1, 1)
    assert (body["proposed"]["below_count"], body["proposed"]["above_count"]) == (0, 0)


def test_a_preview_of_the_midpoint_alone_changes_no_count(client, us_band):
    body = preview(client, us_band, mid_minor=6_500_000).json()

    assert body["proposed"] == body["current"]


def test_a_preview_does_not_change_the_band(client, session, us_band):
    preview(client, us_band, min_minor=5_500_000)

    session.refresh(us_band)
    assert (us_band.min_minor, us_band.mid_minor, us_band.max_minor) == (
        5_000_000,
        6_000_000,
        7_000_000,
    )


def test_a_preview_refuses_a_band_that_a_change_refuses(client, us_band):
    response = preview(client, us_band, min_minor=6_000_000)

    assert response.status_code == 422
    assert response.json()["detail"][0]["field"] == "min_minor"


def test_a_preview_returns_404_for_a_band_that_does_not_exist(client):
    response = client.post(
        "/api/bands/999/preview",
        json={"min_minor": 5_000_000, "mid_minor": 6_000_000, "max_minor": 7_000_000},
    )

    assert response.status_code == 404


def test_the_correction_cost_of_a_preview_is_in_the_reporting_currency(client, make):
    make.rate("USD", 1_000_000)
    make.rate("EUR", 1_100_000)
    band = make.band(
        country="DE", currency="EUR", min_minor=5_000_000, mid_minor=6_000_000, max_minor=7_000_000
    )
    make.employee(country="DE", currency="EUR", salary_minor=4_000_000)

    body = preview(client, band).json()

    assert body["reporting_currency"] == "USD"
    assert body["proposed"]["correction_cost_minor"] == 1_100_000
