from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_session
from app.schemas import (
    OutlierOut,
    OutlierPage,
    OverviewOut,
    PayEquityOut,
    PayHealthSummaryOut,
)
from app.services import overview as overview_service
from app.services import pay_equity as pay_equity_service
from app.services import pay_health as pay_health_service
from app.services.employees import DEFAULT_PAGE_SIZE, MAX_PAGE, MAX_PAGE_SIZE
from app.services.overview import GroupBy
from app.services.pay_health import Outlier, OutlierStatus

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("/overview", response_model=OverviewOut)
def get_overview(group_by: GroupBy = "country", session: Session = Depends(get_session)):
    return overview_service.overview(session, group_by)


@router.get("/pay-health", response_model=PayHealthSummaryOut)
def get_pay_health(session: Session = Depends(get_session)):
    return pay_health_service.summary(session)


@router.get("/pay-health/employees", response_model=OutlierPage)
def list_outliers(
    status: OutlierStatus,
    country: str | None = None,
    job_level: int | None = None,
    page: int = Query(1, ge=1, le=MAX_PAGE),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    session: Session = Depends(get_session),
):
    result = pay_health_service.list_outliers(session, status, country, job_level, page, page_size)
    return OutlierPage(
        items=[_outlier_out(item) for item in result.items],
        page=result.page,
        page_size=result.page_size,
        total=result.total,
    )


@router.get("/pay-equity", response_model=PayEquityOut)
def get_pay_equity(session: Session = Depends(get_session)):
    return pay_equity_service.pay_equity(session)


def _outlier_out(outlier: Outlier) -> OutlierOut:
    employee = outlier.employee
    return OutlierOut(
        id=employee.id,
        employee_code=employee.employee_code,
        full_name=employee.full_name,
        job_title=employee.job_title,
        job_level=employee.job_level,
        department=employee.department,
        country=employee.country,
        currency=employee.currency,
        salary_minor=employee.salary_minor,
        band_limit_minor=outlier.band_limit_minor,
        difference_minor=outlier.difference_minor,
    )
