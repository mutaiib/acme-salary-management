"""The clock, as an input. A test replaces these two functions with fixed values."""

from datetime import UTC, date, datetime


def get_today() -> date:
    return date.today()


def get_now() -> datetime:
    """The time now in UTC, without a time zone, as the database keeps it."""
    return datetime.now(UTC).replace(tzinfo=None)
