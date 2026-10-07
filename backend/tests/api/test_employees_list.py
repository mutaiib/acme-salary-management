def test_returns_the_first_25_employees_in_employee_code_order(client, make):
    for _ in range(30):
        make.employee()

    body = client.get("/api/employees").json()

    codes = [item["employee_code"] for item in body["items"]]
    assert codes == [f"E{n:05d}" for n in range(1, 26)]


def test_returns_the_total_number_of_employees(client, make):
    for _ in range(30):
        make.employee()

    body = client.get("/api/employees").json()

    assert body["total"] == 30
    assert body["page"] == 1
    assert body["page_size"] == 25


def test_returns_the_remaining_employees_on_the_second_page(client, make):
    for _ in range(30):
        make.employee()

    body = client.get("/api/employees", params={"page": 2}).json()

    assert [item["employee_code"] for item in body["items"]] == [f"E{n:05d}" for n in range(26, 31)]


def test_returns_the_pay_data_of_each_employee(client, make):
    make.employee(
        full_name="Asha Rao",
        job_title="Senior Software Engineer",
        job_level=3,
        department="Engineering",
        country="IN",
        currency="INR",
        salary_minor=250_000_000,
    )

    item = client.get("/api/employees").json()["items"][0]

    assert item["full_name"] == "Asha Rao"
    assert item["job_title"] == "Senior Software Engineer"
    assert item["job_level"] == 3
    assert item["department"] == "Engineering"
    assert item["country"] == "IN"
    assert item["currency"] == "INR"
    assert item["salary_minor"] == 250_000_000


def test_returns_an_empty_page_when_there_are_no_employees(client):
    body = client.get("/api/employees").json()

    assert body == {"items": [], "page": 1, "page_size": 25, "total": 0}


def test_refuses_a_page_size_of_more_than_100(client):
    response = client.get("/api/employees", params={"page_size": 101})

    assert response.status_code == 422
    assert response.json()["detail"][0]["field"] == "page_size"


def test_refuses_a_page_number_below_1(client):
    response = client.get("/api/employees", params={"page": 0})

    assert response.status_code == 422
    assert response.json()["detail"][0]["field"] == "page"
