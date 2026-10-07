from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import ExchangeRate


def rates_as_of(session: Session) -> date | None:
    """The date of the exchange rates. All rates have the same date."""
    return session.scalar(select(func.max(ExchangeRate.as_of_date)))
