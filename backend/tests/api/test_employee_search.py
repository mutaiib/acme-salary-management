def codes(response):
    return [item["employee_code"] for item in response.json()["items"]]


def test_finds_an_employee_by_a_part_of_the_name(client, make):
    make.employee(full_name="Asha Rao")
    make.employee(full_name="Liam Smith")

    response = client.get("/api/employees", params={"search": "asha"})

    assert [item["full_name"] for item in response.json()["items"]] == ["Asha Rao"]


def test_finds_an_employee_by_a_part_of_the_email(client, make):
    make.employee(email="asha.rao@acme.example")
    make.employee(email="liam.smith@acme.example")

    response = client.get("/api/employees", params={"search": "liam.sm"})

    assert [item["email"] for item in response.json()["items"]] == ["liam.smith@acme.example"]


def test_finds_an_employee_by_the_employee_code(client, make):
    make.employee()
    make.employee()

    assert codes(client.get("/api/employees", params={"search": "E00002"})) == ["E00002"]


def test_a_search_treats_a_percent_sign_as_text(client, make):
    make.employee(full_name="Asha Rao")

    assert codes(client.get("/api/employees", params={"search": "%"})) == []


def test_filters_by_country(client, make):
    make.employee(country="US")
    make.employee(country="IN")

    assert codes(client.get("/api/employees", params={"country": "IN"})) == ["E00002"]


def test_filters_by_department(client, make):
    make.employee(department="Engineering")
    make.employee(department="Sales")

    assert codes(client.get("/api/employees", params={"department": "Sales"})) == ["E00002"]


def test_filters_by_job_level(client, make):
    make.employee(job_level=2)
    make.employee(job_level=4)

    assert codes(client.get("/api/employees", params={"job_level": 4})) == ["E00002"]


def test_filters_by_status(client, make):
    make.employee(status="active")
    make.employee(status="inactive")

    assert codes(client.get("/api/employees", params={"status": "inactive"})) == ["E00002"]


def test_combines_the_search_and_the_filters(client, make):
    make.employee(full_name="Asha Rao", country="US")
    make.employee(full_name="Asha Rao", country="IN")
    make.employee(full_name="Liam Smith", country="IN")

    response = client.get("/api/employees", params={"search": "asha", "country": "IN"})

    assert codes(response) == ["E00002"]


def test_the_total_counts_only_the_employees_that_match(client, make):
    make.employee(country="US")
    make.employee(country="IN")
    make.employee(country="IN")

    assert client.get("/api/employees", params={"country": "IN"}).json()["total"] == 2


def test_sorts_by_name(client, make):
    make.employee(full_name="Zoe Young")
    make.employee(full_name="Adam Brown")

    assert codes(client.get("/api/employees", params={"sort": "name"})) == ["E00002", "E00001"]


def test_sorts_by_name_in_reverse_order(client, make):
    make.employee(full_name="Adam Brown")
    make.employee(full_name="Zoe Young")

    assert codes(client.get("/api/employees", params={"sort": "-name"})) == ["E00002", "E00001"]


def test_sorts_by_hire_date_with_the_newest_first(client, make):
    from datetime import date

    make.employee(hire_date=date(2020, 1, 1))
    make.employee(hire_date=date(2024, 1, 1))

    assert codes(client.get("/api/employees", params={"sort": "-hire_date"})) == [
        "E00002",
        "E00001",
    ]


def test_refuses_a_sort_field_that_is_not_supported(client):
    response = client.get("/api/employees", params={"sort": "salary"})

    assert response.status_code == 422
    assert response.json()["detail"][0]["field"] == "sort"


def test_returns_no_employees_when_nothing_matches(client, make):
    make.employee(full_name="Asha Rao")

    body = client.get("/api/employees", params={"search": "nobody"}).json()

    assert body["items"] == []
    assert body["total"] == 0
