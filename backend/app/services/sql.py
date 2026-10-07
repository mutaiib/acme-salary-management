"""SQL building blocks that more than one insight uses."""

from sqlalchemy import ColumnElement, Select, func, or_, select
from sqlalchemy.orm import Session

from app.calculations.money import MICRO
from app.models import Employee, ExchangeRate
from app.reference import ACTIVE


def usd_minor(amount: ColumnElement[int]) -> ColumnElement[int]:
    """`amount` in the reporting currency. The same formula as `calculations.money.convert_minor`.

    The query must join `ExchangeRate`. Use `active_employees_with_rate`.
    """
    return (amount * ExchangeRate.rate_micro + MICRO // 2) // MICRO


def active_employees_with_rate(*columns) -> Select:
    """A query on the active employees, with the exchange rate of the currency of each one."""
    return (
        select(*columns)
        .select_from(Employee)
        .join(ExchangeRate, ExchangeRate.currency == Employee.currency)
        .where(Employee.status == ACTIVE)
    )


def median_by_group(session: Session, rows: Select) -> dict:
    """The median of `val` for each `grp`. `rows` must select the two columns `grp` and `val`.

    For an even count, the median is the mean of the two middle values, rounded half up.
    """
    source = rows.subquery()
    ranked = select(
        source.c.grp,
        source.c.val,
        func.row_number().over(partition_by=source.c.grp, order_by=source.c.val).label("position"),
        func.count().over(partition_by=source.c.grp).label("size"),
    ).subquery()
    is_middle = or_(
        ranked.c.position == (ranked.c.size + 1) // 2,
        ranked.c.position == (ranked.c.size + 2) // 2,
    )
    middle_count = func.count()
    median = (func.sum(ranked.c.val) * 2 + middle_count) // (middle_count * 2)
    statement = select(ranked.c.grp, median).where(is_middle).group_by(ranked.c.grp)
    return {grp: int(value) for grp, value in session.execute(statement)}
