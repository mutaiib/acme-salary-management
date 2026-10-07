import pytest

from app.calculations.money import convert_minor, median_minor


def test_converts_with_the_exchange_rate():
    assert convert_minor(5_000_000, rate_micro=1_080_000) == 5_400_000


def test_keeps_an_amount_in_the_reporting_currency():
    assert convert_minor(6_500_000, rate_micro=1_000_000) == 6_500_000


def test_rounds_a_half_up_to_the_next_minor_unit():
    # 50 x 0.01 = 0.5
    assert convert_minor(50, rate_micro=10_000) == 1


def test_rounds_less_than_a_half_down():
    # 49 x 0.01 = 0.49
    assert convert_minor(49, rate_micro=10_000) == 0


def test_rounds_more_than_a_half_up():
    # 6,111,111 x 1.08 = 6,599,999.88
    assert convert_minor(6_111_111, rate_micro=1_080_000) == 6_600_000


def test_the_median_of_an_odd_number_of_values_is_the_middle_value():
    assert median_minor([9_000_000, 6_000_000, 7_000_000]) == 7_000_000


def test_the_median_of_an_even_number_of_values_is_the_mean_of_the_two_middle_values():
    assert median_minor([1_800_000, 5_400_000, 6_000_000, 7_000_000]) == 5_700_000


def test_the_median_rounds_a_half_up():
    assert median_minor([5_000_000, 6_111_111]) == 5_555_556


def test_the_median_of_one_value_is_that_value():
    assert median_minor([4_200_000]) == 4_200_000


def test_the_median_of_no_values_is_an_error():
    with pytest.raises(ValueError):
        median_minor([])
