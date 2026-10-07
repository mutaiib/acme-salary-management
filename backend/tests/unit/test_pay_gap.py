from decimal import Decimal
from fractions import Fraction

from app.calculations.pay_gap import gap_pct, has_enough_data, is_flagged


def test_the_gap_is_the_difference_as_a_percentage_of_the_pay_of_men():
    assert gap_pct(men_pay=100_000, women_pay=90_000) == Decimal("10.0")


def test_the_gap_is_zero_when_men_and_women_have_the_same_pay():
    assert gap_pct(men_pay=80_000, women_pay=80_000) == Decimal("0.0")


def test_the_gap_is_negative_when_women_have_the_higher_pay():
    assert gap_pct(men_pay=80_000, women_pay=100_000) == Decimal("-25.0")


def test_the_gap_rounds_a_half_up_to_1_decimal_place():
    # (2000 - 1999) / 2000 = 0.05%
    assert gap_pct(men_pay=2_000, women_pay=1_999) == Decimal("0.1")


def test_the_gap_accepts_a_mean_as_an_exact_fraction():
    men_mean = Fraction(200_000, 3)
    women_mean = Fraction(180_000, 3)

    assert gap_pct(men_mean, women_mean) == Decimal("10.0")


def test_a_group_with_5_men_and_5_women_has_enough_data():
    assert has_enough_data(men=5, women=5)


def test_a_group_with_4_men_does_not_have_enough_data():
    assert not has_enough_data(men=4, women=50)


def test_a_group_with_4_women_does_not_have_enough_data():
    assert not has_enough_data(men=50, women=4)


def test_a_gap_of_exactly_5_percent_has_no_flag():
    assert not is_flagged(Decimal("5.0"), Decimal("0.0"))


def test_a_mean_gap_of_more_than_5_percent_has_a_flag():
    assert is_flagged(Decimal("5.1"), Decimal("0.0"))


def test_a_median_gap_of_more_than_5_percent_has_a_flag():
    assert is_flagged(Decimal("0.0"), Decimal("5.1"))


def test_a_gap_in_favor_of_women_of_more_than_5_percent_has_a_flag():
    assert is_flagged(Decimal("-5.1"), Decimal("0.0"))


def test_a_median_gap_in_favor_of_women_of_more_than_5_percent_has_a_flag():
    assert is_flagged(Decimal("0.0"), Decimal("-5.1"))


def test_a_median_gap_of_exactly_5_percent_has_no_flag():
    assert not is_flagged(Decimal("0.0"), Decimal("5.0"))
