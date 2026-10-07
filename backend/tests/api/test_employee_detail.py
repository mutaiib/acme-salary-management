def test_returns_the_data_of_one_employee(client, make):
    employee = make.employee(full_name="Asha Rao", salary_minor=7_000_000)

    body = client.get(f"/api/employees/{employee.id}").json()

    assert body["full_name"] == "Asha Rao"
    assert body["salary_minor"] == 7_000_000
    assert body["status"] == "active"


def test_returns_404_for_an_employee_that_does_not_exist(client):
    response = client.get("/api/employees/999")

    assert response.status_code == 404
    assert response.json()["detail"] == "The employee does not exist."


def test_shows_the_position_of_the_salary_in_the_band(client, make):
    make.band(min_minor=3_500_000, mid_minor=5_000_000, max_minor=6_500_000)
    employee = make.employee(salary_minor=4_500_000)

    body = client.get(f"/api/employees/{employee.id}").json()

    assert body["compa_ratio"] == 0.9
    assert body["range_penetration"] == 33.3
    assert body["range_status"] == "in_range"
    assert body["band"]["min_minor"] == 3_500_000
    assert body["band"]["mid_minor"] == 5_000_000
    assert body["band"]["max_minor"] == 6_500_000


def test_uses_the_band_of_the_job_level_and_the_country_of_the_employee(client, make):
    make.band(country="US", job_level=2, mid_minor=6_500_000)
    make.band(
        country="DE",
        job_level=3,
        currency="EUR",
        min_minor=6_000_000,
        mid_minor=7_500_000,
        max_minor=9_000_000,
    )
    employee = make.employee(country="DE", currency="EUR", job_level=3, salary_minor=7_500_000)

    body = client.get(f"/api/employees/{employee.id}").json()

    assert body["band"]["mid_minor"] == 7_500_000
    assert body["compa_ratio"] == 1.0


def test_shows_below_range_for_a_salary_under_the_band_minimum(client, make):
    make.band(min_minor=5_200_000)
    employee = make.employee(salary_minor=5_000_000)

    assert client.get(f"/api/employees/{employee.id}").json()["range_status"] == "below"


def test_shows_above_range_for_a_salary_over_the_band_maximum(client, make):
    make.band(max_minor=7_800_000)
    employee = make.employee(salary_minor=8_000_000)

    assert client.get(f"/api/employees/{employee.id}").json()["range_status"] == "above"


def test_shows_no_band_and_no_metrics_for_an_employee_without_a_band(client, make):
    employee = make.employee()

    body = client.get(f"/api/employees/{employee.id}").json()

    assert body["band"] is None
    assert body["compa_ratio"] is None
    assert body["range_penetration"] is None
    assert body["range_status"] == "no_band"


def test_a_band_change_shows_in_the_position_of_the_employee(client, make):
    band = make.band(min_minor=5_200_000, mid_minor=6_500_000, max_minor=7_800_000)
    employee = make.employee(salary_minor=6_500_000)

    client.put(
        f"/api/bands/{band.id}",
        json={"min_minor": 7_000_000, "mid_minor": 8_000_000, "max_minor": 9_000_000},
    )

    assert client.get(f"/api/employees/{employee.id}").json()["range_status"] == "below"
