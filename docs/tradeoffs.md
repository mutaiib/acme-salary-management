# Tradeoffs

This document records the choices of the work, with the reason and the cost of each one. The first section has the decisions that shaped the product. The tables after it have the smaller choices. The section "Decisions that changed" gives each decision that changed after the first version, with its date.

## The decisions that matter

### 1. Pay insights, not employee administration

- **Choice.** The product answers questions about how ACME pays people. It does not add or edit employees.
- **Reason.** The brief asks for answers about pay. A list of employees with a salary column is an Excel file in a browser. The HR information system owns the employee data.
- **Cost.** The HR Manager cannot add an employee or change a department. The data comes from the seed script.
- **Change it when** ACME has no HR information system, or when the import of employee data becomes the first task of the HR Manager.

### 2. The salary band is the reference point

- **Choice.** Each insight compares a salary to the salary band of its job level and country. Pay health, the compa-ratio and the correction cost all come from the band.
- **Reason.** A salary alone has no meaning. The band gives the HR Manager one rule for "correct", and one list of problems to work on.
- **Cost.** A job level without a band gives no insight for its employees. The bands of the demo come from the seed script, not from market data.
- **Change it when** ACME has market pay data. Then the band comes from the data, not from the HR Manager.

### 3. Pay equity left the scope

- **Choice.** The first build had a screen for the gender pay gap. The developer removed it after the review of the screens.
- **Reason.** An unadjusted gap does not tell the HR Manager what to do. A correct answer needs an adjusted gap by job category, which is a product in itself. The other insights answer the questions of the brief.
- **Cost.** The system does not show a difference between the pay of men and the pay of women. The gender of each employee stays in the data, so the feature can come back.
- **Change it when** ACME must report under the EU Pay Transparency Directive. Then the adjusted gap by job category is the first feature of the next iteration.

### 4. Money is an integer, and each salary converts before the sum

- **Choice.** An amount is an integer in minor units. An exchange rate is an integer in micro-units. A total converts each salary to USD and then adds. The rates are static, with a date.
- **Reason.** A floating-point number cannot represent a salary exactly. A total that equals the sum of its parts is a total that the HR Manager can check on the screen. Static rates give the same figures on each run, so a test can check an exact value.
- **Cost.** A total can differ by a few cents from "add, then convert". The rates become old; the screen shows their date. An amount has a maximum of 10,000,000,000.00 units, because a larger amount made the SQL arithmetic inexact.
- **Change it when** ACME needs the payroll cost at the rates of a given month. Then the rates get a history, and each insight takes a date.

### 5. Each insight is a query at read time, with no cache

- **Choice.** The groups, the medians and the outliers are SQL queries on SQLite. The system calculates each insight on each request.
- **Reason.** 10,000 rows are small. The slowest insight takes less than 60 ms on a developer laptop. A salary change or a band change then shows in each insight at once, and there is no cache to keep correct.
- **Cost.** The response time grows with the data. SQLite permits one writer at a time. Two salary changes for one employee in the same instant can record the same old salary.
- **Change it when** the data grows by 100 times, or when more than one person writes. Then use PostgreSQL, a version check on each salary change, and a cache that a write clears. `performance.md` has the measurements.

### 6. A small architecture: routers, services, pure calculations

- **Choice.** MVC with a service layer. The pay rules are pure functions in `calculations/`. There are no repositories, no ports and no cache library.
- **Reason.** The domain rules are small, and there is one database and one input channel. A pure function is the cheapest thing to test: most unit tests run in milliseconds and need no database.
- **Cost.** A second database or a second input channel needs a refactor. The rule "a salary equal to the minimum is in range" exists in Python, in SQL and in the UI. A test compares the SQL rule with the Python rule, and the UI rule has its own unit tests.
- **Change it when** a second implementation exists. The constitution says: no abstraction before a second implementation.

### 7. Python and FastAPI, with React and TypeScript

- **Choice.** The API is Python with FastAPI, SQLAlchemy and SQLite. The UI is React with TypeScript and the Astryx design system.
- **Reason.** This is the stack of the role. FastAPI supplies the API documentation and the request validation. TypeScript gives the UI the same shapes as the API.
- **Cost.** The shapes of the API exist twice: in `schemas.py` and in `types.ts`. A test does not check that they agree; a header in each file says to change the two together.
- **Change it when** the shapes change often. Then generate `types.ts` from the OpenAPI document of FastAPI.

### 8. A design system in public beta, and one chart library

Changed on 8 October 2026. The first version had no chart library.

- **Choice.** The UI uses Astryx 0.6.5 for all elements. Recharts 3 draws the 2 charts, and each chart color comes from a token of the Astryx theme. All other bars are Astryx progress bars.
- **Reason.** Astryx gives accessible components, a theme with tokens, and a command that gives an agent the documentation of each component. The Astryx chart package is an empty placeholder on npm. The 2 chart questions need an axis, and a progress bar has no axis.
- **Cost.** The API of Astryx can change; `package.json` pins the exact version. Recharts is one more dependency, and its SVG elements are not Astryx components. A test cannot check the marks of a chart, so each chart has a table view that a test and a screen reader read. The theme tokens are a copy as source, so an upgrade of Astryx does not update them.
- **Change it when** the Astryx chart package has a stable version. Then compare it with Recharts, and keep one of the two.

### 9. A band shows its effect

New on 8 October 2026.

- **Choice.** The Salary bands screen shows the headcount of each band, and its employees below range and above range. The band dialog shows the effect of a band change before the save: the 2 counts and the correction cost, with the current band and with the new band.
- **Reason.** Decision 2 makes the band the reference point, so a band change moves the range status of each employee of the band. In the first version, the HR Manager saw that effect only after the save, on a different screen.
- **Cost.** The band dialog sends a request while the HR Manager types. The preview is a query on the data of today, with no stored result.
- **Change it when** a band change needs an approval. Then the preview becomes a proposal that a second person accepts.

## Decisions that changed

| Date | Decision | Before | Now | Cause |
|---|---|---|---|---|
| 8 October 2026 | 8. Chart library | No chart library. A bar was an Astryx progress bar. | Recharts 3, with the colors of the theme tokens, for 2 charts. | The developer approved charts for the salary distribution and for the outliers by group. A table did not show the shape of these figures. |
| 8 October 2026 | 9. A band shows its effect | The Salary bands screen showed 3 amounts for each band. A band change had no preview. | The figures of each band, and the preview of a band change. | The developer asked what a band change does to the figures. The answer was not on a screen. |
| 8 October 2026 | The salary change dialog (FR-04) | The current salary was in the subtitle of the dialog. | One line shows the current salary, the new salary and the difference. | The developer did not see the current salary during the change. |
| 8 October 2026 | The load indicator | A thin line at the top of the application showed each load. The old rows stayed on the screen. | A list shows rows with a shimmer in place of the old rows, when a load takes more than 150 ms. | The developer did not see the line after a change of a filter. |
| 8 October 2026 | The highest salaries (FR-19) | The system showed the highest salary of a group, and not the employee. | The Pay analysis screen lists the 10 employees with the highest salary, for the organization or for one country. | The check of the brief found this question with no answer. The developer asked for it. |
| 8 October 2026 | The Pay analysis screen | The 2 charts and the highest salaries were sections of the Pay overview and of Pay health. | One screen with 3 tabs has them. The Pay overview and Pay health have the sections of the first version. | The developer saw the screens and asked for a new screen with tabs. The name "Pay analysis" says what the screen does. The Pay overview is the dashboard. |
| 8 October 2026 | From a bar to its employees (FR-20) | A chart showed a number only. | A bar opens the list of its employees. The list has a link back to the chart. | The developer asked for it: a number is more useful when the HR Manager can see who is in it. |
| 8 October 2026 | The way back from a list and from an employee record | A record went back to a list with no filters. | A link carries the address of its screen. A list goes back to the same tab and grouping of Pay analysis. A record goes back to its list, with the filters and the page. | The developer opened a record from a list with a salary bracket, and the way back lost the bracket. |
| 8 October 2026 | The outliers of a band, on the Salary bands screen | A red badge and a green badge, with a link below them. | 2 columns of plain numbers. A number is a link to its employees. | The badges made each row 3 lines high, with no space around them. |

## Smaller product choices

| Choice | Reason | Cost |
|---|---|---|
| No compensation cycle | A cycle needs a budget, a merit matrix, proposals and an atomic apply. It is a product in itself. | The HR Manager corrects salaries one at a time. |
| No bulk salary change | The developer asked for one, and stopped it before the write step. A change of many salaries with no undo needs a selection, a preview and an approval. That is the start of the compensation cycle. | The HR Manager opens each outlier from the Pay health list. The salary change dialog shows the band and takes an increase in percent, so one correction is quick. |
| No history of band changes | A band change writes a log line. A history needs a table and a reason for each change. The developer did not approve it for this iteration. | The HR Manager cannot prove why a band changed. The preview shows the effect, but the system does not keep it. |
| No change of the payroll cost in time | The system keeps the salary history, but an insight is for today only. | The HR Manager cannot compare this year with last year. |
| A large total has a short form, a salary does not | A total of 12 digits is hard to compare. The full amount shows on hover. | A short total is exact to 2 decimal places of a million only. |
| No Excel import | It has many validation cases and a low value in a demo. | The data comes from the seed script. A real adoption needs an import. |
| The highest salaries are a list of 10, and the employee list has no sort by salary | A country has one currency, so its order is exact. For the organization, the order uses the reporting currency. A page of 10 answers "who", and a sort of 10,000 rows in 7 currencies does not. | The HR Manager cannot see the employee at position 11. |
| One reporting currency does not compare the value of a salary | A converted salary is the cost of the employee to ACME. It is not the value of the pay to the employee, because prices differ in each country. The compa-ratio compares each salary with the band of its country, so it is the fair measure across countries. The list of the highest salaries shows the 3 figures. | The system has no purchasing power data. A list for the organization has employees of the countries with high pay first. |
| A bar of a chart has no keyboard path | The chart is hidden from a screen reader, and gives a table view with the same values. A focus stop on each bar adds many stops with little value. | A person who uses only a keyboard sets the same filters on the list. The Employees list has no control that sets a salary bracket: the bracket comes from the chart only. |
| The effective date cannot be in the future | A future date needs a scheduler and a second meaning of "current salary". | The HR Manager cannot plan a salary change. |
| The effective date cannot be before the last salary change | The newest row of the salary history must always give the current salary. | The HR Manager cannot record an old salary change that the HR team missed. |
| An employee without an exchange rate is not in the insights | The seed script gives a rate to each currency, so the case does not occur. | A new currency needs a rate before its employees count. |
| 10 rows on a page by default | The HR Manager reads a short list and opens one employee. The list offers 25, 50 and 100 rows. | A long list needs more pages. |

## Smaller engineering choices

| Choice | Reason | Cost |
|---|---|---|
| All currencies have 2 decimal places | The 7 currencies of ACME have 2. One rule keeps the money code simple. | A currency with 0 decimal places (for example JPY) needs a currency table with the number of places. |
| Insights count active employees only | An inactive employee must not be in the payroll cost. | The figures are for today only. |
| The theme is a copy of the Astryx neutral theme as source | The accent of the package theme is almost black, so a link did not stand out. `theme.ts` changes 4 tokens. The theme imports its icons from `lucide-react`, so that package is a dependency. | An upgrade of Astryx does not update the copy. |
| Validation rules only in the API | One definition of each pay rule. | The UI shows an error after a request, not while the HR Manager types. |
| The UI keeps an amount as a JavaScript number | A JavaScript number is exact for integers of this size. The UI converts an amount in one place, `lib/money.ts`, and calculates two ratios for display. | The rule "no floating-point number for money" applies to the API and SQL, not to the UI. |
| No end-to-end test framework | Unit, API and component tests cover the rules. A browser check covers the full path by hand. | A change that breaks only the full path needs a manual check. |
| The API does not call the pure functions `convert_minor` and `median_minor` | Aggregation is in SQL. The pure functions are the reference: a test compares the SQL result to them. | A change to the Python formula changes no behavior. Change the SQL formula in `services/sql.py` also. |
| The container image contains the seeded database | Each start gives the same 10,000 employees, so a demo and a review see the same figures. | A restart of the container removes each salary change. A production system needs a database outside the image. |
| No authentication | The brief gives one user role. | Do not put real salary data in this system before authentication exists. |

## Exceptions to the constitution

The constitution (`CLAUDE.md`) says: Astryx components for all UI elements, and no color value by hand. The code has 5 exceptions, and the constitution names them.

| Exception | Reason |
|---|---|
| One raw HTML element: `<form>` in `FormDialog` | Astryx has no form element. The element gives the Enter key and the submit event. |
| A required input shows a red star, with 2 CSS rules in `index.css` | The developer asked for a star. Astryx shows the text "Required" and has no option for a star. The rules use the error color token of the theme. An upgrade of Astryx can break them. |
| The 2 charts, which Recharts draws as SVG with the colors of the Astryx theme tokens | The Astryx chart package is an empty placeholder on npm, and the 2 charts need an axis. See decision 8. |
| The table view of a chart uses HTML table elements | A screen reader reads a table view with the same values as the chart. The Astryx table is a visible component with its own controls, and the table view is not visible. |
| A bar of a chart has no keyboard path (Article 4.6) | A focus stop on each bar adds many stops. The table view and the lists give the same data. See "Smaller product choices". |

## What production needs first

1. Authentication and roles.
2. A database outside the container image, and PostgreSQL when more than one person writes.
3. A version check on each salary change, so that two changes in the same instant cannot record the same old salary.
4. An import of employee data from the HR information system.
5. A history of exchange rates, so that an insight can be for a past date.
