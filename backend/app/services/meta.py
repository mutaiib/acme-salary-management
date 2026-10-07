"""FR-01, FR-03: the date of the exchange rates, and the fixed values of the filters.

Tests: tests/api/test_meta.py.
"""

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import ExchangeRate


def list_exchange_rates(session: Session) -> list[ExchangeRate]:
    """All exchange rates, in the order of the currency codes."""
    return list(session.scalars(select(ExchangeRate).order_by(ExchangeRate.currency)))


def rates_as_of(session: Session) -> date | None:
    """The date of the exchange rates. All rates have the same date."""
    return session.scalar(select(func.max(ExchangeRate.as_of_date)))
