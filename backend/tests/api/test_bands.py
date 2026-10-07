"""FR-07: salary bands."""


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
