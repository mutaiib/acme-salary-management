# Spec: screen clarity

## Overview

The developer reviewed each screen of the first build. The review found two problems.

1. A screen did not explain its figures. An amount did not state its period.
2. The HR Manager could not answer a combined question, for example "What does ACME pay the Engineering department in Germany?".

This spec records the changes that answer the review. Each criterion is one behavior that a test or a person can check. Terms: `docs/glossary.md`. Requirements: `docs/requirements.md`. Design rules: `.claude/DESIGN.md`.

Sources:
- The comments of the developer. `docs/ai-usage.md`, Part 4, has each comment.
- The design brief of the Bee design agent (`.claude/DESIGN.md`).
- 5 pictures of the screens from the developer. They were a reference for the layout only.
- The check of the brief in a browser (`docs/specs/brief-acceptance-spec.md`).

## Slice 1: Find an outlier (FR-09)

- [x] The Pay health list shows all outliers first.
- [x] The system must let the HR Manager show only the below-range employees or only the above-range employees.
- [x] Each row states the range status of the employee.
- [x] The system must let the HR Manager find an outlier by a part of the name, the email or the employee code.
- [x] The search uses the country filter and the job level filter at the same time.
- [x] Each row shows the difference to the band limit as an amount and as a bar.

## Slice 2: The pay of a group of employees (FR-01, FR-02, FR-03)

- [x] The Employees screen shows 3 figures for the employees that match the search and the filters: the number of active employees, the payroll cost and the median salary.
- [x] Each figure states its period and its currency.
- [x] The screen explains the median salary in plain words.
- [x] The screen states the lowest salary and the highest salary of these employees.
- [x] The figures count active employees only. The screen states this when the list can show inactive employees.
- [x] The salary figures use the local currency when all these employees have one currency. In all other conditions they use the reporting currency.
- [x] The list stays on the screen when the figures do not load.

## Slice 3: One look for all screens

- [x] All screens use Astryx components only. The colors come from the tokens of the theme.
- [x] The accent color is blue. A link and a primary button use it.
- [x] A status has one color rule: green for a normal status, yellow for a salary outside the band, grey for an inactive employee.
- [x] Each section of a screen is in a card with a title.
- [x] The space above each table in a card is the same.
- [x] A filter shows its name in the closed field, so a row of filters has one line.
- [x] The status filter of the Employees screen shows its 3 values at the same time.
- [x] A list of inactive employees only does not show the Inactive badge in each row.
- [x] A thin line with a shimmer at the top of the application shows while data loads. The old data stays on the screen, and the screen does not move.
- [x] The HR Manager can collapse the navigation to get more width for a table.
- [x] The application has an icon for the browser tab.
- [x] A required input shows a red star.
- [x] A screen shows the name of a country, not its code.
- [x] The explanation of a figure opens from an info button beside its label.

## Slice 4: Figures that explain themselves (FR-01, FR-02, FR-08, FR-10)

- [x] A large total shows in a short form, for example `$567.68M`. The full amount shows when the pointer is on the figure.
- [x] A salary always shows all its digits.
- [x] Each screen states that an amount is for one year.
- [x] The salary history shows the date of a record in the time zone of the HR Manager.
- [x] The Pay overview shows the median salary of the organization.
- [x] The Pay overview states the number of salaries outside the salary band, with a link to the Pay health screen.
- [x] The Pay overview shows the minimum, the median and the maximum salary of each group in one column, with a mark at the median.
- [x] The Pay overview names the share as the share of the ACME payroll cost.
- [x] The Pay health screen shows the correction cost as a share of the payroll cost.
- [x] The salary change dialog shows the salary band, and the amount between the new salary and the band maximum.
- [x] The salary change dialog has an input for the increase in percent. A value in it sets the new salary.
- [x] The Salary bands screen shows the bands of each country in one card, and each band as a bar on the scale of the country.
- [x] The theme is the Astryx neutral theme as source, with a blue accent.
- [x] The Employee detail screen shows the salary, the range status and the position in the salary band in one card.

## Slice 5: The number of rows on a page (FR-03, FR-09)

- [x] The system must let the HR Manager show 25, 50 or 100 rows on a page of the Employees list and of the Pay health list.
- [x] A new page size starts the list at page 1.
- [x] The address keeps the page size.

## Out of Scope

- A change of the payroll cost in time. The developer chose a fixed label for the period ("for one year").
- The cost for each employee. It is near the median salary and can confuse.
- An export to a file, a proposal of raises for many employees, and a selection of rows. They are a part of the compensation cycle that the developer left out.
- A sort by a click on a column header.
- Pay equity. The developer removed it from the product. See `docs/requirements.md`.
- A bulk salary change. The developer asked for one and stopped it before the write step. See `docs/tradeoffs.md`.

## Technical Context

- Risk level: MODERATE
- New API fields: `median_salary_minor` on the Pay overview; `payroll_cost_minor` on the Pay health summary; `range_status` on each outlier.
- New API behavior: `GET /api/insights/pay-health/employees` has an optional `status` and a `search`. `GET /api/employees/summary` gives the figures of a list.
- New shared components: `Panel`, `SegmentBar`, `SearchBox`, `TermHelp`, `LoadingBar`. `Stat` shows a full value on hover and an explanation from an info button.
- A table that is the first element in a card moves into the padding of the card. `DataState` adds no wrapper when there is no error, so the space stays the same.

[ ] Reviewed
