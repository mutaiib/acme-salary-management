from sqlalchemy import func, select

from app.models import SalaryChange

VALID = {"new_salary_minor": 7_000_000, "reason": "Annual review", "effective_date": "2026-02-01"}


def change(client, employee, **overrides):
    return client.post(f"/api/employees/{employee.id}/salary-changes", json={**VALID, **overrides})


def error_of(response):
    assert response.status_code == 422
    return response.json()["detail"][0]


def test_a_salary_change_sets_the_new_salary_of_the_employee(client, make):
    employee = make.employee(salary_minor=6_500_000)

    response = change(client, employee)

    assert response.status_code == 201
    assert client.get(f"/api/employees/{employee.id}").json()["salary_minor"] == 7_000_000


def test_a_salary_change_records_the_old_salary_the_new_salary_the_reason_and_the_date(
    client, make
):
    employee = make.employee(salary_minor=6_500_000)

    body = change(client, employee).json()

    assert body["old_salary_minor"] == 6_500_000
    assert body["new_salary_minor"] == 7_000_000
    assert body["reason"] == "Annual review"
    assert body["effective_date"] == "2026-02-01"
    assert body["currency"] == "USD"


def test_the_salary_history_shows_the_newest_salary_change_first(client, make):
    employee = make.employee(salary_minor=6_000_000)
    change(client, employee, new_salary_minor=6_500_000, effective_date="2025-06-01")
    change(client, employee, new_salary_minor=7_000_000, effective_date="2026-02-01")

    history = client.get(f"/api/employees/{employee.id}/salary-changes").json()

    assert [item["new_salary_minor"] for item in history] == [7_000_000, 6_500_000]


def test_two_changes_on_the_same_date_show_the_later_change_first(client, make):
    employee = make.employee(salary_minor=6_000_000)
    change(client, employee, new_salary_minor=6_500_000)
    change(client, employee, new_salary_minor=7_000_000)

    history = client.get(f"/api/employees/{employee.id}/salary-changes").json()

    assert [item["new_salary_minor"] for item in history] == [7_000_000, 6_500_000]


def test_refuses_a_salary_of_zero(client, make):
    error = error_of(change(client, make.employee(), new_salary_minor=0))

    assert error == {"field": "new_salary_minor", "cause": "The salary must be more than zero."}


def test_refuses_a_negative_salary(client, make):
    error = error_of(change(client, make.employee(), new_salary_minor=-100))

    assert error["field"] == "new_salary_minor"


def test_refuses_an_empty_reason(client, make):
    error = error_of(change(client, make.employee(), reason="   "))

    assert error == {"field": "reason", "cause": "Give a reason for the salary change."}


def test_refuses_an_effective_date_in_the_future(client, make):
    error = error_of(change(client, make.employee(), effective_date="2026-03-02"))

    assert error == {
        "field": "effective_date",
        "cause": "The effective date must not be in the future.",
    }


def test_accepts_an_effective_date_of_today(client, make):
    assert change(client, make.employee(), effective_date="2026-03-01").status_code == 201


def test_refuses_a_salary_that_is_equal_to_the_current_salary(client, make):
    employee = make.employee(salary_minor=7_000_000)

    error = error_of(change(client, employee, new_salary_minor=7_000_000))

    assert error == {
        "field": "new_salary_minor",
        "cause": "The new salary is equal to the current salary.",
    }


def test_refuses_a_salary_change_for_an_inactive_employee(client, make):
    error = error_of(change(client, make.employee(status="inactive")))

    assert error == {"field": "employee", "cause": "The employee is not active."}


def test_a_refused_salary_change_keeps_the_salary_and_adds_no_history(client, make, session):
    employee = make.employee(salary_minor=6_500_000)

    change(client, employee, new_salary_minor=0)

    assert client.get(f"/api/employees/{employee.id}").json()["salary_minor"] == 6_500_000
    assert session.scalar(select(func.count()).select_from(SalaryChange)) == 0


def test_returns_404_for_a_salary_change_of_an_employee_that_does_not_exist(client):
    response = client.post("/api/employees/999/salary-changes", json=VALID)

    assert response.status_code == 404


def test_returns_404_for_the_salary_history_of_an_employee_that_does_not_exist(client):
    assert client.get("/api/employees/999/salary-changes").status_code == 404
