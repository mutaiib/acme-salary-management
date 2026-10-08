from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_session
from app.schemas import BandChangePreviewOut, BandFiguresOut, BandIn, BandOut
from app.services import bands as service

router = APIRouter(prefix="/api/bands", tags=["bands"])


@router.get("", response_model=list[BandFiguresOut])
def list_bands(country: str | None = None, session: Session = Depends(get_session)):
    return service.list_band_figures(session, country)


@router.put("/{band_id}", response_model=BandOut)
def update_band(band_id: int, body: BandIn, session: Session = Depends(get_session)):
    return service.update_band(session, band_id, body.min_minor, body.mid_minor, body.max_minor)


@router.post("/{band_id}/preview", response_model=BandChangePreviewOut)
def preview_band_change(band_id: int, body: BandIn, session: Session = Depends(get_session)):
    return service.preview_band_change(
        session, band_id, body.min_minor, body.mid_minor, body.max_minor
    )
