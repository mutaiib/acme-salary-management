# Plan: band insight and charts

Input: a prompt of the developer, with no spec. Process tier: standard. Risk: MODERATE. Format: Bee `/bee:planner`.

HEAD at the time of the plan: `23c0e7226d0d116d8850973e5379463df0893e49`. Context file: `.claude/bee-context.local.md`.

## Changes after the plan

The developer reviewed each screen in a browser, and the build changed. The slice text below is the plan as written. These points are different in the final build:

- Slices 4 to 6 put the 2 charts and the highest salaries on the Pay overview and on Pay health. Slice 7 moved them to one screen with 3 tabs.
- Slice 7 names the screen "Insights" at `/insights`. The developer selected "Pay analysis" at `/analysis`, in `pages/analysis/`. The navigation section keeps the title "Insights".
- Slice 2 shows the outliers of a band as badges. The final build shows 2 columns of plain numbers that are links.
- Slice 8 marks a list with `from` and `from_tab`. The final build has one way back for lists and records: the address of the screen before, in `back` (`lib/backLinks.ts`). Pay analysis keeps its tab, its grouping and its country in the address, so the way back opens the same view.
- `docs/tradeoffs.md`, section "Decisions that changed", gives the cause of each change.

## What the developer asked for, and what the plan does

| Request | Result |
|---|---|
| Check what a band change does to the figures | The section "What a band change does today" gives the answer. Slices 2 and 3 put the answer in the product. |
| "Add some identifiers" | The developer withdrew this item. |
| Value-added features | The developer left the selection to the planner. The plan adds 2 features that use the same band query: the figures of each band, and the preview of a band change. |
| Answer the main question with charts | The developer approved 2 charts and Recharts: the salary distribution, and the outliers by group. |
| Show the previous salary next to the new salary | Slice 1. |
| A load indicator at the filters (later request) | Done outside the slices: `LoadingMark` in `FilterBar` and on the Pay overview. |
| The people with the highest pay in a country, with a view in dollars (later request) | Slice 6. |

Candidates that are not in this plan: a band change history with a reason, and a list of the recent salary changes of all employees. Each one needs the approval of the developer and a new requirement.

## What a band change does today

| Band value | Figures that change |
|---|---|
| Minimum | Range penetration, the below-range status, the below-range count, the outlier list, the correction cost |
| Midpoint | The compa-ratio only |
| Maximum | Range penetration, the above-range status, the above-range count, the outlier list, the room to the band maximum |

- The system calculates each figure at read time. A band change shows on each screen at once.
- The band dialog does not show the effect of a change before the save.
- A band change leaves a log line only. It has no reason and no history.
- The Salary bands screen does not show how many employees a band has.

## Global header

**Rule of the developer that replaces a Bee default: do not run `git commit` or `git add`.** A slice is complete when its tests are green. The developer reviews all slices before a commit.

**Architectural style**: MVC with a service layer. `routers -> services -> models`, and `services -> calculations`. The `calculations` package imports nothing from the application. A router does not query the database.

**Design brief**: `.claude/DESIGN.md`. Principle 5 applies to each slice: exceptions stand out, and normal values stay quiet. Add one section to a screen, not more.

**Tier rationale**: the SQL counts must agree with the rule of `range_status`, and the first chart sets the pattern for all charts. Distribution: 7 excellent, 2 fast.

**No hard floors**: no slice touches auth, payment, security or migrations. The plan adds no table and no column.

### Lexicon

- Use the terms of `docs/glossary.md`: salary band, minimum, midpoint, maximum, below range, above range, outlier, correction cost, headcount, payroll cost. Do not write "pay scale", "annual" or "yearly".
- New term: **salary bracket**, the salaries between two amounts in the reporting currency. All salary brackets have the same width.
- Suffixes: `_minor` for an amount, `_count` for a number of employees, `_pct` for a percentage.
- New names, fixed for all slices: `BandFigures`, `BandEffect`, `BandChangePreview`, `SalaryBracket`, `SalaryDistribution`, `OutlierGroup`, `ChangeFromTo`, `ChartFigure`, `useChartColors`.

### Rules for all slices

1. Write the tests first and see them fail (CLAUDE.md Article 1.1).
2. Complete the backend step before the UI step (Article 1.3).
3. Start each new test file with its requirement IDs. Add the file to `docs/traceability.md` in the same slice.
4. Change `backend/app/schemas.py` and `frontend/src/api/types.ts` together.
5. Use `active_employees_with_rate` for each count, so that all insights count the same employees.
6. Read the Astryx documentation of a component before the first use.
7. Write screen text and document text in the STE rules (Article 3). Each amount states its period.
8. Run `make test` and `make lint` at the end of each slice.

## Slices

| Slice | Requirement | Backend step | UI step | Tier |
|---|---|---|---|---|
| 0. Requirements | All | None | None (documents) | fast |
| 1. From the current salary to the new salary | FR-04 | None | `ChangeFromTo` in the salary change dialog | fast |
| 2. The figures of each band | FR-15 | `GET /api/bands` gives the counts | 2 columns on the Salary bands screen | excellent |
| 3. The preview of a band change | FR-16 | `POST /api/bands/{id}/preview` | The effect block in the band dialog | excellent |
| 4. The salary distribution | FR-17 | `GET /api/insights/salary-distribution` | The first chart, on the Pay overview | excellent |
| 5. The outliers by group | FR-18 | `GET /api/insights/pay-health/groups` | The second chart, on Pay health; the shared chart parts | excellent |
| 6. The highest salaries | FR-19 | `GET /api/insights/highest-salaries` | A list of 10 on the Pay overview | excellent |
| 7. The Pay analysis screen | FR-17, FR-18, FR-19 | None | A new screen with 3 tabs; the 3 sections move to it. The developer selected the name "Pay analysis" after the build | excellent |
| 8. From a bar to its employees | FR-20 | A salary bracket filter for the employee list; a department filter for the outlier list | A click on a bar opens the list; back links with an arrow; a stable height while a tab loads | excellent |

### Slice 0: requirements and decisions

**ACs**
- `docs/requirements.md` has the new rows, and FR-04 has the new sentence.
- The documents record the chart decision and the new exception.

**Design intent**: Article 1.5 and 1.6 need a requirement before code. This slice changes documents only.

**Structure**: change these files.

`docs/requirements.md`:
- FR-04, new last sentence: "The system must show the current salary, the new salary and the difference before the HR Manager saves a salary change."
- FR-15: "The system must show the headcount of each salary band. The system must show the number of employees below range and above range for each salary band."
- FR-16: "The system must show the effect of a band change before the HR Manager saves it. The effect is the number of employees below range and above range, and the correction cost, with the current band and with the new band."
- FR-17: "The system must show a chart of the number of active employees in each salary bracket, in the reporting currency."
- FR-18: "The system must show a chart of the employees below range and above range for each country, department or job level."

`docs/glossary.md`: add "Salary bracket" to the Pay table, with the meaning in the Lexicon above.

`docs/tradeoffs.md`, decision 8: new title "A design system in public beta, and one chart library". Choice: Recharts 3 draws the charts, and each color comes from a token of the Astryx theme. Reason: the Astryx chart package is an empty placeholder on npm, and 2 questions need an axis that a progress bar does not have. Cost: one more dependency, and SVG elements that are not Astryx components. Add a row to "Exceptions to the constitution".

`CLAUDE.md`: add to the known exceptions of Article 4: "the charts, which Recharts draws as SVG with the colors of the Astryx theme tokens". Add `ChartFigure` and `useChartColors` to the patterns only in Slice 5.

`.claude/DESIGN.md`: remove the row "The Astryx chart packages" from the table of components that the screens do not use. Add a section "Charts" with the rules of Slice 4, "Standards to honor".

`docs/traceability.md`: add the rows FR-15 to FR-18 with the slice numbers B2 to B5 and "None yet" for the tests. Each later slice fills its row.

**Collaborators**: none. **Control flow**: none.

**Test strategy**: no test. The slice has no code.

**Standards to honor**: CLAUDE.md Article 3 (STE: 20 words for an instruction, 25 for a description, active voice, `must` for a requirement).

**Quality checks**
- Each new requirement sentence uses `must` and has a maximum of 25 words.
- No document uses a synonym of a glossary term.
- `docs/requirements.md` does not reuse FR-11 or FR-12.

### Slice 1: from the current salary to the new salary

**ACs**
1. The salary change dialog shows the current salary and the new salary in one line, and the HR Manager can read the line while the input has the focus.
2. The line shows the difference as an amount with a sign, and in percent.
3. With no difference, the line says that the salary does not change.
4. With an empty input, the line shows the current salary only.

**Design intent**: one small display component that owns the sentence of the change. The dialog keeps its state and its rules.

**Structure**
- New `frontend/src/pages/employee-detail/ChangeFromTo.tsx`: `ChangeFromTo({ oldMinor, newMinor, currency }: { oldMinor: number; newMinor: number | null; currency: string })`.
- New in `frontend/src/lib/format.ts`: `formatSignedMoney(amountMinor: number, currency: string): string`. It gives `+$5,000` or `-$5,000`.
- Touch `SalaryChangeDialog.tsx`: render `ChangeFromTo` below the two inputs and above the `RangeBar`. Remove the `subtitle` of the dialog, because the line replaces it.

**Collaborators**: `ChangeFromTo` calls `formatMoney`, `formatSignedMoney` and `changePct`. It uses Astryx `Stack` and `Text` only.

**Control flow**
- `newMinor` is null: show "Current salary: X".
- `newMinor` equals `oldMinor`: show "Current salary: X. No change."
- Otherwise: show "From X to Y", then the signed difference and the signed percent, with `hasTabularNumbers`.
- No color for an increase or a decrease. Design principle 5 keeps a normal value quiet.

**Test strategy**
- Modify `pages/employee-detail/SalaryChange.test.tsx` (it already names FR-04): 3 tests for ACs 1 to 4, with `openEmployeeDetail` and `fillSalaryChange`. ASHA has $65,000; a new salary of 70000 gives `+$5,000` and `+7.7%`.
- Modify `lib/format.test.ts`: `formatSignedMoney` for a positive amount, a negative amount and zero.
- An existing test that reads the subtitle "Current salary" must change to the new line.

**Standards to honor**: `clean-code: SRP`, `clean-code: reuse before new code` (`changePct` exists), `tdd-practices: behavior-based names`.

**Build-agent tier**: fast.

**Quality checks**
- `ChangeFromTo` has no state and no effect.
- No amount conversion outside `lib/money.ts` and `lib/format.ts`.
- The line has text for the direction (a sign), not a color only.

### Slice 2: the figures of each band

**ACs**
1. `GET /api/bands` gives, for each band, `headcount`, `below_count` and `above_count`.
2. The counts use active employees who have an exchange rate. A band with no employee has zero in each count.
3. A salary equal to the minimum or the maximum is not in `below_count` or `above_count`.
4. The Salary bands screen shows the headcount of each band.
5. The screen shows the below-range count and the above-range count of a band only when the count is more than zero.
6. A count is a link to the Pay health screen with the country and the job level of the band.

**Design intent**: the counts are a pay health aggregation by band, so `pay_health` owns the SQL and `bands` joins the result to its list. Slice 3 uses the same aggregation with other limits.

**Structure**
- `services/pay_health.py`:
  - `@dataclass(frozen=True) class BandEffect`: `headcount: int`, `below_count: int`, `above_count: int`, `correction_cost_minor: int`.
  - `effect_by_band(session: Session, country: str | None = None) -> dict[int, BandEffect]`, with the band id as the key.
- `services/bands.py`:
  - `@dataclass(frozen=True) class BandFigures`: the 7 fields of a band, then `headcount`, `below_count`, `above_count`.
  - `list_band_figures(session: Session, country: str | None = None) -> list[BandFigures]`. It replaces the use of `list_bands` in the router. Remove `list_bands` if nothing else calls it.
- `schemas.py`: `BandFiguresOut(BandOut)` with the 3 counts. `BandOut` does not change, because `EmployeeDetailOut` and the `PUT` use it.
- `routers/bands.py`: `list_bands` returns `list[BandFiguresOut]`.
- `api/types.ts`: `BandFigures extends Band`. `api/bands.ts`: `listBands` returns `Promise<BandFigures[]>`.
- `pages/bands/BandsPage.tsx`: 2 new columns, "Employees" and "Outside the band". New local component `OutsideBand({ band, countryName })` in `pages/bands/OutsideBand.tsx`.
- `test/data.ts`: new builder `bandFigures(number, overrides)`, on top of `band`.

**Collaborators**: `bands` service -> `pay_health.effect_by_band` -> `_active_employees_with_band`, `_is_outside`, `reporting_minor`. `OutsideBand` uses Astryx `Badge`, `Link`, `Stack`, `Text`.

**Control flow**
- `effect_by_band`: one query, grouped by `SalaryBand.id`, with a count, 2 filtered counts and a filtered sum. Optional country filter.
- `list_band_figures`: read the bands in the order of `list_bands`. Take the effect of each band from the dictionary, or zeros when the band is absent.
- `OutsideBand`: zero below and zero above gives the supporting text "None". Otherwise a red badge `-N below range`, a green badge `+N above range`, or the two. Each badge is in a link to `/pay-health?status=...&country=...&job_level=...`.

**Test strategy**
- Modify `tests/api/test_bands.py`; its docstring becomes `FR-07, FR-15`. Tests for ACs 1 to 3: a band with one employee below, one at the minimum, one in range, one at the maximum, one above, one inactive, and a second band with no employee. Use `make.rate("USD", 1_000_000)`. The existing test that compares a full band dictionary must accept the new keys.
- Modify `pages/bands/BandsPage.test.tsx`; its header becomes `// FR-07, FR-15`. Tests for ACs 4 to 6, with `bandFigures`. Check the `href` of a count.
- No new unit test: the rule is `range_status`, and `tests/unit/test_ranges.py` covers it.

**Standards to honor**: `architecture-patterns: outer depends on inner` (a router calls a service only), `clean-code: DRY` (use `_is_outside`, do not write the comparison again), CLAUDE.md Article 1.9 (aggregation in the database), DESIGN.md color rules for below range and above range.

**Build-agent tier**: excellent.

**Quality checks**
- `effect_by_band` runs one SQL statement for all bands.
- No comparison of a salary with a band limit exists outside `_IS_OUTSIDE` in `pay_health.py`.
- `routers/bands.py` imports no model and no `select`.
- A band in range shows no badge and no color.
- `GET /api/bands` with 10,000 employees responds in less than 300 ms (measure it one time and record it in `docs/performance.md`).

### Slice 3: the preview of a band change

**ACs**
1. `POST /api/bands/{id}/preview` with a minimum, a midpoint and a maximum gives the effect with the current band and the effect with the new band. It saves nothing.
2. An effect has the headcount, the below-range count, the above-range count and the correction cost in the reporting currency.
3. The request refuses a band that `validate_band` refuses, with the same `422` body as the `PUT`. An unknown band gives `404`.
4. The band dialog shows each input with the current amount of the band next to it.
5. The band dialog shows the effect after the HR Manager stops typing: each figure as "current to new".
6. The dialog says that the midpoint changes the compa-ratio only.
7. While the band is not valid, the dialog shows no effect and no error from the preview. The save still shows the cause.

**Design intent**: the preview is the aggregation of Slice 2 for one band, with limits that come from the request and not from the row.

**Structure**
- `services/pay_health.py`: `effect_of_limits(session: Session, band: SalaryBand, min_minor: int, max_minor: int) -> BandEffect`.
- `services/bands.py`:
  - `@dataclass(frozen=True) class BandChangePreview`: `current: BandEffect`, `proposed: BandEffect`, `reporting_currency: str`.
  - `preview_band_change(session: Session, band_id: int, min_minor: int, mid_minor: int, max_minor: int) -> BandChangePreview`.
  - Private `_valid_band(session, band_id, min_minor, mid_minor, max_minor) -> SalaryBand`: the lookup and the validation that `update_band` has now. `update_band` and `preview_band_change` call it.
- `schemas.py`: `BandEffectOut`, `BandChangePreviewOut`.
- `routers/bands.py`: `preview_band_change(band_id: int, body: BandIn, session)` on `POST /{band_id}/preview`.
- `api/types.ts`: `BandEffect`, `BandChangePreview`. `api/bands.ts`: `previewBandChange(id: number, request: BandRequest): Promise<BandChangePreview>`.
- `pages/bands/BandEffectPreview.tsx`: `BandEffectPreview({ band, amounts }: { band: Band; amounts: BandRequest })`.
- Touch `BandEditDialog.tsx`: render `BandEffectPreview` below the inputs. Give each `MoneyInput` the `description` "Now: X".

**Collaborators**: `BandEffectPreview` -> `useDebouncedValue(amounts, 300)` -> `useApi(() => previewBandChange(...), [debounced amounts])`. It shows figures with `formatCount`, `formatMoney` and `formatSignedMoney` from Slice 1.

**Control flow**
- `effect_of_limits`: the query of the active employees of the country and the job level of the band. The filters compare the salary with the 2 bound values. Keep the rule of `_IS_OUTSIDE`: strictly less than the minimum, strictly more than the maximum.
- `preview_band_change`: validate, then call `effect_of_limits` 2 times: with the limits of the row, and with the limits of the request. No commit and no log line.
- `BandEffectPreview`: no request while the amounts equal the band. An error of the request gives the supporting text "Give a valid band to see the effect." A figure that does not change shows one value. A figure that changes shows "current to new" and the signed difference.

**Test strategy**
- Modify `tests/api/test_bands.py`; docstring `FR-07, FR-15, FR-16`. Tests: a higher minimum moves an employee below range and increases the correction cost; a lower maximum moves an employee above range; the band in the database does not change after a preview; an invalid band gives `422` with the field; an unknown band gives `404`; the correction cost of a EUR band is in USD.
- Add one test to `tests/api/test_pay_health.py`: for the `acme` fixture, the sum of the effects of all bands equals the figures of `summary`. This test keeps the 2 SQL rules the same.
- Modify `pages/bands/BandsPage.test.tsx`; header `// FR-07, FR-15, FR-16`. Tests for ACs 4 to 7, with fake timers as `EmployeesPage.test.tsx` does, and a `"POST /api/bands/1/preview"` stub.
- `tests/api/test_write_log.py`: add a test that a preview writes no "Band change" log line.

**Standards to honor**: `clean-code: DRY` (`_valid_band`), `clean-code: command and query separation` (a preview changes nothing), `tdd-practices: test the behavior through the API`, CLAUDE.md pattern "Errors".

**Build-agent tier**: excellent.

**Quality checks**
- `preview_band_change` has no `session.commit()` and no `logger` call.
- The validation of a band exists in one function of the service.
- The dialog sends a maximum of one preview request for each pause of 300 ms.
- A preview error never shows as an error banner in the dialog.
- The preview responds in less than 500 ms with 10,000 employees (NFR-02).

### Slice 4: the salary distribution

**ACs**
1. `GET /api/insights/salary-distribution` gives the salary brackets of the active employees in the reporting currency: `bracket_width_minor`, and for each bracket `from_minor`, `to_minor` and `headcount`.
2. The brackets start at zero, have one width, have no gap, and are 15 or fewer. An empty bracket between two others has a headcount of zero.
3. The sum of the headcounts equals the headcount of the Pay overview.
4. With no active employee, the list of brackets is empty.
5. The Pay overview shows one new section, "Salary distribution", between the figures and the table. It states the period and the currency.
6. The chart has a table view with the same values, which a screen reader reads.
7. The chart takes each color from an Astryx theme token.

**Design intent**: the width of a bracket is a pure rule. The count of each bracket is SQL. The first chart stays in its screen directory; Slice 5 moves the shared parts.

**Structure**
- New `calculations/distribution.py` (pure):
  - `bracket_width_minor(max_minor: int, max_brackets: int) -> int`: the smallest width from the series 1, 2, 5 times a power of 10, in whole currency units, that needs `max_brackets` or fewer brackets.
  - `@dataclass(frozen=True) class SalaryBracket`: `from_minor: int`, `to_minor: int`, `headcount: int`.
  - `brackets(headcount_by_index: dict[int, int], width_minor: int) -> list[SalaryBracket]`: from index 0 to the highest index, with zeros for the absent indexes.
- New `services/distribution.py` (docstring `FR-17`): `@dataclass(frozen=True) class SalaryDistribution` (`reporting_currency`, `bracket_width_minor`, `brackets`), and `salary_distribution(session: Session) -> SalaryDistribution`. Constant `MAX_BRACKETS = 15`.
- `schemas.py`: `SalaryBracketOut`, `SalaryDistributionOut`. `routers/insights.py`: `get_salary_distribution`.
- `api/types.ts`: `SalaryBracket`, `SalaryDistribution`. `api/insights.ts`: `getSalaryDistribution()`.
- `frontend/package.json`: add `recharts` at the exact version `3.10.1`, and `react-is` at the version of `react`.
- New `pages/overview/SalaryDistributionChart.tsx`: `SalaryDistributionChart({ distribution }: { distribution: SalaryDistribution })`.
- Touch `OverviewPage.tsx`: a `Panel` with its own `useApi(getSalaryDistribution, [])` and `DataState`.
- Touch `src/test/setup.ts`: a `ResizeObserver` stub with empty methods.

**Collaborators**: `salary_distribution` -> `active_employees_with_rate`, `reporting_minor`, `bracket_width_minor`, `brackets`. The chart uses Recharts `ResponsiveContainer`, `BarChart`, `Bar`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`; `useTheme` from `@astryxdesign/core/theme`; Astryx `VisuallyHidden`, `Stack`, `Text`.

**Control flow**
- `salary_distribution`: query 1 gives the maximum salary in the reporting currency; none gives an empty result. Query 2 groups by `reporting_minor(salary) // width` and counts.
- A salary equal to a bracket limit belongs to the higher bracket.
- The chart: vertical bars, one series, the bracket on the x axis with short labels (`$40K`), the headcount on the y axis from zero. The chart region is `aria-hidden` with `accessibilityLayer={false}`. A `VisuallyHidden` table has a caption, and one row for each bracket: "From X to Y", headcount.
- The tooltip shows the full bracket ("From $40,000 to $60,000") and the headcount with `formatCount`.

**Test strategy**
- New `tests/unit/test_distribution.py` (docstring `FR-17`): the width for several maximums (29,999,999 minor with 15 brackets gives 2,000,000; 30,000,000 gives 5,000,000, because a salary on a limit is in the higher bracket); a maximum of zero; `brackets` fills an empty bracket; `brackets` of an empty dictionary is empty.
- New `tests/api/test_salary_distribution.py` (docstring `FR-17, FR-13`): ACs 1 to 4; a EUR salary counts in its USD bracket; an inactive employee does not count; a salary on a limit is in the higher bracket.
- Modify `pages/overview/OverviewPage.test.tsx`; header adds `FR-17`. Tests: the table view has a row for each bracket; the section shows the empty state with no bracket; an error of the distribution does not hide the figures of the overview. Each existing test must stub `/api/insights/salary-distribution`; put the stub in the local `stubOverview` helper.
- Do not test SVG marks. jsdom has no layout.

**Standards to honor**
- CLAUDE.md Articles 1.9 and 1.10; `architecture-patterns: calculations import nothing`.
- Chart rules (the `dataviz` skill; record them in `.claude/DESIGN.md`): one y axis from zero; thin bars with a gap; a rounded top end of 4 px; grid lines and axes in `--color-border`; all text in `--color-text-secondary` or `--color-text-primary`, never in the color of the series; one series needs no legend; a hover tooltip on each bar; a table view.
- Series color: `--color-data-categorical-blue`.
- `ai-ergonomics: explicit names`.

**Build-agent tier**: excellent.

**Quality checks**
- `calculations/distribution.py` imports nothing from `app`.
- No Python loop over employees: the counts come from one grouped query.
- No color value by hand in a `.tsx` file: each chart color is a `token(...)` call.
- `recharts` has an exact version in `package.json`.
- The endpoint responds in less than 500 ms with 10,000 employees (NFR-02); record the time in `docs/performance.md`.
- The Pay overview has exactly one new section.
- `npx tsc -b` and `npm run build` pass with Recharts.

### Slice 5: the outliers by group

**ACs**
1. `GET /api/insights/pay-health/groups?group_by=country` gives, for each group, `key`, `label`, `headcount`, `below_count` and `above_count`. `group_by` accepts `country`, `department` and `job_level`, with `country` as the default.
2. The sum of the counts of all groups equals the counts of the Pay health summary.
3. The groups with the most outliers are first. Job levels are in the order of the level.
4. The Pay health screen shows one new section, "Outliers by country", between the figures and the list, with a switch for country, department and job level.
5. The chart shows the below-range part and the above-range part of each group, with a legend, and a table view with the same values.
6. `ChartFigure` and `useChartColors` are in the shared library, and the 2 charts use them.

**Design intent**: the second chart is the second implementation, so the shared chart parts move to the shared library now (Articles 1.7 and 4.4).

**Structure**
- `services/overview.py`: rename `_label` to `group_label`, because a second service uses it.
- `services/pay_health.py`: `@dataclass(frozen=True) class OutlierGroup` (`key: str`, `label: str`, `headcount: int`, `below_count: int`, `above_count: int`), and `outliers_by_group(session: Session, group_by: GroupBy) -> list[OutlierGroup]`. Docstring of the module adds `FR-18`.
- `schemas.py`: `OutlierGroupOut`. `routers/insights.py`: `list_outlier_groups(group_by: GroupBy = "country", session)`.
- `api/types.ts`: `OutlierGroup`. `api/insights.ts`: `listOutlierGroups(groupBy: GroupBy)`.
- New `components/ChartFigure.tsx`: `ChartFigure({ label, height, children, table }: { label: string; height: number; children: ReactNode; table: ReactNode })`. It owns the `aria-hidden` chart region and the `VisuallyHidden` table view.
- New `hooks/useChartColors.ts`: `useChartColors(): { series: string; below: string; above: string; ink: string; line: string; surface: string }`.
- New `pages/pay-health/OutlierGroupChart.tsx`: `OutlierGroupChart({ groups }: { groups: OutlierGroup[] })`.
- Touch `PayHealthPage.tsx` (the new `Panel`, with a local `groupBy` state as the Pay overview has), `SalaryDistributionChart.tsx` (use the 2 shared parts), `components/index.ts`.

**Collaborators**: `outliers_by_group` -> `_active_employees_with_band`, `_is_outside`, `GROUP_COLUMNS` and `group_label` from `services/overview`. Recharts `BarChart` with `layout="vertical"`, 2 `Bar` with one `stackId`, `Legend`.

**Control flow**
- `outliers_by_group`: one grouped query with a count and 2 filtered counts. Order: job level by its number; other groupings by `below_count + above_count`, highest first, then by label.
- An employee with no band is not in a group count, as in the summary.
- The chart: horizontal stacked bars, the group label on the y axis, the count on the x axis from zero, a 2 px gap in the surface color between the 2 parts. Legend entries: "Below range" and "Above range". The total of each bar has a direct label.
- Colors: `below` is `--color-data-categorical-red` and `above` is `--color-data-categorical-green`, as the badges of the outlier list. Run `node <dataviz skill>/scripts/validate_palette.js "<red hex>,<green hex>" --mode light`, and again with `--mode dark`, on the resolved values. If a check fails, use `--color-data-categorical-orange` for below range and `--color-data-categorical-blue` for above range, and record the reason in `.claude/DESIGN.md`.

**Test strategy**
- Modify `tests/api/test_pay_health.py`; docstring adds `FR-18`. Tests with the `acme` fixture: the counts by country; the counts by job level in the order of the level; the sum equals `summary`; an inactive employee and an employee with no band do not count.
- Modify `pages/pay-health/PayHealthPage.test.tsx`; header adds `FR-18`. Tests: the table view has a row for each group; the switch sends `group_by=job_level`; the section title follows the grouping. Put the new stub in the local `stubPayHealth` helper.
- New `components/ChartFigure.test.tsx` (header `// FR-17, FR-18`): the table view is in the document; the chart region is hidden from a screen reader.
- The tests of Slice 4 must stay green after the move.

**Standards to honor**: CLAUDE.md Articles 1.7, 1.9, 4.4 and the pattern "Insights"; `clean-code: DRY`; chart rules of Slice 4, and for 2 series: a legend is always present, and a color is never the only cue.

**Build-agent tier**: excellent.

**Quality checks**
- `useTheme` is called in `useChartColors` only.
- `SalaryDistributionChart` and `OutlierGroupChart` have no `aria-hidden` and no `VisuallyHidden` of their own.
- `services/pay_health.py` imports from `services/overview.py`, and not the reverse.
- The Pay health screen has exactly one new section.
- `CLAUDE.md` Article 2 lists `ChartFigure` and `useChartColors`, with a pattern line "A chart".
- `docs/traceability.md` has the tests of FR-15 to FR-18.

### Slice 6: the highest salaries

The developer added this slice on 8 October 2026, after the plan started. The requirement row, the traceability row and the tradeoff rows exist.

**Does one reporting currency give the right picture?** Not alone. A salary in the reporting currency is the cost of the employee to ACME. In one country the local currency gives an exact order. Across countries the converted order puts the countries with high pay first, and says nothing about the value of the pay. The compa-ratio compares a salary with the band of its country, so it is the fair measure across countries. The list shows the 3 figures.

**ACs**
1. `GET /api/insights/highest-salaries` gives the 10 active employees with the highest salary in the reporting currency, highest first. An equal salary orders by employee code.
2. With `country`, the list has employees of that country only.
3. Each row has `id`, `employee_code`, `full_name`, `job_title`, `job_level`, `department`, `country`, `currency`, `salary_minor`, `salary_reporting_minor` and `compa_ratio`. An employee with no band has a `compa_ratio` of null.
4. An inactive employee and an employee with no exchange rate are not in the list.
5. The Pay overview shows one new section at the bottom, "Highest salaries", with a country filter. Each name is a link to the employee record.
6. For one country, the section shows the salary in the local currency and in the reporting currency. For a country that uses the reporting currency, one amount shows.
7. The section says that the reporting currency shows the cost to ACME, and that the compa-ratio compares a salary with the band of its country.

**Design intent**: one insight query with a limit. No sort option for the employee list (see `docs/tradeoffs.md`).

**Structure**
- New `services/highest_salaries.py` (docstring `FR-19, FR-13`): `TOP_COUNT = 10`; `@dataclass(frozen=True) class HighSalary` with the fields of AC 3 (`compa_ratio: Decimal | None`); `highest_salaries(session: Session, country: str | None = None) -> list[HighSalary]`.
- `schemas.py`: `HighSalaryOut` (`compa_ratio: float | None`, as `EmployeeDetailOut` has). `routers/insights.py`: `list_highest_salaries(country: str | None = None, session)`.
- `api/types.ts`: `HighSalary`. `api/insights.ts`: `listHighestSalaries(country?: string)`.
- New `pages/overview/HighestSalaries.tsx`: `HighestSalaries()`; it owns its `useApi`, its country state and its `DataState`, as `OutlierNotice` owns its load.
- Touch `OverviewPage.tsx`: render `<HighestSalaries />` as the last section.

**Collaborators**: `highest_salaries` -> `active_employees_with_rate`, `reporting_minor`, an outer join to `SalaryBand`, and `calculations.ranges.compa_ratio` for each of the 10 rows. `HighestSalaries` -> `Panel`, `CountryFilter` with `useMeta`, `LoadingMark`, `DataTable`, `EmployeeLink`, `moneyColumn`, `jobLevelColumn`, `Money`.

**Control flow**
- One query: order by `reporting_minor(salary)` descending, then by employee code, with a limit of `TOP_COUNT`. The limit is in SQL.
- The country state is local to the section, and not in the address. The address of the Pay overview has no filter now.
- Columns: Employee (name link, with the job title below), Job level, Country (only with no country filter), Salary, Salary in the reporting currency (hidden when each row has the reporting currency), Compa-ratio (2 decimal places, or "No salary band").
- Empty state: "No active employees" for the selection.

**Test strategy**
- New `tests/api/test_highest_salaries.py` (docstring `FR-19, FR-13`): ACs 1 to 4. Include: a EUR salary that is lower as a number but higher in USD is first; a limit of 10 with 12 employees; the country filter; the compa-ratio of a row with a band, and null with no band.
- Modify `pages/overview/OverviewPage.test.tsx`; header adds `FR-19`. Tests for ACs 5 to 7; the country filter sends `country=DE`. Put the new stub in the local `stubOverview` helper, and stub `/api/meta`.
- No new unit test: `compa_ratio` and the conversion have unit tests.

**Standards to honor**: CLAUDE.md Article 1.9 and the patterns "Insights" and "Amounts on a screen"; `clean-code: SRP`; DESIGN.md principle 3 (each number says what it is) and principle 6 (less on the screen).

**Build-agent tier**: excellent.

**Quality checks**
- The query has a `LIMIT`, and no Python sort of employees.
- The section is the only new element on the Pay overview from this slice.
- Each amount column states its currency, and the section states "for one year".
- The endpoint responds in less than 500 ms with 10,000 employees (NFR-02).
- An error of this section does not hide the other sections of the Pay overview.

### Slice 7: the Insights screen

The developer added this slice on 8 October 2026, after a look at the screens of slices 4 to 6. The Pay overview and Pay health had too many sections.

**ACs**
1. The navigation has a new item "Insights", after "Pay health", at `/insights`.
2. The Insights screen has 3 tabs: "Salary distribution", "Outliers by group" and "Highest salaries". The first tab is open at first.
3. The address keeps the open tab (`?tab=outliers`), so a link and the back button work.
4. Each tab shows one section: the section that slices 4, 5 and 6 built, with no change of its content.
5. The Pay overview and Pay health do not show these 3 sections. They have the sections of the first version.
6. A tab works with a keyboard, and a screen reader gets the name of the open tab.

**Design intent**: a move, not a new feature. No API change and no new figure.

**Structure**
- New directory `frontend/src/pages/insights/`: `InsightsPage.tsx` (`InsightsPage()`), and the moved files `SalaryDistributionPanel.tsx` (from the local function of `OverviewPage.tsx`), `SalaryDistributionChart.tsx`, `HighestSalaries.tsx`, `OutlierGroupPanel.tsx` (from the local function of `PayHealthPage.tsx`), `OutlierGroupChart.tsx`.
- New `frontend/src/pages/insights/InsightsPage.test.tsx` (header `// FR-17, FR-18, FR-19: the Insights screen.`). The tests of the 3 sections move to it from `OverviewPage.test.tsx` and `PayHealthPage.test.tsx`.
- Touch `App.tsx`: the first navigation section gets the title "Pay", because an item now has the name "Insights". Add the screen with an icon of `lucide-react` (`ChartColumn`).
- Touch `OverviewPage.tsx`, `PayHealthPage.tsx` and their tests: remove the 3 sections and their stubs.

**Collaborators**: `InsightsPage` -> `PageHeader`, Astryx `TabList` and `Tab`, `useUrlFilters` for the `tab` value, and the 3 section components. Each section owns its `useApi`, so a tab loads its data only when it is open.

**Control flow**
- `tab` in the address is `distribution`, `outliers` or `highest`. An unknown value opens the first tab.
- Only the open section is in the document.

**Test strategy**
- `InsightsPage.test.tsx`: the 3 tabs; the first tab at first; a click opens a tab and sets the address; `?tab=highest` opens that tab; an unknown tab opens the first; a closed tab sends no request. Then the moved tests of each section, with `renderScreen(<InsightsPage />, { at: '/?tab=...' })`.
- `OverviewPage.test.tsx` and `PayHealthPage.test.tsx`: a test that the screen does not request the moved endpoints.
- The header of `OverviewPage.test.tsx` returns to `FR-01, FR-02`; the header of `PayHealthPage.test.tsx` loses `FR-18`.

**Standards to honor**: DESIGN.md principle 4 (one primary thing for each screen) and principle 6 (less on the screen); CLAUDE.md pattern "A screen" (filters in the address with `useUrlFilters`); Article 4.6 (keyboard).

**Build-agent tier**: excellent.

**Quality checks**
- `OverviewPage.tsx` and `PayHealthPage.tsx` import nothing from `pages/insights/`, and have no chart import.
- No test of a moved section was lost: the count of the moved tests is the same.
- The 3 section components have no change in behavior.
- `App.tsx` keeps one list of screens for the navigation and the routes.

### Slice 8: from a bar to its employees

The developer added this slice on 8 October 2026, after a look at the Pay analysis screen.

**ACs**
1. `GET /api/employees` and `GET /api/employees/summary` accept `salary_from_minor` and `salary_to_minor`: the salary in the reporting currency is equal to or more than the first, and less than the second. An employee with no exchange rate is not in a list with this filter.
2. For each salary bracket, the number of active employees in the list with that filter equals the headcount of the bracket in the salary distribution.
3. `GET /api/insights/pay-health/employees` accepts `department`. The Pay health list has a department filter.
4. A click on a bar of the salary distribution opens the Employees list with the bracket and the status "active".
5. A click on a part of a bar of the outliers chart opens the Pay health list with the status of the part (below range or above range) and the group (country, department or job level).
6. The Employees list shows the salary bracket as one item in the filter row ("Salary: $40,000 to $60,000 in USD"). The HR Manager can remove it.
7. A list that the HR Manager opened from a chart shows a link "Back to Pay analysis" above the title. The link opens the tab of the chart. The link stays when the HR Manager changes a filter or a page.
8. Each back link of the system has an arrow before its text.
9. A tab of Pay analysis keeps its height while it loads: no row or chart moves when the data arrives. A slow load shows a shimmer of the size of the content.
10. The section of a chart says that a bar opens its employees.

**Design intent**: a chart becomes a way into the lists that exist. The system gets 2 filters and no new screen.

**Structure**
- `services/employees.py`: `EmployeeQuery` gets `salary_from_minor: int | None` and `salary_to_minor: int | None`. `_matching` joins `ExchangeRate` and compares `reporting_minor(Employee.salary_minor)` only when one of the 2 is present. `routers/employees.py`: the 2 query parameters on the list and on the summary.
- `services/pay_health.py`: `list_outliers` and `select_outliers` get `department: str | None`. `routers/insights.py`: the parameter.
- `components/BackLink.tsx`: `BackLink({ href, label }: { href: string; label: string })`, an Astryx `Link` (`isStandalone`) with the arrow icon of `lucide-react` (`ArrowLeft`) as its left icon. `EmployeeDetailPage`, `ExchangeRatesPage`, `EmployeesPage` and `PayHealthPage` use it.
- `lib/chartLinks.ts` (pure): `bracketHref(bracket: SalaryBracket): string`, `outlierHref(groupBy: GroupBy, key: string, status: OutlierStatus): string`, `analysisBack(params: URLSearchParams): { href: string; label: string } | null`.
- `components/MetaFilters.tsx`: `DepartmentFilter`, from the department select of `EmployeesPage`. The 2 lists use it.
- `components/DataState.tsx`: a new prop `loadingHeight?: number`. With it, the first load keeps a box of that height, and shows one `Skeleton` of that height when the load is slow.
- `pages/analysis/`: the 2 charts get `onSelect` handlers that call `useNavigate`. `SalaryDistributionPanel`, `OutlierGroupPanel` and `HighestSalaries` give `loadingHeight` to their `DataState`.
- `pages/employees/EmployeesPage.tsx`: the bracket item (an Astryx `Token` with a remove action; read its documentation), and `BackLink` from `analysisBack`.
- `api/types.ts`, `api/employees.ts`, `api/insights.ts`: the new parameters.

**Collaborators**: the address carries the state. `from=analysis` and `from_tab=<distribution|outliers|highest>` mark a list that a chart opened. `useUrlFilters().setFilter` keeps the other parameters, so the mark stays.

**Control flow**
- Bracket link: `/employees?status=active&salary_from_minor=<from>&salary_to_minor=<to>&from=analysis&from_tab=distribution`.
- Outlier link: `/pay-health?status=<below|above>&<country|department|job_level>=<key>&from=analysis&from_tab=outliers`.
- `analysisBack`: null without `from=analysis`. The first tab gives `/analysis`; another tab gives `/analysis?tab=<tab>`.
- The chart region stays hidden from a screen reader and has no focus stop. The same lists are reachable with the filters of each list. `docs/tradeoffs.md` records this limit.
- A bar shows a pointer cursor (the `cursor` attribute of the Recharts `Bar`).

**Test strategy**
- Modify `tests/api/test_employees_list.py` and `tests/api/test_employee_summary.py` (docstrings add `FR-20`): the limits of the bracket (equal to the first limit is in, equal to the second is out), a EUR salary in its USD bracket, an employee with no rate, the 2 limits with the other filters.
- Modify `tests/api/test_salary_distribution.py`: AC 2 for each bracket of a fixture.
- Modify `tests/api/test_pay_health.py`: the department filter of the list.
- New `lib/chartLinks.test.ts` (`// FR-20`): the 2 links and `analysisBack`.
- Chart tests (`SalaryDistributionChart.test.tsx`, `OutlierGroupChart.test.tsx`, fixed size, no animation): a click on a bar calls `onSelect` with the bracket; a click on a part calls it with the group and the status.
- `EmployeesPage.test.tsx`, `PayHealthPage.test.tsx`: the back link shows only with `from=analysis`; the bracket item shows and its removal sends no bracket; the department filter sends `department`.
- `DataState.test.tsx`: `loadingHeight`. New `components/BackLink.test.tsx`.
- `PayAnalysisPage.test.tsx`: the hint of AC 10.

**Standards to honor**: CLAUDE.md Articles 1.9, 4.4 and 4.6, the patterns "Money" and "A screen"; `clean-code: pure functions for the links`; DESIGN.md principle 2 (plain words) and principle 6.

**Build-agent tier**: excellent.

**Quality checks**
- The bracket filter compares integers in SQL. No float, and no Python filter of employees.
- `EmployeesPage` and `PayHealthPage` build no address of Pay analysis by hand; `analysisBack` does.
- Each back link of the frontend is a `BackLink`.
- No handler of a chart reads `window.location`.
- The list endpoints with the new filters respond in less than 300 ms with 10,000 employees (NFR-01).

## End-of-spec review

| Agent | Tier | Reason |
|---|---|---|
| `reviewer` | excellent | Always. Checks the ACs of all slices and gives the ship recommendation. |
| `review-org-standards` | excellent | The constitution has many rules (requirement IDs, STE, Astryx only, money names), and this plan adds an exception. |
| `review-tests` | excellent | The chart tests check a table view and not the marks. The review confirms that they check behavior. |
| `browser-verifier` | excellent | One pass at the end: the 4 changed screens, in light and dark mode, with a keyboard. jsdom cannot check a chart. |

`review-coupling` is not mandatory, because no slice is floored.

After the review, the developer looks at each changed screen. Then the developer decides on the commits: one commit for each green step.

## Escalation Log

