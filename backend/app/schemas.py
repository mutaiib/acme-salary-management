from datetime import date, datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

from app.calculations.money import MAX_AMOUNT_MINOR

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
    gender: str
    hire_date: date
    status: str


class EmployeePage(BaseModel):
    items: list[EmployeeOut]
    page: int
    page_size: int
    total: int


class SalaryChangeIn(BaseModel):
    new_salary_minor: AmountMinor
    reason: Annotated[str, Field(max_length=MAX_REASON_LENGTH)]
    effective_date: date


class SalaryChangeOut(BaseModel):
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
    rates_as_of: date | None
    group_by: str
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
    range_status: str


class PayHealthSummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    below_count: int
    above_count: int
    correction_cost_minor: int
    reporting_currency: str


class OutlierOut(BaseModel):
    id: int
    employee_code: str
    full_name: str
    job_title: str
    job_level: int
    department: str
    country: str
    currency: str
    salary_minor: int
    band_limit_minor: int
    difference_minor: int


class OutlierPage(BaseModel):
    items: list[OutlierOut]
    page: int
    page_size: int
    total: int


class GapOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    key: str
    label: str
    currency: str
    men: int
    women: int
    mean_gap_pct: float | None
    median_gap_pct: float | None
    is_flagged: bool
    has_enough_data: bool


class PayEquityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    organization: GapOut
    countries: list[GapOut]
    flag_threshold_pct: float
    min_group_size: int
