from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_session
from app.schemas import OverviewOut
from app.services import overview as overview_service
from app.services.overview import GroupBy

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("/overview", response_model=OverviewOut)
def get_overview(group_by: GroupBy = "country", session: Session = Depends(get_session)):
    return overview_service.overview(session, group_by)
