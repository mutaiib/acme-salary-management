from datetime import date, datetime


def get_today() -> date:
    return date.today()


def get_now() -> datetime:
    return datetime.now()
