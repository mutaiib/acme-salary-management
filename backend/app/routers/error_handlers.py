"""Turns the errors of the services and of the request validation into HTTP responses.

A refused request gives `422 {"detail": [{"field", "cause"}]}`. A missing record gives
`404 {"detail": cause}`.
"""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.errors import DomainError, NotFoundError


def add_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    def handle_domain_error(_: Request, error: DomainError) -> JSONResponse:
        return _unprocessable([{"field": error.field, "cause": error.cause}])

    @app.exception_handler(RequestValidationError)
    def handle_validation_error(_: Request, error: RequestValidationError) -> JSONResponse:
        return _unprocessable(
            [{"field": _field_name(item["loc"]), "cause": item["msg"]} for item in error.errors()]
        )

    @app.exception_handler(NotFoundError)
    def handle_not_found(_: Request, error: NotFoundError) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": error.cause})


def _field_name(location: tuple) -> str:
    """The name of the input that is wrong. A position in the body text is not a name."""
    names = [part for part in location if isinstance(part, str)]
    return names[-1] if names else "body"


def _unprocessable(details: list[dict[str, str]]) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": details})
