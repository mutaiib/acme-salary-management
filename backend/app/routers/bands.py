from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_session
from app.schemas import BandIn, BandOut
from app.services import bands as service

router = APIRouter(prefix="/api/bands", tags=["bands"])


@router.get("", response_model=list[BandOut])
def list_bands(country: str | None = None, session: Session = Depends(get_session)):
    return service.list_bands(session, country)


@router.put("/{band_id}", response_model=BandOut)
def update_band(band_id: int, body: BandIn, session: Session = Depends(get_session)):
    return service.update_band(session, band_id, body.min_minor, body.mid_minor, body.max_minor)
