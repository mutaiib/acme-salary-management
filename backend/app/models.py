from datetime import date, datetime

from sqlalchemy import ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Employee(Base):
    __tablename__ = "employees"
    __table_args__ = (
        Index("ix_employees_country", "country"),
        Index("ix_employees_department", "department"),
        Index("ix_employees_job_level", "job_level"),
        Index("ix_employees_status", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_code: Mapped[str] = mapped_column(unique=True)
    full_name: Mapped[str]
    email: Mapped[str] = mapped_column(unique=True)
    job_title: Mapped[str]
    job_level: Mapped[int]
    department: Mapped[str]
    country: Mapped[str]
    currency: Mapped[str]
    salary_minor: Mapped[int]
    gender: Mapped[str]
    hire_date: Mapped[date]
    status: Mapped[str]


class SalaryBand(Base):
    __tablename__ = "salary_bands"
    __table_args__ = (UniqueConstraint("job_level", "country"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    job_level: Mapped[int]
    country: Mapped[str]
    currency: Mapped[str]
    min_minor: Mapped[int]
    mid_minor: Mapped[int]
    max_minor: Mapped[int]


class SalaryChange(Base):
    __tablename__ = "salary_changes"
    __table_args__ = (Index("ix_salary_changes_employee_id", "employee_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"))
    old_salary_minor: Mapped[int | None]
    new_salary_minor: Mapped[int]
    reason: Mapped[str]
    effective_date: Mapped[date]
    created_at: Mapped[datetime]


class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    currency: Mapped[str] = mapped_column(primary_key=True)
    # USD micro-units for 1 unit of the currency: 1.08 USD is 1_080_000.
    rate_micro: Mapped[int]
    as_of_date: Mapped[date]
