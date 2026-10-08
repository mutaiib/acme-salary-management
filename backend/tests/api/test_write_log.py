"""FR-16, NFR-08: a log line for each write."""

import logging


def test_writes_a_log_line_for_a_salary_change(client, make, caplog):
    employee = make.employee(salary_minor=6_500_000)

    with caplog.at_level(logging.INFO):
        client.post(
            f"/api/employees/{employee.id}/salary-changes",
            json={
                "new_salary_minor": 7_000_000,
                "reason": "Annual review",
                "effective_date": "2026-02-01",
            },
        )

    assert f"Salary change: employee={employee.id} old=6500000 new=7000000" in caplog.text


def test_writes_a_log_line_for_a_deactivation(client, make, caplog):
    employee = make.employee()

    with caplog.at_level(logging.INFO):
        client.post(f"/api/employees/{employee.id}/deactivate")

    assert f"Deactivation: employee={employee.id}" in caplog.text


def test_writes_a_log_line_for_a_band_change(client, make, caplog):
    band = make.band()

    with caplog.at_level(logging.INFO):
        client.put(
            f"/api/bands/{band.id}",
            json={"min_minor": 5_000_000, "mid_minor": 6_000_000, "max_minor": 7_000_000},
        )

    assert f"Band change: band={band.id} min=5000000 mid=6000000 max=7000000" in caplog.text


def test_writes_no_log_line_for_a_band_preview(client, make, caplog):
    band = make.band()

    with caplog.at_level(logging.INFO):
        response = client.post(
            f"/api/bands/{band.id}/preview",
            json={"min_minor": 5_000_000, "mid_minor": 6_000_000, "max_minor": 7_000_000},
        )

    assert response.status_code == 200
    assert "Band change" not in caplog.text


def test_writes_no_log_line_for_a_refused_salary_change(client, make, caplog):
    employee = make.employee()

    with caplog.at_level(logging.INFO):
        client.post(
            f"/api/employees/{employee.id}/salary-changes",
            json={"new_salary_minor": 0, "reason": "Annual review", "effective_date": "2026-02-01"},
        )

    assert "Salary change" not in caplog.text
