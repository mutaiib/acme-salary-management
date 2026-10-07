# Tradeoffs

Each row is a choice, the reason, and the cost of the choice.

## Product

| Choice | Reason | Cost |
|---|---|---|
| Build pay insights, not employee administration | The brief asks for answers about how the organization pays people. A list of employees with a salary column is an Excel file in a browser. | The HR Manager cannot add an employee or change a department. |
| No compensation cycle | A cycle needs a budget, a merit matrix, proposals and an atomic apply. It is a product in itself. | The HR Manager corrects salaries one at a time. |
| No Excel import | It has many validation cases and a low value in a demo. | The data comes from the seed script. A real adoption needs an import. |
| The gender pay gap is unadjusted | An adjusted gap needs a statistical model and more data. | A gap can come from different job levels. The screen states this. |
| A gap in favor of women also gets a flag | It is also a difference that the HR Manager must explain. | The flag does not show the direction. The sign of the figure does. |
| No gap for a group with fewer than 5 men or 5 women | A figure for a small group can identify the pay of one person. | A small country shows no gap. |
| No sort by salary in the employee list | The list has 7 currencies, so the order has no meaning. | The HR Manager uses Pay health to find high and low salaries. |
| The effective date cannot be in the future | A future date needs a scheduler and a second meaning of "current salary". | The HR Manager cannot plan a salary change. |

## Engineering

| Choice | Reason | Cost |
|---|---|---|
| SQLite | The brief permits it. 10,000 rows are small. It needs no server. | One writer at a time. A production system for many HR users needs PostgreSQL. |
| All currencies have 2 decimal places | The 7 currencies of ACME have 2. One rule keeps the money code simple. | A currency with 0 decimal places (for example JPY) needs a currency table with the number of places. |
| Static exchange rates with a date | The figures are the same on each run, so tests can check exact values. | The rates become old. The screen shows the date of the rates. |
| Convert each salary, then add | A total always equals the sum of its parts on the screen. | The total can differ by a few cents from "add, then convert". |
| No cache | Each insight takes less than 110 ms. A cache needs invalidation on each salary change. | The response time grows with the data. See `performance.md`. |
| Insights count active employees only | A person who left must not be in the payroll cost. | The figures are for today only. There is no figure for a past date. |
| Astryx 0.6.5, a public beta | The design system has accessible components, and tools for AI agents. | The API can change. The version is pinned to an exact number. |
| No chart library | The Astryx chart packages are not stable. Tables with a share bar answer the questions. | There is no trend chart. |
| Validation rules only in the API | One definition of each pay rule. | The UI shows an error after a request, not while the user types. |
| No end-to-end test framework | Unit, API and component tests cover the rules. A browser check covers the full path by hand. | A change that breaks only the full path needs a manual check. |
| No authentication | The brief gives one user role. | Do not put real salary data in this system before authentication exists. |
