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
