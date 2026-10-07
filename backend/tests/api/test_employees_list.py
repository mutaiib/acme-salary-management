"""FR-03: the employee list."""


def test_returns_the_first_10_employees_in_employee_code_order(client, make):
    for _ in range(12):
        make.employee()

    body = client.get("/api/employees").json()

    codes = [item["employee_code"] for item in body["items"]]
    assert codes == [f"E{n:05d}" for n in range(1, 11)]


def test_returns_the_total_number_of_employees(client, make):
    for _ in range(12):
        make.employee()

    body = client.get("/api/employees").json()

    assert body["total"] == 12
    assert body["page"] == 1
    assert body["page_size"] == 10


def test_returns_the_remaining_employees_on_the_second_page(client, make):
    for _ in range(12):
        make.employee()

    body = client.get("/api/employees", params={"page": 2}).json()

    assert [item["employee_code"] for item in body["items"]] == ["E00011", "E00012"]


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

    assert body == {"items": [], "page": 1, "page_size": 10, "total": 0}


def test_refuses_a_page_size_of_more_than_100(client):
    response = client.get("/api/employees", params={"page_size": 101})

    assert response.status_code == 422
    assert response.json()["detail"][0]["field"] == "page_size"


def test_refuses_a_page_number_below_1(client):
    response = client.get("/api/employees", params={"page": 0})

    assert response.status_code == 422
    assert response.json()["detail"][0]["field"] == "page"


def test_orders_by_employee_code_and_not_by_the_order_of_creation(client, make):
    for code in ("E00003", "E00001", "E00002"):
        make.employee(employee_code=code)

    body = client.get("/api/employees").json()

    assert [item["employee_code"] for item in body["items"]] == ["E00001", "E00002", "E00003"]


def test_orders_employees_with_the_same_name_by_employee_code(client, make):
    for code in ("E00003", "E00001", "E00002"):
        make.employee(employee_code=code, full_name="Asha Rao")

    body = client.get("/api/employees", params={"sort": "name"}).json()

    assert [item["employee_code"] for item in body["items"]] == ["E00001", "E00002", "E00003"]


def test_a_page_has_the_number_of_rows_that_the_page_size_gives(client, make):
    for _ in range(12):
        make.employee()

    body = client.get("/api/employees", params={"page_size": 5, "page": 3}).json()

    assert len(body["items"]) == 2
    assert body["total"] == 12
    assert body["page_size"] == 5


def test_accepts_a_page_size_of_100(client, make):
    make.employee()

    assert client.get("/api/employees", params={"page_size": 100}).json()["page_size"] == 100


def test_returns_no_employees_for_a_page_after_the_last_page(client, make):
    make.employee()

    body = client.get("/api/employees", params={"page": 5}).json()

    assert body["items"] == []
    assert body["total"] == 1


def test_refuses_a_page_number_that_is_too_large(client):
    response = client.get("/api/employees", params={"page": 10**20})

    assert response.status_code == 422
    assert response.json()["detail"][0]["field"] == "page"


def test_refuses_a_status_that_is_not_active_or_inactive(client):
    response = client.get("/api/employees", params={"status": "retired"})

    assert response.status_code == 422
    assert response.json()["detail"][0]["field"] == "status"
