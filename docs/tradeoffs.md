# Tradeoffs

Each row is a choice, the reason, and the cost of the choice.

## Product

| Choice | Reason | Cost |
|---|---|---|
| Build pay insights, not employee administration | The brief asks for answers about how the organization pays people. A list of employees with a salary column is an Excel file in a browser. | The HR Manager cannot add an employee or change a department. |
| No pay equity (the gender pay gap) | The developer removed it after the review of the screens. The value of an unadjusted gap for the HR Manager was not clear. The remaining insights answer the questions of the brief. | The system does not show a gap between the pay of men and the pay of women. The gender of an employee stays in the employee data. |
| No compensation cycle | A cycle needs a budget, a merit matrix, proposals and an atomic apply. It is a product in itself. | The HR Manager corrects salaries one at a time. |
| No bulk salary change | The developer asked for one, and stopped it before the write step. A change of many salaries with no undo needs a selection of employees, a preview and an approval. That is the start of the compensation cycle. | The HR Manager opens each outlier from the Pay health list. The salary change dialog shows the band and takes an increase in percent, so one correction is quick. |
| No change of the payroll cost in time | The system keeps the salary history, but an insight is for today only. The developer chose a fixed label for the period ("for one year"). | The HR Manager cannot compare this year with last year. |
| A large total has a short form, a salary does not | A total of 12 digits is hard to compare. The full amount shows on hover. | A short total is exact to 2 decimal places of a million only. |
| No Excel import | It has many validation cases and a low value in a demo. | The data comes from the seed script. A real adoption needs an import. |
| No sort by salary in the employee list | The list has 7 currencies, so the order has no meaning. | The HR Manager uses Pay health to find high and low salaries. |
| The effective date cannot be in the future | A future date needs a scheduler and a second meaning of "current salary". | The HR Manager cannot plan a salary change. |
| The effective date cannot be before the last salary change | The newest row of the salary history must always give the current salary. | The HR Manager cannot record an old salary change that the HR team missed. |
| An employee without an exchange rate is not in the insights | The seed script gives a rate to each currency, so the case does not occur. | A new currency needs a rate before its employees count. |

## Engineering

| Choice | Reason | Cost |
|---|---|---|
| SQLite | The brief permits it. 10,000 rows are small. It needs no server. | One writer at a time. A production system with many users needs PostgreSQL. |
| All currencies have 2 decimal places | The 7 currencies of ACME have 2. One rule keeps the money code simple. | A currency with 0 decimal places (for example JPY) needs a currency table with the number of places. |
| Static exchange rates with a date | The figures are the same on each run, so tests can check exact values. | The rates become old. The screen shows the date of the rates. |
| Convert each salary, then add | A total always equals the sum of its parts on the screen. | The total can differ by a few minor units from "add, then convert". |
| No cache | Each insight takes less than 60 ms. A cache needs invalidation on each salary change. | The response time grows with the data. See `performance.md`. |
| Insights count active employees only | An inactive employee must not be in the payroll cost. | The figures are for today only. There is no figure for a past date. |
| Astryx 0.6.5, a public beta | The design system has accessible components, and tools for AI agents. | The API can change. `package.json` gives an exact version for the Astryx runtime packages. |
| No chart library | The Astryx chart packages have canary versions only. A chart of the outliers by country was a proposal; it needs a new dependency, so it is not in this version. Tables with bars from the Astryx progress bar answer the questions. A band bar puts 3 progress bars end to end (`SegmentBar`). | There is no trend chart. A bar has no mark for the midpoint of a band. |
| The theme is a copy of the Astryx neutral theme as source | The Astryx CLI command `theme add` gives the copy. The accent of the package theme is almost black, so a link did not stand out. `theme.ts` changes 4 tokens. | An upgrade of Astryx does not update the copy. The theme imports its icons from `lucide-react`, so that package is a dependency. |
| A required input shows a red star | The developer asked for it. Astryx shows the text "Required" and has no option for a star. A text override gives the star, and 2 CSS rules in `index.css` give it the error color of the theme. | The 2 rules depend on the structure of an Astryx label. An upgrade of Astryx can break them. This is the one exception to "Astryx tokens only through components". |
| Validation rules only in the API | One definition of each pay rule. | The UI shows an error after a request, not while the HR Manager types. |
| The UI keeps an amount as a JavaScript number | A JavaScript number is exact for integers of this size. The UI converts an amount in one place, `lib/money.ts`. It also calculates two ratios for display: the share of cost and the position on the range bar. | The rule "no floating-point number for money" applies to the API and SQL, not to the UI. |
| An amount has a maximum of 10,000,000,000.00 units | A larger amount made the SQL arithmetic inexact. | The system refuses a salary above this limit. |
| No end-to-end test framework | Unit, API and component tests cover the rules. A browser check covers the full path by hand. | A change that breaks only the full path needs a manual check. |
| The pure functions `convert_minor` and `median_minor` are not called by the API | Aggregation is in SQL. The pure functions are the reference: a test compares the SQL result to them. | A change to the Python formula changes no behavior. Change the SQL formula in `services/sql.py` also. |
| No lock for two salary changes at the same time | There is one HR Manager, and SQLite permits one writer. | Two requests for the same employee in the same instant can record the same old salary. A system with many users needs a version check. |
| One raw HTML element: `<form>` in `FormDialog` | Astryx has no form element. The element gives the Enter key and the submit event. | This is the one exception to "Astryx components for all UI elements". |
| No authentication | The brief gives one user role. | Do not put real salary data in this system before authentication exists. |
