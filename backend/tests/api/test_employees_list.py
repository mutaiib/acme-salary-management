"""FR-03, FR-20: the employee list."""


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


def salary_bracket(client, salary_from_minor, salary_to_minor, **params):
    params = {"salary_from_minor": salary_from_minor, "salary_to_minor": salary_to_minor, **params}
    response = client.get("/api/employees", params=params)
    assert response.status_code == 200
    return response.json()


def test_a_salary_equal_to_the_first_limit_is_in_the_bracket_and_one_equal_to_the_second_is_out(
    client, make
):
    make.rate("USD", 1_000_000)
    for salary in (3_999_999, 4_000_000, 5_999_999, 6_000_000):
        make.employee(salary_minor=salary)

    body = salary_bracket(client, 4_000_000, 6_000_000)

    assert sorted(item["salary_minor"] for item in body["items"]) == [4_000_000, 5_999_999]
    assert body["total"] == 2


def test_puts_a_salary_in_euro_in_the_bracket_of_its_value_in_dollars(client, make):
    make.rate("USD", 1_000_000)
    make.rate("EUR", 1_100_000)
    make.employee(currency="EUR", country="DE", salary_minor=4_000_000, full_name="Euro")
    make.employee(salary_minor=4_000_000, full_name="Dollar")

    # 40,000 EUR is 44,000 USD.
    body = salary_bracket(client, 4_200_000, 5_000_000)

    assert [item["full_name"] for item in body["items"]] == ["Euro"]


def test_leaves_out_an_employee_with_no_exchange_rate_when_a_bracket_is_set(client, make):
    make.rate("USD", 1_000_000)
    make.employee(salary_minor=5_000_000)
    make.employee(currency="INR", salary_minor=5_000_000)

    assert salary_bracket(client, 0, 10_000_000)["total"] == 1
    assert client.get("/api/employees").json()["total"] == 2


def test_applies_the_bracket_together_with_the_other_filters(client, make):
    make.rate("USD", 1_000_000)
    make.employee(salary_minor=5_000_000, department="Sales", full_name="Wanted")
    make.employee(salary_minor=5_000_000, department="Engineering")
    make.employee(salary_minor=5_000_000, department="Sales", status="inactive")
    make.employee(salary_minor=9_000_000, department="Sales")

    body = salary_bracket(client, 4_000_000, 6_000_000, department="Sales", status="active")

    assert [item["full_name"] for item in body["items"]] == ["Wanted"]


def test_accepts_a_bracket_with_only_one_limit(client, make):
    make.rate("USD", 1_000_000)
    make.employee(salary_minor=5_000_000)
    make.employee(salary_minor=9_000_000)

    only_from = client.get("/api/employees", params={"salary_from_minor": 6_000_000}).json()
    only_to = client.get("/api/employees", params={"salary_to_minor": 6_000_000}).json()

    assert (only_from["total"], only_to["total"]) == (1, 1)


def test_gives_an_empty_list_for_a_bracket_that_starts_above_its_end_and_refuses_a_negative_limit(
    client, make
):
    make.rate("USD", 1_000_000)
    make.employee(salary_minor=5_000_000)

    reversed_bracket = salary_bracket(client, 6_000_000, 4_000_000)
    negative = client.get("/api/employees", params={"salary_from_minor": -1})

    assert (reversed_bracket["items"], reversed_bracket["total"]) == ([], 0)
    assert negative.status_code == 422
