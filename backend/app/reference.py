"""Fixed reference data: the countries, currencies and jobs of ACME."""

from dataclasses import dataclass

REPORTING_CURRENCY = "USD"
ACTIVE = "active"
INACTIVE = "inactive"
STATUSES = (ACTIVE, INACTIVE)


@dataclass(frozen=True)
class Country:
    name: str
    currency: str


COUNTRIES: dict[str, Country] = {
    "US": Country("United States", "USD"),
    "IN": Country("India", "INR"),
    "GB": Country("United Kingdom", "GBP"),
    "DE": Country("Germany", "EUR"),
    "CA": Country("Canada", "CAD"),
    "AU": Country("Australia", "AUD"),
    "FR": Country("France", "EUR"),
    "SG": Country("Singapore", "SGD"),
}

JOB_LEVELS = (1, 2, 3, 4, 5)

DEPARTMENTS: dict[str, str] = {
    "Engineering": "Software Engineer",
    "Sales": "Account Executive",
    "Operations": "Operations Analyst",
    "Finance": "Financial Analyst",
    "Marketing": "Marketing Specialist",
    "People": "HR Specialist",
}

LEVEL_PREFIX = {1: "Associate", 2: "", 3: "Senior", 4: "Lead", 5: "Principal"}


def job_title(department: str, job_level: int) -> str:
    return f"{LEVEL_PREFIX[job_level]} {DEPARTMENTS[department]}".strip()
