"""One page of a list. All lists paginate in the database, with the same limits."""

from dataclasses import dataclass

from sqlalchemy import ColumnElement, Select, func, select
from sqlalchemy.orm import Session

DEFAULT_PAGE_SIZE = 10
MAX_PAGE_SIZE = 100
MAX_PAGE = 1_000_000


@dataclass(frozen=True)
class Page[T]:
    items: list[T]
    page: int
    page_size: int
    total: int


def paginate(
    session: Session,
    statement: Select,
    order_by: tuple[ColumnElement, ...],
    page: int,
    page_size: int,
    *,
    as_entities: bool = False,
) -> Page:
    """Counts the rows of `statement` and reads one page of them, in the given order.

    With `as_entities`, each item is the model object that the statement selects.
    Without it, each item is a row with one attribute for each selected column.
    """
    total = session.scalar(select(func.count()).select_from(statement.subquery())) or 0
    one_page = statement.order_by(*order_by).limit(page_size).offset((page - 1) * page_size)
    items = session.scalars(one_page).all() if as_entities else session.execute(one_page).all()
    return Page(items=list(items), page=page, page_size=page_size, total=total)
