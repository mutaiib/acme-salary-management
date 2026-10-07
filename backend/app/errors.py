"""The errors that a service raises. `routers/error_handlers.py` turns them into HTTP responses."""

# The name of the field for a rule that is about the employee, not about one input.
EMPLOYEE_FIELD = "employee"


class DomainError(Exception):
    """A business rule refused the request. `field` names the input that caused it."""

    def __init__(self, field: str, cause: str) -> None:
        super().__init__(cause)
        self.field = field
        self.cause = cause


class NotFoundError(Exception):
    def __init__(self, what: str) -> None:
        self.cause = f"The {what} does not exist."
        super().__init__(self.cause)
