"""FR-04, FR-05, FR-06: salary changes and the salary history."""

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


def test_refuses_an_effective_date_before_the_hire_date(client, make):
    from datetime import date

    employee = make.employee(hire_date=date(2024, 5, 1))

    error = error_of(change(client, employee, effective_date="2024-04-30"))

    assert error == {
        "field": "effective_date",
        "cause": "The effective date must not be before the hire date.",
    }


def test_refuses_an_effective_date_before_the_last_salary_change(client, make):
    employee = make.employee(salary_minor=6_000_000)
    change(client, employee, new_salary_minor=6_500_000, effective_date="2026-02-01")

    error = error_of(
        change(client, employee, new_salary_minor=7_000_000, effective_date="2026-01-31")
    )

    assert error == {
        "field": "effective_date",
        "cause": "The effective date must not be before the last salary change.",
    }


def test_stores_the_reason_without_the_spaces_around_it(client, make):
    body = change(client, make.employee(), reason="  Annual review  ").json()

    assert body["reason"] == "Annual review"


def test_records_the_time_of_the_salary_change(client, make):
    body = change(client, make.employee()).json()

    assert body["created_at"] == "2026-03-01T09:00:00"


def test_refuses_a_salary_above_the_largest_amount_that_the_system_keeps(client, make):
    error = error_of(change(client, make.employee(), new_salary_minor=10**12 + 1))

    assert error["field"] == "new_salary_minor"


def test_refuses_a_reason_of_more_than_500_characters(client, make):
    error = error_of(change(client, make.employee(), reason="x" * 501))

    assert error["field"] == "reason"


def test_an_employee_without_salary_changes_has_an_empty_salary_history(client, make):
    employee = make.employee()

    assert client.get(f"/api/employees/{employee.id}/salary-changes").json() == []


def test_names_the_field_when_the_request_body_has_a_wrong_type(client, make):
    employee = make.employee()

    response = client.post(
        f"/api/employees/{employee.id}/salary-changes",
        json={
            "new_salary_minor": "a lot",
            "reason": "Annual review",
            "effective_date": "2026-02-01",
        },
    )

    assert error_of(response)["field"] == "new_salary_minor"


def test_the_second_salary_change_records_the_first_new_salary_as_its_old_salary(client, make):
    employee = make.employee(salary_minor=6_000_000)
    change(client, employee, new_salary_minor=6_500_000)

    body = change(client, employee, new_salary_minor=7_000_000).json()

    assert body["old_salary_minor"] == 6_500_000


def test_accepts_the_largest_amount_that_the_system_keeps(client, make):
    assert change(client, make.employee(), new_salary_minor=10**12).status_code == 201


def test_accepts_a_reason_of_500_characters(client, make):
    assert change(client, make.employee(), reason="x" * 500).status_code == 201
