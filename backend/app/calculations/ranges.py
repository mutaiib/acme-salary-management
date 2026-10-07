"""The position of a salary in a salary band. All amounts are integers in minor units."""

from decimal import ROUND_HALF_UP, Decimal
from enum import StrEnum

RATIO_PLACES = Decimal("0.01")
PERCENT_PLACES = Decimal("0.1")


class RangeStatus(StrEnum):
    BELOW = "below"
    IN_RANGE = "in_range"
    ABOVE = "above"
    NO_BAND = "no_band"


class InvalidBandError(ValueError):
    """A band must have: 0 < minimum < midpoint < maximum. `field` names the wrong value."""

    def __init__(self, field: str, cause: str) -> None:
        super().__init__(cause)
        self.field = field
        self.cause = cause


def compa_ratio(salary_minor: int, mid_minor: int) -> Decimal:
    """The salary divided by the band midpoint, with 2 decimal places."""
    return (Decimal(salary_minor) / Decimal(mid_minor)).quantize(RATIO_PLACES, ROUND_HALF_UP)


def range_penetration(salary_minor: int, min_minor: int, max_minor: int) -> Decimal:
    """The position of the salary in the band as a percentage, with 1 decimal place.

    0 is the band minimum and 100 is the band maximum. A salary outside the band
    gives a value below 0 or above 100.
    """
    position = Decimal(salary_minor - min_minor) / Decimal(max_minor - min_minor)
    return (position * 100).quantize(PERCENT_PLACES, ROUND_HALF_UP)


def range_status(salary_minor: int, min_minor: int, max_minor: int) -> RangeStatus:
    """A salary equal to the minimum or the maximum is in range."""
    if salary_minor < min_minor:
        return RangeStatus.BELOW
    if salary_minor > max_minor:
        return RangeStatus.ABOVE
    return RangeStatus.IN_RANGE


def validate_band(min_minor: int, mid_minor: int, max_minor: int) -> None:
    if min_minor <= 0:
        raise InvalidBandError("min_minor", "The minimum must be more than zero.")
    if min_minor >= mid_minor:
        raise InvalidBandError("min_minor", "The minimum must be less than the midpoint.")
    if mid_minor >= max_minor:
        raise InvalidBandError("mid_minor", "The midpoint must be less than the maximum.")
