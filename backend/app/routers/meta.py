from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_session
from app.reference import COUNTRIES, DEPARTMENTS, JOB_LEVELS, REPORTING_CURRENCY
from app.routers.deps import get_today
from app.schemas import CountryOut, ExchangeRateOut, MetaOut
from app.services import meta as service

router = APIRouter(prefix="/api/meta", tags=["meta"])


@router.get("", response_model=MetaOut)
def get_meta(session: Session = Depends(get_session), today: date = Depends(get_today)):
    return MetaOut(
        countries=[
            CountryOut(code=code, name=country.name, currency=country.currency)
            for code, country in COUNTRIES.items()
        ],
        departments=list(DEPARTMENTS),
        job_levels=list(JOB_LEVELS),
        reporting_currency=REPORTING_CURRENCY,
        rates_as_of=service.rates_as_of(session),
        today=today,
    )


@router.get("/exchange-rates", response_model=list[ExchangeRateOut])
def list_exchange_rates(session: Session = Depends(get_session)):
    return service.list_exchange_rates(session)
