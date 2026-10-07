from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_session
from app.schemas import EmployeePage
from app.services import employees as service
from app.services.employees import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, EmployeeQuery

router = APIRouter(prefix="/api/employees", tags=["employees"])


@router.get("", response_model=EmployeePage)
def list_employees(
    page: int = Query(1, ge=1),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    session: Session = Depends(get_session),
):
    return service.list_employees(session, EmployeeQuery(page=page, page_size=page_size))
