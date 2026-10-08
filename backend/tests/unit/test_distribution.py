"""FR-17: the salary brackets of the salary distribution."""

import pytest

from app.calculations.distribution import SalaryBracket, bracket_width_minor, brackets


@pytest.mark.parametrize(
    ("max_minor", "width_minor"),
    [
        (0, 100),
        (1_400, 100),
        (1_500, 200),
        (29_999_999, 2_000_000),
        (30_000_000, 5_000_000),
        (74_999_999, 5_000_000),
        (75_000_000, 10_000_000),
    ],
)
def test_gives_the_smallest_width_that_needs_15_brackets_or_fewer(max_minor, width_minor):
    assert bracket_width_minor(max_minor, 15) == width_minor


def test_gives_a_width_in_whole_currency_units():
    assert bracket_width_minor(123_456_789, 15) % 100 == 0


def test_fills_an_empty_bracket_between_two_others():
    assert brackets({0: 2, 2: 5}, 1_000) == [
        SalaryBracket(from_minor=0, to_minor=1_000, headcount=2),
        SalaryBracket(from_minor=1_000, to_minor=2_000, headcount=0),
        SalaryBracket(from_minor=2_000, to_minor=3_000, headcount=5),
    ]


def test_starts_at_zero_when_the_lowest_bracket_has_no_employee():
    assert brackets({1: 3}, 1_000)[0] == SalaryBracket(0, 1_000, 0)


def test_gives_no_bracket_for_no_headcount():
    assert brackets({}, 1_000) == []
