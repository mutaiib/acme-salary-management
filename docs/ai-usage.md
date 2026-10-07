# AI usage

This document tells how the developer used AI in this work. It gives the requests of the developer, the proposals of the agent, and the decisions of the developer. It also lists the errors in the AI output that the work found, and who found each one.

The developer made the requests in this document shorter and corrected their grammar. The meaning is the same.

## Summary

The developer used the agent as a collaborator, and kept the judgment.

1. **The developer made the product decisions.** The agent did the research, wrote the code and the documents, and ran the checks.
2. **Rules came before code.** A first constitution (`CLAUDE.md`) and a glossary gave the agent the engineering rules and the terms before the first specification. The reviews made the constitution complete.
3. **The developer and the agent discussed the product in 6 steps before the first line of code.** One step changed the product. One step removed half of the slices.
4. **The developer did not accept a claim of the agent without a check.** The checks were tests, a browser with the seeded data, and 3 reviews by independent review agents.
5. **The build and the 3 reviews found 47 errors in the AI output.** 9 showed during the build, and 38 showed in the reviews. Each one is in this document, with its correction. Part 4 lists the further findings of the developer.
6. **The developer reviewed each screen in a browser, and read the documents, before the commits.**

## Tools

| Tool | Use |
|---|---|
| Claude Code | Research, plans, code, tests and documents, in a terminal |
| Bee, the Claude Code plugin of Incubyte | The workflow: discovery, specification, plan, slices with the tests first, review |
| Astryx CLI | The reference for a UI component. After the first error, the agent read it before each new component |
| A browser that the agent controls | A check of the screens against the seeded data |

## Part 1: The decisions before the code

Each step has the request of the developer, the proposal of the agent, and the decision of the developer.

### Step 1: The business value

**Request of the developer.** Start from the business, not from the features. What is the value of this system for ACME? What does the HR Manager need to do and to know? Give the functional and the quality requirements, the screens, and the items for a later iteration.

**Proposal of the agent.** An employee directory with search and filters, a form to edit an employee, and three pay figures for each country.

**Decision of the developer.** The developer continued with this at first, and rejected it as the product in step 4.

### Step 2: The method

**Request of the developer.** Incubyte publishes its development workflow as the Bee plugin. Study how Bee works, and use that workflow for this work: discovery, specification, plan, then slices with the tests first.

**Proposal of the agent.** The Bee workflow, with the document formats of Bee.

**Decision of the developer.** Accepted. The developer added two rules. The documents use ASD-STE100 Simplified Technical English. A constitution (`CLAUDE.md`) governs all work in the repository.

### Step 3: More value for the HR Manager

**Request of the developer.** Separate the items that the brief requires from the items that add value. Which functions make the work of the HR Manager faster? Do not defer a function that has a clear value.

**Proposal of the agent.** 10 slices. They included an Excel import, a bulk salary change, salary bands, and questions in plain language with an AI model.

**Decision of the developer.** Not accepted. The list was longer, but the product was the same. See step 4.

### Step 4: Salary management, not employee administration

**Request of the developer.** This plan is employee administration with a salary column. That is the work of an HR information system, and it is not the problem of the brief. Research how compensation teams work and what compensation software does. A small product must still give the HR Manager a decision, not only a list.

**Proposal of the agent.** After the research, a product about pay decisions: salary bands, the compa-ratio, pay health (salaries outside the band), pay equity (the gender pay gap), a compensation cycle with a budget, and an Excel import.

**Decision of the developer.** Accepted as the direction. This is the largest correction in the work. The functions of an HR information system left the plan: add an employee, and edit a name, a department or a job level.

### Step 5: Less scope

**Request of the developer.** Examine each feature for its value and its risk. Pay health has a clear business value. Compression analysis can use much time. For pay equity, the main figure is sufficient. The compensation cycle is a product in itself. The Excel import has many validation cases and a low value in a demo. Remove what does not earn its place.

The developer also brought a written critique of the plan, and asked the agent to answer each point.

**Decision of the developer, with the reason for each.**

| Removed | Reason of the developer |
|---|---|
| Compensation cycle (budget, merit matrix, proposals, atomic apply) | It is a product in itself. An incomplete cycle is worse than no cycle. |
| Excel import and export | Many validation cases, and a low value in a demo. |
| Questions in plain language with an AI model | The answers are not deterministic. The fixed insights answer the known questions. |
| Pay compression | An extension of pay health. It can use much time. |
| Pay quartiles and the gap by job category | The main figure answers the question. |
| Add an employee | It is employee administration. Deactivate stays, because it changes the payroll cost. |

The result is a walking skeleton and 5 slices. Pay equity left later, so the skeleton and 4 slices remain. `docs/requirements.md` has the same list, for the reader of the product.

### Step 6: The order of the build

**Request of the developer.** Review the plan for completeness. Build the backend of a capability before its screen.

**Proposal of the agent.** All backend steps first, then all UI steps.

**Decision of the developer.** Vertical slices, with the backend step first in each slice. A UI problem then shows in each slice, and not at the end. The developer froze the scope for the first build.

### The working agreement with the agent

The developer gave the agent these rules. The constitution (`CLAUDE.md`) has the engineering rules in full.

| Rule | Effect |
|---|---|
| **A review gate before each commit.** The agent does not make a commit. It records a snapshot at each green step. The developer reviews the work, and then the agent makes the commits. | The developer reviewed the work before it went into the history. |
| **One commit for each step of a slice.** The message states the change and its reason. | The history shows each slice: the API step, then the UI step. |
| **Stop at a conflict.** If a task conflicts with an article of the constitution, the agent stops and tells the developer. | The first paragraph of the constitution states this rule, for people and for agents. |
| **No feature without a requirement.** Each feature has a line in `docs/requirements.md`, and each test file names its requirement IDs. | `docs/traceability.md` connects each requirement to its tests. |
| **One shared component library.** A screen must not copy an element that 2 screens use. | `frontend/src/components/`. |
| **Simple, and each choice has a defense.** No abstraction before a second implementation exists. | `docs/tradeoffs.md` gives the reason and the cost of each choice. |

## Part 2: The build

1. **Rules first.** `CLAUDE.md` and `docs/glossary.md` came before the specification.
2. **Slices.** The plan for each slice had 5 steps: backend tests, backend code, UI tests, UI code, a check in the browser.
3. **Real data.** The seed script plants known outliers. A test compares the Pay health insight to them.

### How the work used Bee

The work used the workflow of Bee for the first build, for the design brief and for the reviews.

| Stage of Bee | Result in this repository |
|---|---|
| Discovery | `docs/specs/salary-management-discovery.md`: the why, the user, the hypotheses and the scope |
| Specification | `docs/specs/salary-management-spec.md`: one criterion for each behavior, in a walking skeleton and 5 slices. `docs/specs/screen-clarity-spec.md` for the review of the screens |
| Plan | `docs/plans/salary-management-plan.md`: the structure, the names and the decisions for each slice, and the differences between the plan and the build |
| Build | Vertical slices. The tests came first for most steps (see "Limits to state"). The Bee `slice-builder` agent removed pay equity and built the preview of the bulk salary change |
| Design | The Bee `design-agent` wrote the design brief, `.claude/DESIGN.md` |
| Verification in a browser | The Bee `browser-verifier` checked the brief as criteria in a browser: `docs/specs/brief-acceptance-spec.md` |
| Review | 3 reviews. The first used the Bee agents `reviewer`, `review-tests` and `review-org-standards`. The second and the third used `/bee:review`, which starts 7 review agents in parallel |

## Part 3: Where the AI output was wrong

### During the build (9)

| Problem | Who found it | Correction |
|---|---|---|
| The first plan was an employee directory with a salary column. | The developer | Research on compensation tools. The plan changed to salary bands, pay health and pay equity. |
| The plan had 10 slices, with a compensation cycle, an Excel import and an AI question feature. | The developer | 5 slices. The other features are in the list of what the product leaves out, with a reason. |
| The agent left pay equity out, because it needs gender data. | The agent, after the research | The feature came back, with a rule for small groups. The developer removed it later (Part 4). |
| The agent planned "all backend, then all UI". | The developer | Vertical slices. |
| The specification had "sort by salary". | The agent, during the plan | The list has 7 currencies, so the order has no meaning. The agent removed the sort. |
| The agent used a `label` property on the Astryx `SideNav`. The property does not exist. | The TypeScript compiler | `aria-label`. After this, the agent read the component reference before each new component. |
| The UI tests failed in jsdom: no `matchMedia`, and no `showModal` on a dialog. | The tests | Small stubs in the test setup file. |
| Four UI tests found the same text 2 times. | The tests | The tests query by role, or in one section of the screen. |
| The share of cost was on 2 lines in the Pay overview table. | The agent, in a browser screenshot | One property on the text. |

### Found by the first review, 3 agents (14)

The reviewers ran the tests, called the API, and changed lines of code in a copy to see if a test failed.

| Problem | Correction |
|---|---|
| All API tests used one database session. A service without `commit()` passed all tests. | Each request in a test has its own session, as in production. |
| The API accepted a salary of 9,000,000,000,000,000,000. The payroll cost then became inexact. | An amount has a maximum. Tests check the limit. |
| The API accepted a salary change with an effective date of 1900. The top row of the salary history then disagreed with the current salary. | The effective date must not be before the hire date or before the last salary change. |
| The UI used the date of the browser for "today". The API used the date of the server. | The UI reads the date from the API. |
| The seed script used floating-point arithmetic for a salary. | Integer arithmetic. |
| No test proved "exactly 10,000 employees". The traceability document said that one did. | A test checks it. |
| Pay equity (removed later): no test had a country with only the median gap above 5%. A wrong flag rule passed all tests. | Tests for each of the two gaps, for the two signs, and for exactly 5.0%. |
| No test separated "same job level, other country" from "same country, other job level". | Tests for each of the two cases. |
| The list order test put the rows in the correct order, so it could not fail. | The test puts the rows in a different order. |
| 3 screens had a copy of the same money column, country filter and page controls. | Shared components and one shared hook. |
| Pay equity (removed later): a negative gap showed only a minus sign. | The row also said "Women higher". |
| The Pay equity screen (removed later) and the salary history had no empty state. | Empty states, with tests. |
| The specification showed old field names for the API. | The documents agree with the code. |
| The requirements used "can". The constitution requires "must". | "The system must let the HR Manager ...". |

### Found by the second review, `/bee:review` with 7 agents (15)

The agents read the code. They did not run it.

| Problem | Correction |
|---|---|
| The search box kept its text after the list lost the search. | The box follows the address. A test checks the case. |
| A failure of `GET /api/meta` was silent: the filters were empty, with no message. | Each screen shows a banner with a "Load again" button. |
| The test for the order of the job levels could not fail. | The test data has the highest cost on the highest job level. |
| "Try again" gave no feedback, because the error stayed on the screen. | A new attempt removes the old error. |
| A dialog lost an error for an input that it did not have. | Each such error shows at the top of the dialog. |
| An employee who had a currency without an exchange rate was in the pay health list but not in its summary. | One rule for all insights, in one query. |
| The rules of a salary change were in the service. Only a test with a database could check them. | A pure function with unit tests. |
| The API contract used plain text for closed sets of values. | The schemas and the TypeScript types use the allowed values. |
| The employees service owned the pagination, and pay health imported it. | `services/pagination.py`. |
| The services imported the web framework through `errors.py`. | The error handlers moved to `routers/error_handlers.py`. |
| The UI built "Level N" in 7 places and converted an amount in 3 places. | One function for each. |
| A figure had no programmatic link to its label. | The label names the group of the figure, for a screen reader. |
| `CLAUDE.md` had no commands, and its structure map was old. | Article 2 has the map and the patterns. Article 5 has the commands. |
| Seven behaviors had code and tests but no line in the requirements or the spec. | The requirements and the spec name them. |
| The time of a salary change was the local time of the server. | UTC. |

### Found by the third review, `/bee:review` with 7 agents, before the submission (9)

The developer asked one question for this review: does each test check a behavior, or can a test pass when the behavior is wrong? The review found 3 tests that could pass when the behavior was wrong, and these other problems.

| Problem | Correction |
|---|---|
| The notice of the outliers on the Pay overview had no test. The screen tests did not give it data, so it showed nothing, and no test could fail. | 2 tests: the notice with its figures and its link, and no notice when all salaries are in the band. |
| The test of the page size checked only that the API repeated the number. It passed if the API ignored the page size. | A test with 12 employees and a page size of 5 checks the number of rows. |
| The test "does not serve a file outside the UI directory" passed for each possible response. | The test states the expected response. |
| No UI test sent an effective date that the HR Manager typed. No UI test cancelled a deactivation. | A test for each. |
| One test file did not name its requirement IDs. | The file names them. |
| The design brief told an agent not to import the icon package and named the old theme. The 2 instructions were out of date. | The brief is now short and tells the screens as built. The 2 instructions are not in it. |
| The specification listed the API shape of pay equity, which left the product. The shape of an outlier did not have the range status. | The specification agrees with the code. |
| The structure map of the constitution did not have `db.py`, the files of `calculations/` or the 2 environment variables. The constitution did not name its 2 exceptions. | The constitution has them. |
| 2 requirements had a sentence of more than 25 words. The glossary did not have "median salary". | Shorter sentences, and a glossary entry. |

One proposal of a review agent was wrong. It said to remove an option of the fake clock in 2 tests of the search delay. The agent applied it, 3 tests failed, and the agent put the option back. A proposal of a review agent is a hypothesis, and a test decides.

### Known limits

The reviews also named these limits. They are choices, and `docs/tradeoffs.md` gives the reason and the cost of each one.

- **The shapes of the API exist twice.** `backend/app/schemas.py` and `frontend/src/api/types.ts` have the same shapes. A generator from the OpenAPI document removes the second copy.
- **The rule "outside the band" exists in Python, in SQL and in the UI.** A test compares the SQL result to the Python function.
- **No lock for two salary changes at the same time.** SQLite permits one writer.
- **No automated end-to-end test.** Unit, API and component tests cover the rules. A check in a browser covers the full path.

## Part 4: The review of the developer

The developer reviewed each screen and each document before the commits. Each row is a finding of the developer and the change that it caused.

| Where | Finding of the developer | Change |
|---|---|---|
| Pay health | The 2 figures do not filter the list, and the list has no search. | The list has a search, and a switch for all, below range and above range. |
| Pay overview | A figure does not state if it is for one year or a total. | Each amount states its period: "for one year". |
| The main requirement | Does the system answer questions about how the organization pays people? The agent answered: only fixed questions, not a combined question. | The Employees screen shows the pay figures of each combination of filters, for example Engineering in Germany. |
| All screens | The agent added too much to one screen in a short time, and the screens lost their focus. | The developer stopped the work and kept one change. A filter on the Pay overview, a trend and a new first screen went out. |
| All screens | The screens need one visual language. | The Bee design agent wrote a design brief (`.claude/DESIGN.md`). The agent applied it to one screen first, and the developer reviewed that screen. |
| All screens | The developer gave 5 pictures as a reference for the layout, with the rule: no new metric, and Astryx components only. | The agent built the layouts with Astryx components. It left out each figure and each action of the pictures that the system does not have. |
| Pay equity | The figures do not tell the HR Manager what to do. Does this screen add value? | The developer removed pay equity from the scope. A Bee builder removed the screen, the API, the calculation, the tests and the planted gaps of the seed data. `docs/tradeoffs.md` gives the reason. |
| All screens | A total of 12 digits is hard to compare. | A large total has a short form, with the full amount on hover. A salary keeps all its digits. |
| All screens | The space between the filters and the tables is not regular. | The agent measured the space in the browser. A table in a card had moved into the padding of the card. |
| Salary change dialog | The HR Manager must see the band during the change, and must be able to give an increase in percent. | The dialog shows the band, the amount to the band maximum, and an input for the increase in percent. |
| All screens | An explanation of a term must not use the space of the screen. A screen must not show an internal code. | An explanation opens from an info button. A screen shows the name of a country, not its code. |
| Employees | A list of inactive employees only shows the same badge in each row. A load must be visible, and must not move the screen. | No badge in that list. A line at the top of the application shows a load. |
| Theme | The developer gave the Astryx command that adds the theme as source. | The theme is source in the repository, with a blue accent. |
| Bulk salary change | The developer asked for a bulk change by criteria, then for a selection of employees, and then stopped the build. | Bee wrote a spec and a plan, and built the preview. The developer removed the feature before the write step: a change of many salaries needs a preview, an approval and an undo. `docs/tradeoffs.md` records it. |

### The last review, before the submission

| Where | Finding of the developer | Change |
|---|---|---|
| Employees | Do the sentences below the figures add value? | No. 6 sentences became 1. The explanation of the median moved to its info button. |
| Pay health | The bar in the column "Outside by" has no meaning. The range status can be in the same column. | The outliers of the seed data are all near 15% of the band limit, so each bar had almost the same length. The column now shows the amount with a minus and red for below range, and a plus and green for above range. |
| Salary bands | The band bars look broken. | A bar of 3 progress bars did not read as one bar. The screen is a table for each country. |
| Employee record | The badge "In range" repeats the range bar. | A badge shows only for a salary outside the band. |
| Pay overview | The button in the notice has a wrong color. The exchange rates need a place. | The button is a link. The date of the rates links to a screen with the exchange rates, built with the tests first. |
| Navigation | The items need icons, and the collapse button must be at the top. | Each item has an icon. The collapse button is at the top of the navigation. |
| Employee record | The link back always went to the Employees list, also from Pay health. | The record goes back to the list that the HR Manager came from. A test checks the 2 cases. |
| Lists | 10 rows on a page by default. | The default is 10 rows. The list offers 10, 25, 50 and 100 rows. |
| Tradeoffs | Find the tradeoffs that matter. | `docs/tradeoffs.md` starts with the 8 decisions that shaped the product. Each one has its reason, its cost, and the condition that changes it. |

## Limits to state

- **Simplified Technical English.** The documents follow the STE writing rules: short sentences, active voice, one word for one meaning. No tool checked the words against the official ASD-STE100 dictionary. The reviews found violations, and the agent corrected the most important ones. Some remain.
- **Test first.** For most steps the agent ran the new tests and saw them fail before it wrote the code. There are exceptions. For 2 UI steps of the first build, the agent wrote the tests and the code together: the Pay overview screen and the form dialog. For most of the screen clarity work, the developer reviewed each change in a browser. The agent changed the tests and the code in the same step. The changes of the last review that have a behavior had a test that failed first. The changes that are only visual (icons, a color, the favicon) have no test.
- **Commits.** The agent recorded a snapshot of the work at each green step. After the review of the developer, the agent made the commits from the snapshots, in the order of the work. The agent set the time of each commit of the first build to the time of its snapshot.
