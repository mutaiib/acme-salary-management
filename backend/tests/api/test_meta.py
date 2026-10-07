"""FR-01, FR-03: the fixed values for the filters, and the dates."""

from datetime import date


def test_returns_the_values_for_the_filters(client, make):
    make.rate("USD", 1_000_000, as_of=date(2026, 1, 1))

    body = client.get("/api/meta").json()

    assert {"code": "IN", "name": "India", "currency": "INR"} in body["countries"]
    assert "Engineering" in body["departments"]
    assert body["job_levels"] == [1, 2, 3, 4, 5]
    assert body["reporting_currency"] == "USD"
    assert body["rates_as_of"] == "2026-01-01"


def test_returns_no_rate_date_when_there_are_no_exchange_rates(client):
    assert client.get("/api/meta").json()["rates_as_of"] is None


def test_returns_the_date_of_today_of_the_server(client):
    assert client.get("/api/meta").json()["today"] == "2026-03-01"
