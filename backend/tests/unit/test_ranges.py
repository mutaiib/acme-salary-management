from decimal import Decimal

import pytest

from app.calculations.ranges import (
    InvalidBandError,
    RangeStatus,
    compa_ratio,
    range_penetration,
    range_status,
    validate_band,
)

MINIMUM, MIDPOINT, MAXIMUM = 3_500_000, 5_000_000, 6_500_000


def test_the_compa_ratio_is_the_salary_divided_by_the_midpoint():
    assert compa_ratio(4_500_000, MIDPOINT) == Decimal("0.90")


def test_a_salary_at_the_midpoint_has_a_compa_ratio_of_1():
    assert compa_ratio(MIDPOINT, MIDPOINT) == Decimal("1.00")


def test_the_compa_ratio_rounds_a_half_up_to_2_decimal_places():
    # 5,025,000 / 5,000,000 = 1.005
    assert compa_ratio(5_025_000, MIDPOINT) == Decimal("1.01")


def test_the_range_penetration_is_the_position_of_the_salary_in_the_band():
    assert range_penetration(4_500_000, MINIMUM, MAXIMUM) == Decimal("33.3")


def test_a_salary_at_the_minimum_has_a_range_penetration_of_0():
    assert range_penetration(MINIMUM, MINIMUM, MAXIMUM) == Decimal("0.0")


def test_a_salary_at_the_maximum_has_a_range_penetration_of_100():
    assert range_penetration(MAXIMUM, MINIMUM, MAXIMUM) == Decimal("100.0")


def test_a_salary_below_the_minimum_has_a_negative_range_penetration():
    assert range_penetration(3_200_000, MINIMUM, MAXIMUM) == Decimal("-10.0")


def test_a_salary_above_the_maximum_has_a_range_penetration_of_more_than_100():
    assert range_penetration(6_800_000, MINIMUM, MAXIMUM) == Decimal("110.0")


def test_the_range_penetration_rounds_a_half_up_to_1_decimal_place():
    # 1,250 / 100,000 = 1.25%
    assert range_penetration(1_250, 0, 100_000) == Decimal("1.3")


def test_a_salary_below_the_minimum_is_below_range():
    assert range_status(MINIMUM - 1, MINIMUM, MAXIMUM) is RangeStatus.BELOW


def test_a_salary_equal_to_the_minimum_is_in_range():
    assert range_status(MINIMUM, MINIMUM, MAXIMUM) is RangeStatus.IN_RANGE


def test_a_salary_equal_to_the_maximum_is_in_range():
    assert range_status(MAXIMUM, MINIMUM, MAXIMUM) is RangeStatus.IN_RANGE


def test_a_salary_above_the_maximum_is_above_range():
    assert range_status(MAXIMUM + 1, MINIMUM, MAXIMUM) is RangeStatus.ABOVE


def test_accepts_a_band_with_a_minimum_below_the_midpoint_below_the_maximum():
    validate_band(MINIMUM, MIDPOINT, MAXIMUM)


def test_refuses_a_band_with_a_minimum_that_is_not_more_than_zero():
    with pytest.raises(InvalidBandError) as error:
        validate_band(0, MIDPOINT, MAXIMUM)

    assert error.value.field == "min_minor"


def test_refuses_a_band_with_a_minimum_that_is_not_less_than_the_midpoint():
    with pytest.raises(InvalidBandError) as error:
        validate_band(MIDPOINT, MIDPOINT, MAXIMUM)

    assert error.value.field == "min_minor"


def test_refuses_a_band_with_a_midpoint_that_is_not_less_than_the_maximum():
    with pytest.raises(InvalidBandError) as error:
        validate_band(MINIMUM, MAXIMUM, MAXIMUM)

    assert error.value.field == "mid_minor"
