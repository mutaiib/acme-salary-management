"""The gender pay gap: the pay of men against the pay of women."""

from decimal import ROUND_HALF_UP, Decimal
from fractions import Fraction

# A gap for a smaller group can identify the pay of one person.
MIN_GROUP_SIZE = 5
# The EU Pay Transparency Directive requires action for a gap of more than 5%.
FLAG_THRESHOLD_PCT = Decimal("5.0")
PERCENT_PLACES = Decimal("0.1")


def gap_pct(men_pay: Fraction | int, women_pay: Fraction | int) -> Decimal:
    """(pay of men - pay of women) / pay of men, as a percentage with 1 decimal place.

    A positive gap means that men have the higher pay. The pay values can be means
    or medians. A mean is a `Fraction`, so the result is exact.
    """
    gap = Fraction(men_pay - women_pay) / Fraction(men_pay) * 100
    return (Decimal(gap.numerator) / Decimal(gap.denominator)).quantize(
        PERCENT_PLACES, ROUND_HALF_UP
    )


def has_enough_data(men: int, women: int) -> bool:
    return men >= MIN_GROUP_SIZE and women >= MIN_GROUP_SIZE


def is_flagged(mean_gap: Decimal, median_gap: Decimal) -> bool:
    """A flag compares the rounded values, so the flag and the figures on the screen agree.

    A gap in favor of women also gets a flag: it is also a difference to explain.
    """
    return abs(mean_gap) > FLAG_THRESHOLD_PCT or abs(median_gap) > FLAG_THRESHOLD_PCT
