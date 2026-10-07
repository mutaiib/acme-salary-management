# Plan: screen clarity

Spec: `docs/specs/screen-clarity-spec.md`. Process tier: standard. Risk: MODERATE. Format: Bee `/bee:planner`.

This plan replaces the first plan for "pay questions and screen clarity". The developer stopped the first plan after 3 slices, because the screens got too much content in a short time. The developer kept one slice (the search of the Pay health list). `docs/ai-usage.md`, Part 4, tells this.

## Global header

**Rule of the developer that replaces a Bee default: do not run `git commit`.** A slice is complete when its tests are green. The developer reviews before each commit.

**Architectural style**: the style of `docs/plans/salary-management-plan.md`. `routers -> services -> models`, and `services -> calculations`.

**Design brief**: `.claude/DESIGN.md`, from the Bee design agent. It gives the principles, the page patterns and the color rules.

**No hard floors**: no slice touches auth, payment, security or migrations.

### Rules for all slices

- Change one screen, show it to the developer, and wait for the review.
- Write the tests first and see them fail (CLAUDE.md Article 1).
- Use Astryx components only. Read the documentation of a component before the first use.
- Do not add a figure that the system does not have, unless the developer asks for it and `docs/requirements.md` has it.
- Write screen text and document text in the STE rules (CLAUDE.md Article 3).

## Slices

| Slice | Backend step | UI step |
|---|---|---|
| 1. Find an outlier | `matches_search` in `services/sql.py`. `list_outliers` takes a search and an optional status, and gives `range_status`. | `SearchBox`. A switch for all, below range and above range. A bar for the difference. |
| 2. The pay of a group | `summarize` in `services/employees.py`. `GET /api/employees/summary`. | `PaySummary` with 3 figures and the sentences of `summarySentences`. |
| 3. One look | None. | `theme.ts` (blue accent), the Figtree font, `Panel`, a lighter `FilterSelect`, one color rule for each badge. |
| 4. Figures that explain themselves | `median_salary_minor` in `services/overview.py`. `payroll_cost_minor` in the Pay health summary. | `formatMoneyShort`, a full value on hover, `OutlierNotice`, `SegmentBar` for a salary band, the band and the increase in the salary change dialog. |
| 5. Rows on a page | None. The API had `page_size`. | `useUrlFilters` keeps the page size. `ListPagination` shows the selector. |

## Decisions

| Decision | Reason |
|---|---|
| A bar is an Astryx `ProgressBar`. A band bar of 3 of them end to end (`SegmentBar`) left the product after the last review. | Astryx has no bar that starts after zero, and the 3 bars did not read as one. The Salary bands screen is a table. |
| The Pay health list shows the difference as an amount with a sign and a color, and as a share of the band limit. The bar left the list after the last review. | The outliers of the seed data are all near 15%, so the bars had almost the same length and gave no information. |
| The Pay health cards do not select a list. A switch on the list does. | The developer could not see all outliers with the cards. |
| A total has a short form. A salary does not. | A total of 12 digits is hard to compare. A salary must be exact. |
| `DataState` adds no wrapper without an error. | Astryx moves the first element of a wrapper in a card to the card edge. The table then lost the space above it. |

## End-of-spec review

- `reviewer`: always.
- `browser-verifier`: the screens against `docs/specs/screen-clarity-spec.md`.

## Escalation Log

No escalation.
