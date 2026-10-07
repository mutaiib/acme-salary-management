"""FR-04, FR-05, FR-06: the rules of a salary change."""

from datetime import date

import pytest

from app.calculations.salary_changes import SalaryChangeError, validate_salary_change

TODAY = date(2026, 3, 1)
VALID = {
    "current_salary_minor": 6_500_000,
    "new_salary_minor": 7_000_000,
    "reason": "Annual review",
    "effective_date": date(2026, 2, 1),
    "hire_date": date(2022, 1, 10),
    "last_change_date": date(2025, 6, 1),
    "today": TODAY,
}


def refusal(**overrides) -> SalaryChangeError:
    with pytest.raises(SalaryChangeError) as error:
        validate_salary_change(**{**VALID, **overrides})
    return error.value


def test_accepts_a_salary_change_that_follows_all_rules():
    validate_salary_change(**VALID)


def test_refuses_a_salary_of_zero():
    assert refusal(new_salary_minor=0).field == "new_salary_minor"


def test_refuses_a_negative_salary():
    assert refusal(new_salary_minor=-1).cause == "The salary must be more than zero."


def test_refuses_a_reason_of_only_spaces():
    assert refusal(reason="   ").field == "reason"


def test_refuses_an_effective_date_after_today():
    assert refusal(effective_date=date(2026, 3, 2)).field == "effective_date"


def test_accepts_an_effective_date_of_today():
    validate_salary_change(**{**VALID, "effective_date": TODAY})


def test_refuses_an_effective_date_before_the_hire_date():
    error = refusal(effective_date=date(2022, 1, 9), last_change_date=None)

    assert error.cause == "The effective date must not be before the hire date."


def test_accepts_an_effective_date_equal_to_the_hire_date():
    validate_salary_change(
        **{**VALID, "effective_date": date(2022, 1, 10), "last_change_date": None}
    )


def test_refuses_an_effective_date_before_the_last_salary_change():
    error = refusal(effective_date=date(2025, 5, 31))

    assert error.cause == "The effective date must not be before the last salary change."


def test_accepts_an_effective_date_equal_to_the_last_salary_change():
    validate_salary_change(**{**VALID, "effective_date": date(2025, 6, 1)})


def test_refuses_a_salary_equal_to_the_current_salary():
    assert refusal(new_salary_minor=6_500_000).field == "new_salary_minor"


def test_reports_the_salary_before_the_date_when_the_two_are_wrong():
    assert refusal(new_salary_minor=0, effective_date=date(2030, 1, 1)).field == "new_salary_minor"
