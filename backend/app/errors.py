from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class DomainError(Exception):
    """A business rule refused the request. `field` names the input that caused it."""

    def __init__(self, field: str, cause: str) -> None:
        super().__init__(cause)
        self.field = field
        self.cause = cause


class NotFoundError(Exception):
    def __init__(self, what: str) -> None:
        super().__init__(f"The {what} does not exist.")
        self.cause = f"The {what} does not exist."


def _unprocessable(details: list[dict[str, str]]) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": details})


def add_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    def handle_domain_error(_: Request, error: DomainError) -> JSONResponse:
        return _unprocessable([{"field": error.field, "cause": error.cause}])

    @app.exception_handler(RequestValidationError)
    def handle_validation_error(_: Request, error: RequestValidationError) -> JSONResponse:
        return _unprocessable(
            [{"field": str(item["loc"][-1]), "cause": item["msg"]} for item in error.errors()]
        )

    @app.exception_handler(NotFoundError)
    def handle_not_found(_: Request, error: NotFoundError) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": error.cause})
