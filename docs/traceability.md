# Traceability

Each requirement points to the slice that delivers it and to the tests that check it. Backend tests are in `backend/tests/`. UI tests are in `frontend/src/`.

Each test file starts with the IDs of the requirements that it checks. The service of each feature starts with the IDs that it serves. Other production code traces to a requirement through its test file.

## Functional requirements

The numbers FR-11, FR-12 and NFR-07 are not in use. Pay equity left the scope. See `requirements.md`.

The slices S0 to S4 are in `specs/salary-management-spec.md`. The slices C1 to C5 are in `specs/screen-clarity-spec.md`.

| ID | Requirement (short) | Slice | Backend tests | UI tests |
|---|---|---|---|---|
| FR-01 | Total payroll cost and the median salary of the organization in the reporting currency, with the exchange rates and their date | S2 | `unit/test_money.py`, `api/test_overview.py`, `api/test_meta.py` | `pages/overview/OverviewPage.test.tsx`, `pages/exchange-rates/ExchangeRatesPage.test.tsx`, `lib/format.test.ts` |
| FR-02 | Headcount, payroll cost and its share, and minimum, median and maximum salary, by country, department and job level | S2 | `unit/test_money.py`, `api/test_overview.py` | `pages/overview/OverviewPage.test.tsx`, `lib/format.test.ts` |
| FR-03 | Find an employee; filter and sort the list; set the rows on a page; the pay figures of the list | S0, S1, C2, C5 | `api/test_employees_list.py`, `api/test_employee_search.py`, `api/test_employee_detail.py`, `api/test_employee_summary.py`, `api/test_meta.py` | `pages/employees/EmployeesPage.test.tsx`, `pages/employees/summarySentences.test.ts` |
| FR-04 | Change a salary with a reason and an effective date, as a new salary or as an increase in percent | S1, C4 | `unit/test_salary_change_rules.py`, `api/test_salary_changes.py` | `pages/employee-detail/SalaryChange.test.tsx`, `lib/money.test.ts` |
| FR-05 | Refuse a salary that is zero or negative, and show the cause | S1 | `unit/test_salary_change_rules.py`, `api/test_salary_changes.py` | `pages/employee-detail/SalaryChange.test.tsx` |
| FR-06 | Keep each salary change; show the salary history | S1 | `unit/test_salary_change_rules.py`, `api/test_salary_changes.py`, `api/test_seed_write.py` | `pages/employee-detail/EmployeeDetailPage.test.tsx`, `pages/employee-detail/SalaryChange.test.tsx` |
| FR-07 | Set a salary band for each job level in a country | S3 | `unit/test_ranges.py`, `api/test_bands.py` | `pages/bands/BandsPage.test.tsx` |
| FR-08 | Compa-ratio and range penetration of each employee; the band and the amount to the band maximum before a salary change | S3, C4 | `unit/test_ranges.py`, `api/test_employee_detail.py` | `pages/employee-detail/EmployeeDetailPage.test.tsx`, `pages/employee-detail/RangeBar.test.tsx`, `pages/employee-detail/SalaryChange.test.tsx`, `lib/ranges.test.ts` |
| FR-09 | Employees below range and above range, all or one kind; find an outlier by name, email or employee code | S4, C1 | `unit/test_ranges.py`, `api/test_pay_health.py` | `pages/pay-health/PayHealthPage.test.tsx` |
| FR-10 | Cost to move all below-range salaries to the band minimum, and its share of the payroll cost | S4, C4 | `api/test_pay_health.py` | `pages/pay-health/PayHealthPage.test.tsx` |
| FR-13 | Deactivate an employee; insights count active employees only | S1, S2, S4 | `api/test_deactivate.py`, `api/test_overview.py`, `api/test_pay_health.py` | `pages/employee-detail/SalaryChange.test.tsx`, `pages/employee-detail/EmployeeDetailPage.test.tsx` |
| FR-14 | A first screen that states the purpose of the system and what it can do | C3 | None: the screen has no data | None: the screen has fixed text and one link. A check in a browser covers it |

## Quality requirements

| ID | Requirement (short) | Evidence |
|---|---|---|
| NFR-01 | A list page responds in less than 300 ms | `docs/performance.md`: the slowest list request has a 95th percentile of 18 ms. No automated test checks the time. |
| NFR-02 | A pay insight responds in less than 500 ms | `docs/performance.md`: the slowest insight has a 95th percentile of 56 ms. No automated test checks the time. |
| NFR-03 | The seed script creates exactly 10,000 employees in less than 30 seconds; two runs give the same data | `unit/test_seed.py`, `api/test_seed_write.py`; `docs/performance.md`: less than 1 second |
| NFR-04 | Money is an integer in minor units | `unit/test_money.py`, `lib/money.test.ts`; the tests for the largest amount in `api/test_salary_changes.py` and `api/test_bands.py` |
| NFR-05 | The unit tests complete in less than 10 seconds, with no network, clock or shared database state | `docs/performance.md`; `api/conftest.py` gives each test a new in-memory database, a fixed date, and a new session for each request |
| NFR-06 | One command installs, seeds and starts the system | `make start` in the `Makefile`; `api/test_static_ui.py` checks that the API serves the built UI |
| NFR-08 | A log line for each salary change, band change and deactivation | `api/test_write_log.py` |

## Tests for all screens

| Test file | Check |
|---|---|
| `components/DataState.test.tsx` | The loading, empty and error states that all screens share |
| `hooks/useApi.test.tsx` | A reply for an old request does not replace newer data; a new attempt removes the old error; the application knows that a load runs |

## Tests against the seeded data

Two tests load the seeded dataset. They compare an insight to the outliers that the seed script planted:

| Test | Check |
|---|---|
| `unit/test_seed.py::test_plants_the_recorded_number_of_salaries_outside_the_band` | The dataset contains the recorded number of outliers |
| `api/test_pay_health.py::test_finds_exactly_the_outliers_that_the_seed_script_planted` | Pay health finds exactly these outliers |
