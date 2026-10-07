def test_deactivates_an_active_employee(client, make):
    employee = make.employee(status="active")

    response = client.post(f"/api/employees/{employee.id}/deactivate")

    assert response.status_code == 200
    assert response.json()["status"] == "inactive"
    assert client.get(f"/api/employees/{employee.id}").json()["status"] == "inactive"


def test_refuses_to_deactivate_an_employee_who_is_not_active(client, make):
    employee = make.employee(status="inactive")

    response = client.post(f"/api/employees/{employee.id}/deactivate")

    assert response.status_code == 422
    assert response.json()["detail"][0] == {
        "field": "employee",
        "cause": "The employee is not active.",
    }


def test_returns_404_when_the_employee_does_not_exist(client):
    assert client.post("/api/employees/999/deactivate").status_code == 404
