from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_session
from app.reference import GroupBy
from app.schemas import OutlierOut, OverviewOut, PageOut, PayHealthSummaryOut
from app.services import overview as overview_service
from app.services import pay_health as pay_health_service
from app.services.pagination import DEFAULT_PAGE_SIZE, MAX_PAGE, MAX_PAGE_SIZE
from app.services.pay_health import OutlierStatus

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("/overview", response_model=OverviewOut)
def get_overview(group_by: GroupBy = "country", session: Session = Depends(get_session)):
    return overview_service.overview(session, group_by)


@router.get("/pay-health", response_model=PayHealthSummaryOut)
def get_pay_health(session: Session = Depends(get_session)):
    return pay_health_service.summary(session)


@router.get("/pay-health/employees", response_model=PageOut[OutlierOut])
def list_outliers(
    status: OutlierStatus | None = None,
    country: str | None = None,
    job_level: int | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1, le=MAX_PAGE),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    session: Session = Depends(get_session),
):
    return pay_health_service.list_outliers(
        session,
        status=status,
        country=country,
        job_level=job_level,
        search=search,
        page=page,
        page_size=page_size,
    )
