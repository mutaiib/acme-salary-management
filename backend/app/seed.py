"""Creates the ACME dataset. Run it with `python -m app.seed`.

The generator is a pure function of `count` and `seed`. It does not read the clock,
so two runs give the same data.
"""

import random
import time
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta

from sqlalchemy import insert
from sqlalchemy.orm import Session

from app.db import Base, SessionLocal, engine
from app.models import Employee, ExchangeRate, SalaryBand, SalaryChange
from app.reference import ACTIVE, COUNTRIES, INACTIVE, JOB_LEVELS, job_title

EMPLOYEE_COUNT = 10_000
SEED = 42
REFERENCE_DATE = date(2026, 1, 1)
FIRST_SALARY_REASON = "First salary"

# USD micro-units for 1 unit of the currency.
RATES_MICRO = {
    "USD": 1_000_000,
    "GBP": 1_270_000,
    "EUR": 1_080_000,
    "INR": 12_000,
    "CAD": 730_000,
    "AUD": 660_000,
    "SGD": 740_000,
}

# Share of the headcount, and the local pay level as a percentage of the US pay level.
COUNTRY_SHARE = {"US": 30, "IN": 22, "GB": 12, "DE": 10, "CA": 8, "AU": 7, "FR": 6, "SG": 5}
COUNTRY_PAY_PCT = {"US": 100, "IN": 30, "GB": 80, "DE": 85, "CA": 85, "AU": 90, "FR": 75, "SG": 90}

LEVEL_SHARE = {1: 30, 2: 30, 3: 22, 4: 13, 5: 5}
LEVEL_MIDPOINT_USD = {1: 45_000, 2: 65_000, 3: 90_000, 4: 125_000, 5: 170_000}
BAND_MIN_PCT = 80
BAND_MAX_PCT = 120

DEPARTMENT_SHARE = {
    "Engineering": 35,
    "Sales": 20,
    "Operations": 20,
    "Finance": 8,
    "Marketing": 10,
    "People": 7,
}

WOMEN_PCT = 46
INACTIVE_PCT = 3
BELOW_RANGE_PCT = 3
ABOVE_RANGE_PCT = 2

# Countries where the generator pays women lower in the band, so that the
# gender pay gap is more than 5%.
GAP_COUNTRIES = ("DE", "GB", "IN")

FIRST_NAMES = {
    "male": [
        "Aarav",
        "Adam",
        "Ahmed",
        "Alexander",
        "Arjun",
        "Benjamin",
        "Carlos",
        "Daniel",
        "David",
        "Ethan",
        "Felix",
        "Gabriel",
        "Hiroshi",
        "Ian",
        "Jack",
        "James",
        "Jonas",
        "Kofi",
        "Liam",
        "Lucas",
        "Mateo",
        "Mohammed",
        "Noah",
        "Oliver",
        "Omar",
        "Pierre",
        "Rahul",
        "Samuel",
        "Thomas",
        "Vikram",
        "Wei",
        "William",
    ],
    "female": [
        "Aisha",
        "Amelia",
        "Ananya",
        "Anna",
        "Ava",
        "Camille",
        "Charlotte",
        "Chloe",
        "Divya",
        "Elena",
        "Emily",
        "Emma",
        "Fatima",
        "Grace",
        "Hannah",
        "Isabella",
        "Julia",
        "Kavya",
        "Laura",
        "Lea",
        "Mei",
        "Mia",
        "Nadia",
        "Olivia",
        "Priya",
        "Sara",
        "Sofia",
        "Sophie",
        "Tanvi",
        "Yuki",
        "Zara",
        "Zoe",
    ],
}

LAST_NAMES = [
    "Ahmed",
    "Anderson",
    "Bauer",
    "Bernard",
    "Brown",
    "Campbell",
    "Chen",
    "Clark",
    "Das",
    "Davies",
    "Dubois",
    "Evans",
    "Fischer",
    "Garcia",
    "Gupta",
    "Hoffmann",
    "Iyer",
    "Johnson",
    "Jones",
    "Kaur",
    "Khan",
    "Kumar",
    "Lee",
    "Lim",
    "Martin",
    "Mehta",
    "Miller",
    "Moreau",
    "Müller",
    "Nair",
    "Ng",
    "Patel",
    "Rao",
    "Reddy",
    "Roberts",
    "Schmidt",
    "Sharma",
    "Singh",
    "Smith",
    "Tan",
    "Taylor",
    "Thompson",
    "Walker",
    "Weber",
    "White",
    "Williams",
    "Wilson",
    "Wong",
    "Wright",
    "Young",
]

Row = dict[str, object]


@dataclass(frozen=True)
class Planted:
    """The anomalies that the generator plants on purpose. Tests check the insights against them."""

    below_range: int
    above_range: int
    gap_countries: tuple[str, ...]


@dataclass(frozen=True)
class Dataset:
    rates: list[Row] = field(default_factory=list)
    bands: list[Row] = field(default_factory=list)
    employees: list[Row] = field(default_factory=list)
    salary_changes: list[Row] = field(default_factory=list)
    planted: Planted = Planted(0, 0, ())


def generate_dataset(count: int, seed: int) -> Dataset:
    rng = random.Random(seed)
    bands = _bands()
    band_of = {(band["job_level"], band["country"]): band for band in bands}

    employees = _employees(rng, count, band_of)
    planted = _plant_salaries_outside_the_band(rng, employees, band_of)
    return Dataset(
        rates=_rates(),
        bands=bands,
        employees=employees,
        salary_changes=_first_salary_changes(employees),
        planted=planted,
    )


def _rates() -> list[Row]:
    return [
        {"currency": currency, "rate_micro": rate, "as_of_date": REFERENCE_DATE}
        for currency, rate in RATES_MICRO.items()
    ]


def _bands() -> list[Row]:
    bands: list[Row] = []
    for code, country in COUNTRIES.items():
        for level in JOB_LEVELS:
            midpoint = _local_midpoint(level, code, country.currency)
            bands.append(
                {
                    "id": len(bands) + 1,
                    "job_level": level,
                    "country": code,
                    "currency": country.currency,
                    "min_minor": midpoint * BAND_MIN_PCT,
                    "mid_minor": midpoint * 100,
                    "max_minor": midpoint * BAND_MAX_PCT,
                }
            )
    return bands


def _local_midpoint(level: int, country: str, currency: str) -> int:
    """The band midpoint in whole local units, to the nearest 1,000."""
    usd = LEVEL_MIDPOINT_USD[level] * COUNTRY_PAY_PCT[country] // 100
    local = usd * 1_000_000 // RATES_MICRO[currency]
    return round(local / 1_000) * 1_000


def _employees(rng: random.Random, count: int, band_of: dict[tuple, Row]) -> list[Row]:
    profiles = _profiles(rng, count)
    employees: list[Row] = []
    for number, (country, level, gender) in enumerate(profiles, start=1):
        department = _pick(rng, DEPARTMENT_SHARE)
        first = rng.choice(FIRST_NAMES[gender])
        last = rng.choice(LAST_NAMES)
        employees.append(
            {
                "id": number,
                "employee_code": f"E{number:05d}",
                "full_name": f"{first} {last}",
                "email": f"{first}.{last}.{number}@acme.example".lower(),
                "job_title": job_title(department, level),
                "job_level": level,
                "department": department,
                "country": country,
                "currency": COUNTRIES[country].currency,
                "salary_minor": _salary_in_band(rng, band_of[(level, country)], country, gender),
                "gender": gender,
                "hire_date": REFERENCE_DATE - timedelta(days=rng.randint(30, 3650)),
                "status": INACTIVE if rng.randrange(100) < INACTIVE_PCT else ACTIVE,
            }
        )
    return employees


def _profiles(rng: random.Random, count: int) -> list[tuple[str, int, str]]:
    """The (country, job level, gender) of each employee, in a random order.

    The generator gives men and women the same job level mix in each country.
    A gender pay gap then comes only from the position in the band, not from the job levels.
    """
    profiles: list[tuple[str, int, str]] = []
    countries = _allocate(count, COUNTRY_SHARE)
    for country, country_count in countries.items():
        for level, level_count in _allocate(country_count, LEVEL_SHARE).items():
            women = level_count * WOMEN_PCT // 100
            profiles += [(country, level, "female")] * women
            profiles += [(country, level, "male")] * (level_count - women)
    rng.shuffle(profiles)
    return profiles


def _allocate(total: int, shares: dict) -> dict:
    """Splits `total` by the shares. The last key takes the remainder."""
    keys = list(shares)
    allocation = {key: total * shares[key] // sum(shares.values()) for key in keys}
    allocation[keys[-1]] += total - sum(allocation.values())
    return allocation


def _pick(rng: random.Random, shares: dict[str, int]) -> str:
    return rng.choices(list(shares), weights=list(shares.values()))[0]


def _salary_in_band(rng: random.Random, band: Row, country: str, gender: str) -> int:
    if gender == "female" and country in GAP_COUNTRIES:
        position = rng.triangular(0.0, 0.75, 0.15)
    elif gender == "female":
        position = rng.triangular(0.0, 1.0, 0.45)
    else:
        position = rng.triangular(0.0, 1.0, 0.5)
    low, high = int(band["min_minor"]), int(band["max_minor"])
    return _to_hundreds(low + int((high - low) * position))


def _to_hundreds(amount_minor: int) -> int:
    """Rounds down to 100 whole units, as a salary in a contract would be."""
    return amount_minor // 10_000 * 10_000


def _plant_salaries_outside_the_band(
    rng: random.Random, employees: list[Row], band_of: dict[tuple, Row]
) -> Planted:
    active = [e for e in employees if e["status"] == ACTIVE]
    below_count = len(active) * BELOW_RANGE_PCT // 100
    above_count = len(active) * ABOVE_RANGE_PCT // 100
    chosen = rng.sample(active, below_count + above_count)

    for employee in chosen[:below_count]:
        band = band_of[(employee["job_level"], employee["country"])]
        employee["salary_minor"] = _to_hundreds(int(band["min_minor"]) * rng.randint(85, 98) // 100)
    for employee in chosen[below_count:]:
        band = band_of[(employee["job_level"], employee["country"])]
        employee["salary_minor"] = _to_hundreds(
            int(band["max_minor"]) * rng.randint(103, 115) // 100
        )
    return Planted(below_range=below_count, above_range=above_count, gap_countries=GAP_COUNTRIES)


def _first_salary_changes(employees: list[Row]) -> list[Row]:
    created_at = datetime(REFERENCE_DATE.year, REFERENCE_DATE.month, REFERENCE_DATE.day)
    return [
        {
            "id": employee["id"],
            "employee_id": employee["id"],
            "old_salary_minor": None,
            "new_salary_minor": employee["salary_minor"],
            "reason": FIRST_SALARY_REASON,
            "effective_date": employee["hire_date"],
            "created_at": created_at,
        }
        for employee in employees
    ]


def write_dataset(session: Session, dataset: Dataset) -> None:
    session.execute(insert(ExchangeRate), dataset.rates)
    session.execute(insert(SalaryBand), dataset.bands)
    session.execute(insert(Employee), dataset.employees)
    session.execute(insert(SalaryChange), dataset.salary_changes)
    session.commit()


def main() -> None:
    started = time.perf_counter()
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    dataset = generate_dataset(count=EMPLOYEE_COUNT, seed=SEED)
    with SessionLocal() as session:
        write_dataset(session, dataset)
    elapsed = time.perf_counter() - started
    print(f"Created {len(dataset.employees)} employees in {elapsed:.1f} seconds.")


if __name__ == "__main__":
    main()
