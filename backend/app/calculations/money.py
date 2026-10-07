"""Money arithmetic. All amounts are integers in minor units (for example, cents)."""

from collections.abc import Sequence

MICRO = 1_000_000


def convert_minor(amount_minor: int, rate_micro: int) -> int:
    """Converts an amount to the reporting currency and rounds a half up.

    `rate_micro` is the value of 1 unit of the currency in micro-units of the
    reporting currency. `services/sql.py` has the same formula in SQL.
    """
    return (amount_minor * rate_micro + MICRO // 2) // MICRO


def median_minor(values: Sequence[int]) -> int:
    """The middle value. For an even count: the mean of the two middle values, half up."""
    if not values:
        raise ValueError("The median of no values is not defined.")
    ordered = sorted(values)
    middle = len(ordered) // 2
    if len(ordered) % 2 == 1:
        return ordered[middle]
    return (ordered[middle - 1] + ordered[middle] + 1) // 2
