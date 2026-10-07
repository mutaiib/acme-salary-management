"""NFR-03: the seed generator."""

from collections import Counter

import pytest

from app.reference import COUNTRIES, JOB_LEVELS
from app.seed import EMPLOYEE_COUNT, SEED, generate_dataset

SMALL = 2_000


@pytest.fixture(scope="module")
def dataset():
    """One dataset for the tests that only read it. The generator is slow to run 10 times."""
    return generate_dataset(count=SMALL, seed=42)


def test_creates_the_requested_number_of_employees(dataset):

    assert len(dataset.employees) == SMALL


def test_two_runs_with_the_same_seed_give_the_same_data():
    assert generate_dataset(count=SMALL, seed=42) == generate_dataset(count=SMALL, seed=42)


def test_a_different_seed_gives_different_data():
    assert generate_dataset(count=SMALL, seed=42) != generate_dataset(count=SMALL, seed=7)


def test_each_employee_code_and_email_is_unique(dataset):

    assert len({e["employee_code"] for e in dataset.employees}) == SMALL
    assert len({e["email"] for e in dataset.employees}) == SMALL


def test_creates_one_band_for_each_job_level_in_each_country(dataset):

    keys = [(b["job_level"], b["country"]) for b in dataset.bands]

    assert sorted(keys) == sorted((level, code) for level in JOB_LEVELS for code in COUNTRIES)


def test_each_band_has_a_minimum_below_the_midpoint_below_the_maximum(dataset):

    assert all(b["min_minor"] < b["mid_minor"] < b["max_minor"] for b in dataset.bands)


def test_creates_one_exchange_rate_for_each_currency(dataset):

    currencies = {country.currency for country in COUNTRIES.values()}

    assert {r["currency"] for r in dataset.rates} == currencies
    assert len(dataset.rates) == len(currencies)


def test_each_employee_uses_the_currency_of_the_country(dataset):

    assert all(e["currency"] == COUNTRIES[e["country"]].currency for e in dataset.employees)


def test_the_first_salary_of_each_employee_is_the_first_salary_change(dataset):

    changes = {c["employee_id"]: c for c in dataset.salary_changes}

    assert len(dataset.salary_changes) == SMALL
    for employee in dataset.employees:
        change = changes[employee["id"]]
        assert change["old_salary_minor"] is None
        assert change["new_salary_minor"] == employee["salary_minor"]
        assert change["effective_date"] == employee["hire_date"]


def test_plants_the_recorded_number_of_salaries_outside_the_band(dataset):
    bands = {(b["job_level"], b["country"]): b for b in dataset.bands}
    active = [e for e in dataset.employees if e["status"] == "active"]

    def band(employee):
        return bands[(employee["job_level"], employee["country"])]

    below = sum(1 for e in active if e["salary_minor"] < band(e)["min_minor"])
    above = sum(1 for e in active if e["salary_minor"] > band(e)["max_minor"])

    assert below == dataset.planted.below_range > 0
    assert above == dataset.planted.above_range > 0


def test_men_and_women_have_the_same_job_level_mix_in_each_country():
    dataset = generate_dataset(count=10_000, seed=42)

    for code in COUNTRIES:
        staff = [e for e in dataset.employees if e["country"] == code]
        men = Counter(e["job_level"] for e in staff if e["gender"] == "male")
        women = Counter(e["job_level"] for e in staff if e["gender"] == "female")
        for level in JOB_LEVELS:
            share_men = men[level] / sum(men.values())
            share_women = women[level] / sum(women.values())
            assert abs(share_men - share_women) < 0.03


def test_the_seed_script_creates_exactly_10000_employees():
    assert EMPLOYEE_COUNT == 10_000
    assert len(generate_dataset(count=EMPLOYEE_COUNT, seed=SEED).employees) == 10_000
