"""The rules of a salary change. All amounts are integers in minor units."""

from datetime import date


class SalaryChangeError(ValueError):
    """A salary change breaks a rule. `field` names the input that is wrong."""

    def __init__(self, field: str, cause: str) -> None:
        super().__init__(cause)
        self.field = field
        self.cause = cause


def validate_salary_change(
    *,
    current_salary_minor: int,
    new_salary_minor: int,
    reason: str,
    effective_date: date,
    hire_date: date,
    last_change_date: date | None,
    today: date,
) -> None:
    """Raises `SalaryChangeError` for the first rule that the salary change breaks."""
    if new_salary_minor <= 0:
        raise SalaryChangeError("new_salary_minor", "The salary must be more than zero.")
    if not reason.strip():
        raise SalaryChangeError("reason", "Give a reason for the salary change.")
    if effective_date > today:
        raise SalaryChangeError("effective_date", "The effective date must not be in the future.")
    if effective_date < hire_date:
        raise SalaryChangeError(
            "effective_date", "The effective date must not be before the hire date."
        )
    if last_change_date is not None and effective_date < last_change_date:
        # The newest row of the salary history must always give the current salary.
        raise SalaryChangeError(
            "effective_date", "The effective date must not be before the last salary change."
        )
    if new_salary_minor == current_salary_minor:
        raise SalaryChangeError(
            "new_salary_minor", "The new salary is equal to the current salary."
        )
