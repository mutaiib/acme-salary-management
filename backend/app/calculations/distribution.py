"""FR-17: the salary brackets of the salary distribution. Pure functions."""

from dataclasses import dataclass

MINOR_PER_UNIT = 100
# A width is 1, 2 or 5 times a power of 10, in whole currency units.
_WIDTH_STEPS = (1, 2, 5)


@dataclass(frozen=True)
class SalaryBracket:
    from_minor: int
    to_minor: int
    headcount: int


def bracket_width_minor(max_minor: int, max_brackets: int) -> int:
    """The smallest width that covers `max_minor` with `max_brackets` brackets or fewer.

    A salary on a bracket limit belongs to the higher bracket, so the highest
    salary is in the bracket with the index `max_minor // width`.
    """
    power = 1
    while True:
        for step in _WIDTH_STEPS:
            width_minor = step * power * MINOR_PER_UNIT
            if max_minor // width_minor + 1 <= max_brackets:
                return width_minor
        power *= 10


def brackets(headcount_by_index: dict[int, int], width_minor: int) -> list[SalaryBracket]:
    """The brackets from index 0 to the highest index. An absent index has a headcount of zero."""
    if not headcount_by_index:
        return []
    return [
        SalaryBracket(
            index * width_minor, (index + 1) * width_minor, headcount_by_index.get(index, 0)
        )
        for index in range(max(headcount_by_index) + 1)
    ]
