import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.routers import bands, employees, insights, meta
from app.routers.error_handlers import add_error_handlers

DEFAULT_STATIC_DIR = Path(__file__).resolve().parents[2] / "frontend" / "dist"


def create_app(static_dir: Path | None = None) -> FastAPI:
    app = FastAPI(title="ACME Salary Management")
    add_error_handlers(app)
    app.include_router(employees.router)
    app.include_router(meta.router)
    app.include_router(insights.router)
    app.include_router(bands.router)
    _serve_ui(app, static_dir or Path(os.environ.get("SALARY_STATIC_DIR", DEFAULT_STATIC_DIR)))
    return app


def _serve_ui(app: FastAPI, static_dir: Path) -> None:
    """Serves the built UI. Each screen URL returns `index.html`, so a reload works."""
    index = static_dir / "index.html"
    if not index.is_file():
        return
    app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def ui(path: str) -> FileResponse:
        if path.startswith("api/"):
            raise HTTPException(status_code=404)
        asset = static_dir / path
        if path and asset.is_file() and asset.resolve().is_relative_to(static_dir.resolve()):
            return FileResponse(asset)
        return FileResponse(index)


app = create_app()
