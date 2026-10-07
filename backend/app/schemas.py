"""The request and response shapes of the API. `frontend/src/api/types.ts` has the same
shapes for the UI. Change the two files together."""

from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

from app.calculations.money import MAX_AMOUNT_MINOR
from app.calculations.ranges import RangeStatus
from app.reference import Gender, GroupBy, Status

MAX_REASON_LENGTH = 500
# The lower limits are business rules, so the services check them and give the cause.
AmountMinor = Annotated[int, Field(le=MAX_AMOUNT_MINOR)]


class EmployeeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_code: str
    full_name: str
    email: str
    job_title: str
    job_level: int
    department: str
    country: str
    currency: str
    salary_minor: int
    gender: Gender
    hire_date: date
    status: Status


class PageOut[T](BaseModel):
    """One page of a list."""

    items: list[T]
    page: int
    page_size: int
    total: int


class SalaryChangeIn(BaseModel):
    new_salary_minor: AmountMinor
    reason: Annotated[str, Field(max_length=MAX_REASON_LENGTH)]
    effective_date: date


class SalaryChangeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    old_salary_minor: int | None
    new_salary_minor: int
    currency: str
    reason: str
    effective_date: date
    created_at: datetime


class CountryOut(BaseModel):
    code: str
    name: str
    currency: str


class MetaOut(BaseModel):
    countries: list[CountryOut]
    departments: list[str]
    job_levels: list[int]
    reporting_currency: str
    rates_as_of: date | None
    # The UI uses the date of the server, so that the two agree on "today".
    today: date


class GroupFiguresOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    key: str
    label: str
    headcount: int
    payroll_cost_minor: int
    currency: str
    min_minor: int
    median_minor: int
    max_minor: int


class OverviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    reporting_currency: str
    payroll_cost_minor: int
    headcount: int
    median_salary_minor: int
    rates_as_of: date | None
    group_by: GroupBy
    groups: list[GroupFiguresOut]


class BandIn(BaseModel):
    min_minor: AmountMinor
    mid_minor: AmountMinor
    max_minor: AmountMinor


class BandOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_level: int
    country: str
    currency: str
    min_minor: int
    mid_minor: int
    max_minor: int


class EmployeeDetailOut(EmployeeOut):
    """An employee with the position of the salary in the salary band."""

    band: BandOut | None
    # A ratio and a percentage are not money, so they are plain numbers in JSON.
    compa_ratio: float | None
    range_penetration: float | None
    range_status: RangeStatus


class PayHealthSummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    below_count: int
    above_count: int
    correction_cost_minor: int
    payroll_cost_minor: int
    reporting_currency: str


class OutlierOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_code: str
    full_name: str
    job_title: str
    job_level: int
    department: str
    country: str
    currency: str
    salary_minor: int
    range_status: Literal["below", "above"]
    band_limit_minor: int
    difference_minor: int


class SalaryFiguresOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    currency: str
    min_minor: int
    median_minor: int
    max_minor: int


class EmployeeSummaryOut(BaseModel):
    """The pay figures of the active employees of one list query."""

    model_config = ConfigDict(from_attributes=True)

    headcount: int
    payroll_cost_minor: int
    reporting_currency: str
    has_one_currency: bool
    salary: SalaryFiguresOut | None
