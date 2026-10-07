# Plan: ACME Salary Management

Spec: `docs/specs/salary-management-spec.md`. Format: Bee `/bee:planner`. This plan gives structure and decisions. It does not give function bodies.

## Global header

**Architectural style**: MVC with a service layer, per Bee `architecture-patterns`. The domain rules are small, so there are no ports and no repositories (YAGNI).

**Dependency direction**: `routers -> services -> models`, and `services -> calculations`. The `calculations` package imports nothing from the application.

**Process**: each slice has a backend step and then a UI step. Each step: tests red, code green.

**Tier rationale**: the pay calculations and the aggregate queries carry the business risk, so they get the `best` tier. Standard CRUD and screens get `excellent`. Distribution: 3 best, 3 excellent.

**No hard floors**: no slice touches auth, payment, security or migrations.

### Lexicon

| Concept | Backend name | UI name |
|---|---|---|
| Employee | `Employee`, table `employees` | `Employee` |
| Salary change | `SalaryChange`, table `salary_changes` | `SalaryChange` |
| Salary band | `SalaryBand`, table `salary_bands` | `Band` |
| Exchange rate | `ExchangeRate`, table `exchange_rates` | none |
| Money in minor units | field suffix `_minor`, type `int` | field suffix `_minor`, type `number` |
| Exchange rate value | `rate_micro`: USD micro-units for 1 local unit, type `int` | none |
| Range status | `RangeStatus`: `below`, `in_range`, `above`, `no_band` | same |
| Domain error | `DomainError(field, cause)` -> HTTP 422 | `ApiError` |

### Decisions that apply to all slices

- **Money**: integer minor units. All 7 currencies have 2 decimal places (USD, GBP, EUR, INR, CAD, AUD, SGD).
- **Conversion**: `usd_minor = (amount_minor * rate_micro + 500_000) // 1_000_000`. The same formula is in Python and in SQL, so the two always agree.
- **Totals**: convert each salary, then add. A total always equals the sum of its parts.
- **Median**: SQL window query (`ROW_NUMBER`, `COUNT` over a partition). The median of an even count is the mean of the two middle values, rounded half up.
- **Clock**: the router gets `today` from a dependency (`get_today`). A test replaces it. No service reads the clock.
- **Errors**: one handler maps `DomainError` and request validation errors to `422 { detail: [{ field, cause }] }`.
- **Pagination**: `page` starts at 1; `page_size` is 25 by default and 100 at most.
- **Database**: `SALARY_DB_URL`, default `sqlite:///./salary.db`. API tests use an in-memory database with one connection.
- **Seed**: `random.Random(42)` and the fixed reference date 2026-01-01. The seed does not read the clock.
- **UI data**: a `useApi` hook returns `{ data, error, isLoading, reload }`. There is no cache library.
- **UI components**: screens import shared components from `frontend/src/components/`. A shared component composes Astryx components.

### Layout

```
backend/
  app/main.py            create_app(), error handlers, static files
  app/db.py              engine, session, get_session
  app/models.py          Employee, SalaryBand, SalaryChange, ExchangeRate
  app/schemas.py         request and response models
  app/errors.py          DomainError, handlers
  app/reference.py       countries, currencies, departments, job titles
  app/seed.py            python -m app.seed
  app/calculations/      money.py, ranges.py, pay_gap.py
  app/services/          employees.py, bands.py, overview.py, pay_health.py, pay_equity.py, sql.py
  app/routers/           employees.py, bands.py, insights.py, meta.py
  tests/unit/            pure functions and the seed generator
  tests/api/             one file for each router
frontend/
  src/api/               client.ts, types.ts
  src/components/        shared component library
  src/hooks/             useApi.ts
  src/lib/               format.ts
  src/pages/             overview, employees, employee-detail, bands, pay-health, pay-equity
```

---

## Slice 0: Walking skeleton

1. **ACs**: spec Slice 0.
2. **Design intent**: prove the path from the database to the browser, with real seed data. The seed generator is a pure function, so tests check it without a database.
3. **Structure**
   - `models.py`: the 4 tables. Indexes on `employees(country)`, `(department)`, `(job_level)`, `(status)`; unique `employee_code`, `email`; unique `salary_bands(job_level, country)`.
   - `seed.py`: `generate_dataset(count: int, seed: int) -> Dataset`; `write_dataset(session, dataset) -> None`; `main() -> None`. `Dataset` holds lists of plain rows.
   - `services/employees.py`: `list_employees(session, query: EmployeeQuery) -> Page[Employee]`.
   - `routers/employees.py`: `GET /api/employees`.
   - `frontend`: `App` with `Theme`, `AppShell`, `SideNav`; `EmployeesPage`; `api/client.ts` `getJson<T>(path, params)`.
4. **Collaborators**: router -> service -> session. `seed.main` -> `generate_dataset` -> `write_dataset`.
5. **Control flow**: the generator makes bands and rates first, then employees. For each employee, the generator selects the country, the department, the job level and the gender. Then it selects a salary from the salary band. Then it plants the outliers and the pay gaps.
6. **Test strategy**: new `tests/unit/test_seed.py` (count, determinism, one band for each job level and country, one first salary change for each employee, the counts of the planted outliers). New `tests/api/test_employees_list.py` (page size, order, total, page 2). New `EmployeesPage.test.tsx` (rows, total, next page, error state).
7. **Standards**: `tdd-practices: test isolation` (no clock), `clean-code: SRP` (generate and write are separate).
8. **Tier**: `excellent`.
9. **Quality checks**
   - `generate_dataset` has no database import.
   - Two calls with the same seed return equal data.
   - The list query uses `LIMIT` and `OFFSET` in SQL.
   - The UI imports no color value.

## Slice 1: Employee pay record

1. **ACs**: spec Slice 1.
2. **Design intent**: a salary change is one transaction that adds a history row and updates the current salary. No code edits a history row.
3. **Structure**
   - `services/employees.py`: `get_employee(session, id) -> Employee`; `change_salary(session, id, new_salary_minor, reason, effective_date, today) -> SalaryChange`; `list_salary_changes(session, id) -> list[SalaryChange]`; `deactivate(session, id) -> Employee`. `EmployeeQuery` gains `search`, `country`, `department`, `job_level`, `status`, `sort`.
   - `errors.py`: `DomainError`, `NotFoundError`.
   - `routers/employees.py`: the 4 new endpoints. `routers/meta.py`: `GET /api/meta`.
   - UI: `EmployeesPage` (search, filters, sort), `EmployeeDetailPage`, `SalaryChangeDialog`, `SalaryHistoryTable`, `DeactivateDialog`. Shared: `PageHeader`, `DataState`, `Money`, `FilterBar`.
4. **Collaborators**: `change_salary` reads the employee, validates, writes both rows, commits once.
5. **Control flow**: the guards run in this order. The first guard that fails raises an error.
   1. The employee exists.
   2. The employee is active.
   3. The salary is more than zero.
   4. The reason is not blank.
   5. The effective date is not after `today`.
   6. The salary is different from the current salary.
6. **Test strategy**: new `tests/api/test_employee_detail.py`, `test_salary_changes.py`, `test_deactivate.py`; extend `test_employees_list.py` (search, each filter, sort, empty). UI: `EmployeeDetailPage.test.tsx`, `SalaryChangeDialog.test.tsx`; extend `EmployeesPage.test.tsx`.
7. **Standards**: `clean-code: guard clauses`, `tdd-practices: one reason to fail`.
8. **Tier**: `excellent`.
9. **Quality checks**
   - No router contains a query.
   - `change_salary` commits one time.
   - No code path updates or deletes a `salary_changes` row.
   - Each error case in the spec has one named test.

## Slice 2: Pay overview

1. **ACs**: spec Slice 2.
2. **Design intent**: one query shape serves the three groupings. The conversion formula has one definition in Python and one in SQL, and a test proves that they agree.
3. **Structure**
   - `calculations/money.py`: `convert_minor(amount_minor: int, rate_micro: int) -> int`; `median_minor(values: Sequence[int]) -> int`.
   - `services/sql.py`: `usd_minor_expr(amount_col, rate_col)`; `median_by(session, group_col, value_expr, filters) -> dict[str, int]`.
   - `services/overview.py`: `overview(session, group_by: GroupBy) -> Overview`.
   - `routers/insights.py`: `GET /api/insights/overview`.
   - UI: `OverviewPage`, shared `StatCard`, `GroupTable`.
4. **Collaborators**: `overview` joins `employees` to `exchange_rates` on currency and filters to active employees.
5. **Control flow**:
   1. One query calculates the aggregates of each group.
   2. One query calculates the median of each group.
   3. The service merges the results by group key.
   4. The service adds the group figures to get the totals.

   For `country` the salary figures are in the local currency. For the other groupings they are in USD.
6. **Test strategy**: new `tests/unit/test_money.py` (rounding half up, median of odd and even counts). New `tests/api/test_overview.py` with a hand-built set of 6 employees and hand-calculated figures; one test compares the SQL result to `convert_minor` and `median_minor` on the same rows. UI: `OverviewPage.test.tsx`.
7. **Standards**: `clean-code: DRY` (one conversion expression), `tdd-practices: hand-calculated expectations`.
8. **Tier**: `best`.
9. **Quality checks**
   - No `float` in `calculations/money.py` or in the overview query.
   - The payroll cost equals the sum of the group costs.
   - Inactive employees are absent from every figure.

## Slice 3: Salary bands

1. **ACs**: spec Slice 3.
2. **Design intent**: the range metrics are pure functions of a salary and a band. The employee response adds them at read time, so they are never stale.
3. **Structure**
   - `calculations/ranges.py`: `compa_ratio(salary_minor, mid_minor) -> Decimal` (2 places); `range_penetration(salary_minor, min_minor, max_minor) -> Decimal` (1 place); `range_status(salary_minor, min_minor, max_minor) -> RangeStatus`; `validate_band(min_minor, mid_minor, max_minor) -> None`.
   - `services/bands.py`: `list_bands(session, country) -> list[SalaryBand]`; `update_band(session, id, min_minor, mid_minor, max_minor) -> SalaryBand`; `band_for(session, employee) -> SalaryBand | None`.
   - `routers/bands.py`: `GET /api/bands`, `PUT /api/bands/{id}`. `GET /api/employees/{id}` adds `band`, `compa_ratio`, `range_penetration`, `range_status`.
   - UI: `BandsPage`, `BandEditDialog`, shared `RangeBar`, `RangeStatusBadge`; `EmployeeDetailPage` gains a "Position in range" section.
4. **Collaborators**: `update_band` calls `validate_band` before it writes.
5. **Control flow**: `range_status` returns `below` when salary < minimum, `above` when salary > maximum, else `in_range`. An employee with no band gets `no_band` and null metrics.
6. **Test strategy**: new `tests/unit/test_ranges.py` (the 45,000 example, both boundaries, rounding, invalid bands). New `tests/api/test_bands.py`. Extend `test_employee_detail.py`. UI: `BandsPage.test.tsx`, `RangeBar.test.tsx`.
7. **Standards**: `clean-code: pure functions`, `architecture-patterns: inner layer has no outward import`.
8. **Tier**: `best`.
9. **Quality checks**
   - `calculations/ranges.py` uses `Decimal` and `ROUND_HALF_UP`, and no `float`.
   - `RangeBar` clamps the marker to the bar for a salary outside the band.
   - The band rule (minimum < midpoint < maximum) has one definition.

## Slice 4: Pay health

1. **ACs**: spec Slice 4.
2. **Design intent**: one SQL join finds the outliers. The counts and the lists use the same filter, so they cannot disagree.
3. **Structure**
   - `services/pay_health.py`: `summary(session) -> PayHealthSummary`; `list_outliers(session, status, country, job_level, page, page_size) -> Page[Outlier]`. Private `_outside_band(status)` returns the shared SQL condition.
   - `routers/insights.py`: the 2 pay-health endpoints.
   - UI: `PayHealthPage` with 2 tabs (below, above), `StatCard` x3, `OutlierTable`.
4. **Collaborators**: join `employees` to `salary_bands` on `(job_level, country)` and to `exchange_rates` on currency.
5. **Control flow**: correction cost = sum, for each below-range active employee, of the converted difference between the band minimum and the salary.
6. **Test strategy**: new `tests/api/test_pay_health.py` (counts, cost, list content, filters, inactive excluded, count decreases after a correction). One test on the seeded dataset: the counts equal the planted anomaly counts. UI: `PayHealthPage.test.tsx`.
7. **Standards**: `clean-code: DRY` (one outlier condition).
8. **Tier**: `excellent`.
9. **Quality checks**
   - The summary and the list share `_outside_band`.
   - The list paginates in SQL.
   - The boundary values are in range, the same as `range_status`.

## Slice 5: Pay equity

1. **ACs**: spec Slice 5.
2. **Design intent**: the gap is a pure function of two pay values. The minimum group size is a named constant.
3. **Structure**
   - `calculations/pay_gap.py`: `MIN_GROUP_SIZE = 5`; `FLAG_THRESHOLD_PCT = Decimal("5.0")`; `gap_pct(men_pay: Fraction | int, women_pay: Fraction | int) -> Decimal` (1 place); `has_enough_data(men: int, women: int) -> bool`; `is_flagged(mean_gap, median_gap) -> bool`.
   - `services/pay_equity.py`: `pay_equity(session) -> PayEquity`.
   - `routers/insights.py`: `GET /api/insights/pay-equity`.
   - UI: `PayEquityPage`, shared `GapCell`; `Banner` for the "unadjusted" note.
4. **Collaborators**: sums and counts by gender from SQL; medians from `median_by`; gaps from `gap_pct`.
5. **Control flow**: for each group: if not enough data, return null gaps and `enough_data = false`. Else compute both gaps and the flag. The flag compares the rounded value, so the flag and the display agree.
6. **Test strategy**: new `tests/unit/test_pay_gap.py` (positive, negative, zero, exactly 5.0 is not flagged, 5.1 is flagged, group size boundary). New `tests/api/test_pay_equity.py` (hand-built groups). One test on the seeded dataset: the flagged countries equal the planted set. UI: `PayEquityPage.test.tsx`.
7. **Standards**: `clean-code: named constants`, `tdd-practices: boundary conditions`.
8. **Tier**: `best`.
9. **Quality checks**
   - The mean uses exact arithmetic (`Fraction`), not `float`.
   - No response contains a gap for a group that is too small.
   - The screen always shows the "unadjusted" note.

---

## End-of-spec review

- `reviewer` (always), tier `excellent`.
- `review-tests`, tier `excellent`: the brief grades test quality.
- `review-org-standards`, tier `excellent`: checks the code against `CLAUDE.md`.
- `review-coupling`: the plan did not select it. No slice has a hard floor, and each slice checks the dependency rule.

## Differences between the plan and the build

The build follows the plan. These points are different:

| Plan | Build | Reason |
|---|---|---|
| `GroupTable` is a shared component | `GroupTable` is in `pages/overview/` | Only one screen uses it. The constitution puts a component in the library when 2 screens use it. |
| `GapCell` shared component | `GapValue` in `pages/pay-equity/` | Same reason. |
| Search tests extend `test_employees_list.py` | New file `test_employee_search.py` | One file for each behavior is easier to read. |
| No `services/meta.py` | `services/meta.py` has the rate date query | A router must not query the database. |
| A flag for a gap of more than 5% | A flag for a gap of more than 5% in favor of men or of women | A gap in favor of women is also a difference to explain. The spec has this change. |
| The UI lint tool is not named | `oxlint` | It is the default of the Vite template. |
| `RangeBar` and `RangeStatusBadge` are shared components | They are in `pages/employee-detail/` | Only one screen uses them. |
| `SalaryChangeDialog.test.tsx` | The dialog tests are in `EmployeeDetailPage.test.tsx` | The tests open the dialog from the screen, as the HR Manager does. |
| `usd_minor_expr`, `median_by`, `band_for`, `_outside_band` | `usd_minor`, `median_by_group`, `position_of`, `_is_outside` | The names in the code are shorter or more exact. |
| `change_salary(..., today)` | `change_salary(..., today, now)` | The time of the record is also an input, so no service reads the clock. |
| The guards of a salary change | 2 more guards: the effective date is not before the hire date, and not before the last salary change | The end-of-spec review found that an old date made the salary history disagree with the current salary. |
| The UI reads "today" from the browser | The UI reads "today" from `GET /api/meta` | The browser and the server can be in different time zones. |
| No limit on an amount | An amount has a maximum of 10,000,000,000.00 units | A larger amount made the SQL arithmetic inexact. |
| No limit on the reason or the page number | The reason has a maximum of 500 characters. The page number has a maximum of 1,000,000. | A very large value gave a server error. |
| A "totals query" in the overview | The service adds the group figures to get the totals | A total then always equals the sum of its parts. There are 8 groups at most. |
| `tests/api/` has one file for each router | One file for each behavior: 14 files | A short file is easier to read. `test_static_ui.py` and `test_seed_write.py` have no router. |
| `median_by(session, group_col, value_expr, filters)` | `median_by_group(session, rows)`, and `active_employees_with_rate(*columns)` | The caller gives one query with a group column and a value column. All insights share the query on active employees. |
| `band_for(...) -> SalaryBand` | `position_of(...) -> RangePosition` | The function returns the band and the 3 range figures together. |
| The band rule: minimum < midpoint < maximum | 0 < minimum < midpoint < maximum | A band minimum of zero has no meaning. |
| The guards of a salary change are in the service | They are a pure function, `calculations/salary_changes.validate_salary_change` | A unit test checks each rule without a database, as for the band rule. |
| Pagination is in the employees service | `services/pagination.py` | Pay health also has a list with pages. |
| `errors.py` has the error handlers | `routers/error_handlers.py` has them | A service must not load the web framework. |
| The layout lists 2 API files, 1 hook and 1 `lib` file | The build has 6 API files, 5 hooks and 3 `lib` files | Each screen added an API file. The review moved shared logic into hooks and `lib`. |
| No rule for an employee without an exchange rate | The employee is not in an insight | The pay health summary and its list did not agree. Now all insights use one query. |
| `enough_data` | `has_enough_data`, and `is_flagged` | A boolean name that reads as a question. |

## Escalation Log

| Slice | Agent | From -> To | Reason | Time |
|---|---|---|---|---|

[ ] Reviewed
