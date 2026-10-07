from datetime import date, datetime
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_session
from app.reference import Status
from app.routers.deps import get_now, get_today
from app.schemas import (
    BandOut,
    EmployeeDetailOut,
    EmployeeOut,
    PageOut,
    SalaryChangeIn,
    SalaryChangeOut,
)
from app.services import bands as band_service
from app.services import employees as service
from app.services.employees import DEFAULT_SORT, SORT_OPTIONS, EmployeeQuery
from app.services.pagination import DEFAULT_PAGE_SIZE, MAX_PAGE, MAX_PAGE_SIZE

router = APIRouter(prefix="/api/employees", tags=["employees"])


@router.get("", response_model=PageOut[EmployeeOut])
def list_employees(
    page: int = Query(1, ge=1, le=MAX_PAGE),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    search: str | None = None,
    country: str | None = None,
    department: str | None = None,
    job_level: int | None = None,
    status: Status | None = None,
    # The sort options come from the sort columns of the service.
    sort: Literal[SORT_OPTIONS] = DEFAULT_SORT,  # type: ignore[valid-type]
    session: Session = Depends(get_session),
):
    query = EmployeeQuery(
        page=page,
        page_size=page_size,
        search=search,
        country=country,
        department=department,
        job_level=job_level,
        status=status,
        sort=sort,
    )
    return service.list_employees(session, query)


@router.get("/{employee_id}", response_model=EmployeeDetailOut)
def get_employee(employee_id: int, session: Session = Depends(get_session)):
    employee = service.get_employee(session, employee_id)
    position = band_service.position_of(session, employee)
    return EmployeeDetailOut(
        **EmployeeOut.model_validate(employee).model_dump(),
        band=BandOut.model_validate(position.band) if position.band else None,
        compa_ratio=position.compa_ratio,
        range_penetration=position.range_penetration,
        range_status=position.range_status,
    )


@router.post("/{employee_id}/salary-changes", response_model=SalaryChangeOut, status_code=201)
def change_salary(
    employee_id: int,
    body: SalaryChangeIn,
    session: Session = Depends(get_session),
    today: date = Depends(get_today),
    now: datetime = Depends(get_now),
):
    return service.change_salary(
        session,
        employee_id,
        new_salary_minor=body.new_salary_minor,
        reason=body.reason,
        effective_date=body.effective_date,
        today=today,
        now=now,
    )


@router.get("/{employee_id}/salary-changes", response_model=list[SalaryChangeOut])
def list_salary_changes(employee_id: int, session: Session = Depends(get_session)):
    return service.list_salary_changes(session, employee_id)


@router.post("/{employee_id}/deactivate", response_model=EmployeeOut)
def deactivate(employee_id: int, session: Session = Depends(get_session)):
    return service.deactivate(session, employee_id)
