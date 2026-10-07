# Plan: pay questions and screen clarity

Source: the visual review of the developer. Process tier: standard (no spec). Risk: MODERATE. Format: Bee `/bee:planner`.

The developer found two problems in the review:

1. Three screens do not explain their figures (Pay overview, Pay health, Pay equity).
2. The system answers only fixed questions. It cannot answer a combined question ("What do we pay Engineering in Germany?") or a question about time ("Payroll cost last year and now").

## Global header

**Rule of the developer that replaces a Bee default: do not run `git commit`.** A slice is complete when its tests are green. The developer reviews before each commit.

**Architectural style**: the style of `docs/plans/salary-management-plan.md`. `routers -> services -> models`, and `services -> calculations`. The `calculations` package imports nothing from the application.

**Context file**: `.claude/bee-context.local.md` (HEAD `2db553ed90030142c3f701a8c1f5b0c81d4643ca`). It has the lexicon, the reusable code and the traps.

**Tier rationale**: the trend has a new query on the salary history and a rule about dates, so it gets `best`. A label change gets `fast`. The other slices get `excellent`. Distribution: 1 best, 4 excellent, 1 fast.

**No hard floors**: no slice touches auth, payment, security or migrations.

### Lexicon for this plan

| Concept | Name |
|---|---|
| The filters of an insight | `InsightFilters(country, department, job_level)` in `services/sql.py` |
| The search condition of a list | `matches_search(text)` in `services/sql.py` |
| One point of the trend | `TrendPoint(as_of, headcount, payroll_cost_minor, change_pct)` |
| The direction of a gap | `gapDirection(gapPct)`: `'men'`, `'women'` or `'none'` |
| The period of a salary or a cost | "for one year". Do not write "annual", "yearly" or "per year". |

### Rules for all slices

- Write the tests first and see them fail (CLAUDE.md Article 1).
- Start each new test file with the requirement IDs. Add each new test file to `docs/traceability.md`.
- Add the new behavior to `docs/requirements.md` in the same slice, in the words that the slice gives.
- Write screen text and document text in the STE rules (CLAUDE.md Article 3).
- Do not put text or an icon in the value element of a `Stat`. Do not change a `Stat` label. Tests read them with exact matches.
- Use Astryx components only. Read the documentation of a component before the first use.

---

## Slice 1: The period of the overview figures

1. **ACs**
   - The Pay overview screen states that each salary and each payroll cost is for one year.
   - The Pay overview screen states that the headcount is the number of active employees today.
   - The statement shows for each of the 3 groupings.
2. **Design intent**: one sentence above the table, so the HR Manager reads the period before the figures. No change to a `Stat` label or a column header.
3. **Structure**
   - `pages/overview/OverviewPage.tsx`: a supporting `Text` between the tabs and the table: "Each salary and each payroll cost is for one year. The headcount is the number of active employees today."
   - The `Headcount` card hint becomes "Active employees today".
4. **Collaborators**: none new.
5. **Control flow**: none.
6. **Test strategy**: extend `pages/overview/OverviewPage.test.tsx`: the statement shows; it stays after a tab change.
7. **Standards**: `clean-code: least surprise`.
8. **Tier**: `fast`.
9. **Quality checks**
   - The text uses "for one year".
   - No existing test changes.

## Slice 2: Combined questions on the Pay overview

1. **ACs**
   - The HR Manager can filter the Pay overview by country, by department and by job level.
   - The 2 cards and the table show the figures of the filtered employees only.
   - The filters are in the address, so a reload keeps them.
   - With a country filter, the payroll cost stays in USD, and the salary figures of a country row stay in the local currency.
   - The screen shows an empty state when no active employee matches the filters.
   - The API refuses a job level that is not a number.
2. **Design intent**: the grouping answers "by what", and the filters answer "for whom". One filter object serves the overview now and the trend in slice 3.
3. **Structure**
   - `services/sql.py`: `@dataclass(frozen=True) class InsightFilters: country: str | None = None; department: str | None = None; job_level: int | None = None`, with `apply(self, statement: Select) -> Select`. An empty value means "no filter".
   - `services/overview.py`: `overview(session, group_by: GroupBy, filters: InsightFilters = InsightFilters()) -> Overview`. The 2 queries go through `filters.apply`.
   - `routers/insights.py`: `get_overview` gains `country: str | None`, `department: str | None`, `job_level: int | None`.
   - `api/insights.ts`: `getOverview(groupBy: GroupBy, filters: InsightFilterQuery)`, with `InsightFilterQuery = { country?: string; department?: string; job_level?: string }` in `api/types.ts`.
   - `pages/overview/OverviewPage.tsx`: `MetaBanner`, a `FilterBar` with `CountryFilter`, `FilterSelect` for the department, and `JobLevelFilter`. The values come from `useUrlFilters`. `useApi` depends on the grouping and the 3 filters.
4. **Collaborators**: `OverviewPage` -> `useMeta`, `useUrlFilters`, `getOverview`. `overview` -> `InsightFilters.apply` -> `active_employees_with_rate`.
5. **Control flow**: the empty state uses the existing rule (`headcount === 0`). Its title becomes "No active employee matches" when a filter is set.
6. **Test strategy**
   - Extend `tests/api/test_overview.py` with the `acme` fixture: one filter; two filters together ("Engineering in Germany"); a job level filter with the country grouping gives one row for each country; no match gives zero; a job level that is not a number gives 422.
   - Extend `pages/overview/OverviewPage.test.tsx`: the filters in the address go to the API; a selected country goes to the API; the empty state for no match; the banner when `/api/meta` fails. Add `/api/meta` to `stubOverview`.
7. **Standards**: `clean-code: DRY` (one filter object), `architecture-patterns: follow existing patterns` (`MetaFilters`, `useUrlFilters`).
8. **Tier**: `excellent`.
9. **Quality checks**
   - The router has no query.
   - The payroll cost still equals the sum of the group costs, with a filter.
   - No existing overview test changes its expected figures.

## Slice 3: Payroll cost over time

1. **ACs**
   - The Pay overview screen shows the payroll cost and the headcount at the end of each of the last 4 years, and today.
   - Each point after the first shows the change of the payroll cost from the point before, as a percentage with 1 decimal place.
   - A point uses, for each employee, the salary that was effective on that date. An employee with a hire date after that date does not count.
   - The trend uses the same filters as the overview (country, department, job level).
   - The screen states the 2 limits of the trend: it counts the employees who are active today, and it uses the exchange rates of today.
   - A point with no employees shows a payroll cost of zero and no change.
2. **Design intent**: the salary history already holds the data. One query gives the salary of each employee on a date. The dates and the change are pure functions, so unit tests check them without a database.
3. **Structure**
   - `calculations/trend.py` (new): `TREND_YEARS = 4`; `trend_dates(today: date, years: int = TREND_YEARS) -> list[date]` (December 31 of each of the `years` years before the year of `today`, then `today`); `change_pct(previous_minor: int, current_minor: int) -> Decimal | None` (1 decimal place, half up; `None` when `previous_minor` is zero).
   - `services/trend.py` (new): `@dataclass(frozen=True) class TrendPoint: as_of: date; headcount: int; payroll_cost_minor: int; change_pct: Decimal | None`; `pay_trend(session, today: date, filters: InsightFilters) -> list[TrendPoint]`; private `_figures_on(session, as_of: date, filters) -> tuple[int, int]`.
   - `schemas.py`: `TrendPointOut`, `TrendOut { reporting_currency, points }`.
   - `routers/insights.py`: `GET /api/insights/trend?country=&department=&job_level=`, with `today` from `get_today`.
   - `api/types.ts`: `TrendPoint`, `Trend`. `api/insights.ts`: `getTrend(filters)`.
   - `pages/overview/TrendTable.tsx` (new): columns "Date", "Headcount", "Payroll cost", "Change". The last row has the date and the word "today".
   - `pages/overview/OverviewPage.tsx`: a section with the heading "Payroll cost over time", a `DataState`, the `TrendTable`, and a supporting `Text` with the 2 limits.
4. **Collaborators**: `pay_trend` -> `trend_dates`, `_figures_on`, `change_pct`. `_figures_on` -> `active_employees_with_rate`, `InsightFilters.apply`, `reporting_minor`, the `SalaryChange` model.
5. **Control flow**
   - `_figures_on`: rank the salary changes of each employee with an effective date on or before `as_of`, newest first (`effective_date` descending, then `id` descending). Take rank 1. Join the active employees with a rate. Count the rows and add the converted salaries.
   - `pay_trend`: for each date in order, read the figures, then calculate the change from the point before.
6. **Test strategy**
   - New `tests/unit/test_trend.py`: the dates for a `today` in the middle of a year; for `today` on December 31; the change up, down, zero; `None` for a previous cost of zero; rounding half up.
   - New `tests/api/test_trend.py` with employees built by `make` and salary changes posted through the API with past effective dates: an employee counts from the hire date; a point uses the salary that was effective on its date, and not a later salary; two changes on the same date use the later one; an inactive employee does not count; the filters; the change between 2 points; hand-calculated figures in a comment.
   - New `pages/overview/TrendTable.test.tsx`: the rows, the change, "today" on the last row, no change on the first row. Extend `OverviewPage.test.tsx`: the section shows; the filters go to the trend request; the 2 limits show.
7. **Standards**: `clean-code: pure functions`, `tdd-practices: hand-calculated expectations`, `tdd-practices: test isolation` (the clock is an input).
8. **Tier**: `best`.
9. **Quality checks**
   - `calculations/trend.py` imports nothing from the application and does not read the clock.
   - `services/trend.py` gets `today` as an argument.
   - No `float` for an amount.
   - The last point of the trend equals the payroll cost and the headcount of the overview for the same filters. A test checks it.
   - `docs/tradeoffs.md` states the 2 limits of the trend.

## Slice 4: Pay health: select a list, and find an employee

1. **ACs**
   - The "Below range" card and the "Above range" card select the list. The selected card shows that it is selected.
   - A heading above the list names the list: "Employees below range" or "Employees above range".
   - The HR Manager can find an outlier by a part of the name, the email or the employee code.
   - A search goes back to the first page. The search text is in the address.
   - A search treats `%` and `_` as text.
   - The "Correction cost" card does not select a list.
2. **Design intent**: the cards become the control, so the screen has one control for one choice. The tabs go away. The search uses the code of the employee list: one search condition and one search hook.
3. **Structure**
   - `services/sql.py`: `matches_search(text: str) -> ColumnElement[bool]`, moved from `_matching` and `_escape_like` in `services/employees.py`. `services/employees.py` calls it.
   - `services/pay_health.py`: `list_outliers(session, status, country, job_level, search, page, page_size)`. `routers/insights.py`: `search: str | None = None`, passed by keyword.
   - `hooks/useSearchText.ts` (new): `SEARCH_DELAY_MS`, `useSearchText(applied, apply)`, moved from `pages/employees/EmployeesPage.tsx` with no change of behavior.
   - `components/SearchBox.tsx` (new): `SearchBox({ applied, onApply })`. It holds the `TextInput` (label "Search", placeholder "Name, email or employee code") and `useSearchText`. The Employees screen and the Pay health screen use it.
   - `components/StatCard.tsx`: new optional prop `selection?: { isSelected: boolean; onSelect: () => void }`. With it, the card is an Astryx `SelectableCard` with the label `Show the list: ${label}`. A click on the selected card keeps it selected.
   - `pages/pay-health/PayHealthPage.tsx`: the 2 cards get `selection`; the `TabList` goes away; a `Heading` level 2 names the list; the `FilterBar` gets the `SearchBox`; `listOutliers` gets `search`.
   - `api/insights.ts`: `OutlierQuery.search?: string`.
4. **Collaborators**: `PayHealthPage` -> `useUrlFilters` (`status`, `search`), `SearchBox`, `StatCard`.
5. **Control flow**: `onSelect` calls `setFilter('status', ...)`, which also removes the page number.
6. **Test strategy**
   - Extend `tests/api/test_pay_health.py`: find by name, by email, by employee code; the total counts the matches only; `%` and `_` as text; the search with a country filter. `tests/api/test_employee_search.py` must pass with no change.
   - Extend `pages/pay-health/PayHealthPage.test.tsx`: a click on the "Above range" card sends `status=above`; the selected card has the selected state; the heading follows the selection; the search sends one request after the delay (fake timers, as in `EmployeesPage.test.tsx`); the search in the address goes to the API. Replace the 2 tests that click a tab with tests that click a card.
   - `pages/employees/EmployeesPage.test.tsx` must pass with no change.
   - New `components/StatCard.test.tsx`: a card with no selection has no button role; a card with a selection calls `onSelect`.
7. **Standards**: `clean-code: DRY` (one search condition, one search box), `clean-code: YAGNI` (the second user of the search now exists).
8. **Tier**: `excellent`.
9. **Quality checks**
   - `services/pay_health.py` imports no private name from `services/employees.py`.
   - No screen has its own copy of the search box.
   - The screen has no `TabList`.
   - Each card can be selected with the keyboard.

## Slice 5: Pay equity: explain each figure, and show the direction

1. **ACs**
   - Each of the 3 cards has an information button. It shows what the figure means and what it covers.
   - The information states that the figures cover all active employees and the base salary for one year.
   - Each gap shows its direction in words and with an icon: "Men higher" for a positive gap, "Women higher" for a negative gap. A gap of 0.0% shows no direction.
   - The 2 organization cards state the direction in words for a positive gap and for a negative gap.
   - A group without enough data shows no direction.
2. **Design intent**: the figure, its direction and its meaning are together, so the HR Manager does not read a footnote. One function gives the direction for the table and for the cards.
3. **Structure**
   - `components/Stat.tsx` and `components/StatCard.tsx`: new optional prop `info?: string`. With it, the label row has an Astryx `IconButton` (icon `<Icon icon="info" />`, variant `ghost`, size `sm`, label `About: ${label}`, `tooltip={info}`). The button is a sibling of the label `Text`, not a child.
   - `pages/pay-equity/gapDirection.ts` (new): `type GapDirection = 'men' | 'women' | 'none'`; `gapDirection(gapPct: number): GapDirection`; `DIRECTION_LABEL: Record<GapDirection, string>` ("Men higher", "Women higher", "").
   - `pages/pay-equity/GapTable.tsx`: `GapValue` shows an `Icon` (`arrowUp` for men, `arrowDown` for women, decorative) and the label before the percentage, for each gap that has a direction.
   - `pages/pay-equity/PayEquityPage.tsx`: `gapNote` uses `gapDirection`: "Men have the higher pay." or "Women have the higher pay." The 3 cards get `info`. The page description gains: "The figures cover all active employees and the base salary for one year."
   - Information texts (each one below 140 characters):
     - Mean gap: "The mean pay of men less the mean pay of women, as a percentage of the mean pay of men."
     - Median gap: "The middle pay of men less the middle pay of women, as a percentage of the middle pay of men."
     - Countries with a flag: "A country gets a flag when its mean gap or its median gap is more than 5%, for men or for women."
4. **Collaborators**: `GapTable` and `PayEquityPage` -> `gapDirection`.
5. **Control flow**: `gapDirection` returns `'none'` for 0, `'men'` above 0, `'women'` below 0.
6. **Test strategy**
   - New `pages/pay-equity/gapDirection.test.ts`: positive, negative, zero.
   - Extend `pages/pay-equity/PayEquityPage.test.tsx`: a positive gap in a row shows "Men higher"; a gap of zero shows no direction; the organization card states "Men have the higher pay" for a positive gap; each card has a button with the name `About: <label>`; the description states what the figures cover. The existing tests for "Women higher" must pass with no change.
   - Extend `components/StatCard.test.tsx`: a card with `info` has the button; a card without `info` has no button; the group name is still the label.
7. **Standards**: `clean-code: DRY` (one direction rule), `design-fundamentals: do not use an icon as the only carrier of a meaning`.
8. **Tier**: `excellent`.
9. **Quality checks**
   - Each icon has text next to it.
   - The flag threshold in the information text comes from `flag_threshold_pct`, not from a literal.
   - The group name of each `Stat` is still its label.
   - No information text has more than 140 characters.

## Slice 6: Back goes to the screen that the HR Manager came from

1. **ACs**
   - From the Pay health list, the back link of the Employee detail screen says "Back to Pay health". It opens Pay health with the same card, filters, search and page.
   - From the Employees list, the back link says "Back to Employees". It opens the list with the same search, filters and page.
   - When the HR Manager opens an employee from an address directly, the back link says "Back to Employees".
2. **Design intent**: the link that opens an employee tells the detail screen where it came from. The address of the detail screen does not change.
3. **Structure**
   - `components/EmployeeLink.tsx`: gains `from?: { label: string }`. It uses the router location (`useLocation`) for the path and the query of the current screen, and gives both to the router as navigation state: `{ from: { path, label } }`.
   - `components/RouterLink.tsx`: passes a `state` prop to the router `Link`.
   - `hooks/useBackLink.ts` (new): `useBackLink(fallback: { path: string; label: string }) -> { path: string; label: string }`. It reads `location.state.from` and returns the fallback when there is none.
   - `pages/employee-detail/EmployeeDetailPage.tsx`: the back link uses `useBackLink({ path: '/employees', label: 'Employees' })`.
   - `pages/employees/EmployeesPage.tsx` and `pages/pay-health/OutlierTable.tsx`: give `from` to `EmployeeLink` ("Employees", "Pay health").
4. **Collaborators**: `EmployeeLink` -> `RouterLink` -> router state -> `useBackLink`.
5. **Control flow**: `useBackLink` accepts a state path only when it starts with `/`. Any other value gives the fallback.
6. **Test strategy**
   - New `hooks/useBackLink.test.tsx`: the state path; no state; a state path that does not start with `/`.
   - Extend `pages/employee-detail/EmployeeDetailPage.test.tsx`: the label and the address of the back link with a state, and without one. `renderScreen` gains an optional `state` for the first entry.
   - Extend `pages/pay-health/PayHealthPage.test.tsx`: a click on an employee opens the detail address (the existing link test stays).
7. **Standards**: `clean-code: least surprise`, `clean-code: YAGNI` (no global store; the router holds the state).
8. **Tier**: `excellent`.
9. **Quality checks**
   - The address of the detail screen has no extra query parameter.
   - A reload of the detail screen still shows a back link.
   - No screen writes the back address by hand.

---

## End-of-spec review

- `reviewer` (always), tier `excellent`.
- `review-tests`, tier `excellent`: the trend has date rules, and the brief grades test quality.
- `review-org-standards`, tier `excellent`: the slices add behavior, so the requirements and the constitution need a check.
- Browser verification: one pass over the 3 screens against the ACs. The application runs at http://localhost:8000 after `make build`.

## Escalation Log

| Slice | Agent | From -> To | Reason | Time |
|---|---|---|---|---|

[ ] Reviewed
