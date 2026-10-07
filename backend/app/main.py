from fastapi import FastAPI

from app.errors import add_error_handlers
from app.routers import employees


def create_app() -> FastAPI:
    app = FastAPI(title="ACME Salary Management")
    add_error_handlers(app)
    app.include_router(employees.router)
    return app


app = create_app()
