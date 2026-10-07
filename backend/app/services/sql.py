"""SQL building blocks that more than one insight uses."""

from sqlalchemy import ColumnElement, Select, func, or_, select
from sqlalchemy.orm import Session

from app.calculations.money import MICRO
from app.models import Employee, ExchangeRate
from app.reference import ACTIVE

# The labels of the two columns that `median_by_group` reads.
GROUP = "grp"
VALUE = "val"


def reporting_minor(amount: ColumnElement[int]) -> ColumnElement[int]:
    """`amount` in the reporting currency. The same formula as `calculations.money.convert_minor`.

    The query must join `ExchangeRate`. Use `active_employees_with_rate`.
    """
    return (amount * ExchangeRate.rate_micro + MICRO // 2) // MICRO


def active_employees_with_rate(*columns: ColumnElement) -> Select:
    """A query on the active employees, with the exchange rate of the currency of each one.

    An employee who has a currency without an exchange rate is not in the result.
    All insights use this rule, so they always count the same employees.
    """
    return (
        select(*columns)
        .select_from(Employee)
        .join(ExchangeRate, ExchangeRate.currency == Employee.currency)
        .where(Employee.status == ACTIVE)
    )


def median_by_group(session: Session, rows: Select) -> dict[str | int, int]:
    """The median value of each group.

    `rows` must select two columns with the labels `GROUP` and `VALUE`.
    For an even count, the median is the mean of the two middle values, rounded half up.
    """
    source = rows.subquery()
    group, value = source.c[GROUP], source.c[VALUE]
    ranked = select(
        group,
        value,
        func.row_number().over(partition_by=group, order_by=value).label("position"),
        func.count().over(partition_by=group).label("size"),
    ).subquery()
    is_middle = or_(
        ranked.c.position == (ranked.c.size + 1) // 2,
        ranked.c.position == (ranked.c.size + 2) // 2,
    )
    middle_count = func.count()
    median = (func.sum(ranked.c[VALUE]) * 2 + middle_count) // (middle_count * 2)
    statement = select(ranked.c[GROUP], median).where(is_middle).group_by(ranked.c[GROUP])
    return {key: int(median_value) for key, median_value in session.execute(statement)}
