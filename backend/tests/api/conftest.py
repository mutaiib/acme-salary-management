from collections.abc import Iterator
from datetime import date, datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_session
from app.main import create_app
from app.models import Employee, ExchangeRate, SalaryBand
from app.routers.deps import get_now, get_today

TODAY = date(2026, 3, 1)
NOW = datetime(2026, 3, 1, 9, 0, 0)


@pytest.fixture
def session_factory() -> Iterator[sessionmaker[Session]]:
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    yield sessionmaker(engine, expire_on_commit=False)
    engine.dispose()


@pytest.fixture
def session(session_factory) -> Iterator[Session]:
    """The session of the test itself: to build rows and to read the database."""
    with session_factory() as session:
        yield session


@pytest.fixture
def client(session_factory) -> TestClient:
    def session_for_one_request() -> Iterator[Session]:
        # As in production, each request has its own session. A write that the
        # service does not commit is lost, and the next request does not see it.
        with session_factory() as session:
            yield session

    app = create_app()
    app.dependency_overrides[get_session] = session_for_one_request
    app.dependency_overrides[get_today] = lambda: TODAY
    app.dependency_overrides[get_now] = lambda: NOW
    return TestClient(app)


class Factory:
    """Builds rows with safe defaults so that a test states only what it checks."""

    def __init__(self, session: Session) -> None:
        self._session = session
        self._count = 0

    def employee(self, **overrides) -> Employee:
        self._count += 1
        values = {
            "employee_code": f"E{self._count:05d}",
            "full_name": f"Employee {self._count}",
            "email": f"employee{self._count}@acme.example",
            "job_title": "Software Engineer",
            "job_level": 2,
            "department": "Engineering",
            "country": "US",
            "currency": "USD",
            "salary_minor": 6_500_000,
            "gender": "female",
            "hire_date": date(2022, 1, 10),
            "status": "active",
        }
        values.update(overrides)
        employee = Employee(**values)
        self._session.add(employee)
        self._session.commit()
        return employee

    def band(self, **overrides) -> SalaryBand:
        values = {
            "job_level": 2,
            "country": "US",
            "currency": "USD",
            "min_minor": 5_200_000,
            "mid_minor": 6_500_000,
            "max_minor": 7_800_000,
        }
        values.update(overrides)
        band = SalaryBand(**values)
        self._session.add(band)
        self._session.commit()
        return band

    def rate(self, currency: str, rate_micro: int, as_of: date = date(2026, 1, 1)) -> ExchangeRate:
        rate = ExchangeRate(currency=currency, rate_micro=rate_micro, as_of_date=as_of)
        self._session.add(rate)
        self._session.commit()
        return rate


@pytest.fixture
def make(session: Session) -> Factory:
    return Factory(session)
