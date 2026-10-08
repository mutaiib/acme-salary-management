# Spec: the assessment brief as acceptance criteria

## Overview

This spec turns the assessment brief into criteria that a person can check in the running system. Source: `docs/brief/`. The check used the development UI at http://localhost:5173 (`make dev-ui`).

The Bee browser verifier checked the criteria in a browser on 8 October 2026. A tick is a criterion that passed. 1 criterion is not met, and it states the cause. A second criterion was not met at the first check. The second iteration met it. After that check, the last screens that did not state the period of an amount got the text "for one year".

The brief has two demands. The HR Manager must manage the salary data in web-based software. The HR Manager must be able to answer questions about how the organization pays people.

## Slice 1: The organization

- [x] The system holds 10,000 employees.
- [x] The employees are in more than one country.
- [x] The system runs in a web browser, with no Excel file.

## Slice 2: Manage the salary data

- [x] The HR Manager can find one employee by name.
- [x] The HR Manager can see the salary of that employee.
- [x] The HR Manager can change the salary of that employee.
- [x] After the change, the system shows the old salary, the new salary, the reason and the date.
- [x] The system refuses a salary change that has no reason.

## Slice 3: Answer questions about how the organization pays people

Each criterion is one question. It passes when the HR Manager can read the answer on a screen, without a calculation by hand.

- [x] "What does the organization pay in total for one year?"
- [x] "How many employees does the organization pay?"
- [x] "What does the organization pay in each country?"
- [x] "What is the median salary in each department?"
- [x] "What is the lowest salary and the highest salary at each job level?"
- [x] "Which employees get less than the salary band for their job?"
- [x] "What does it cost to correct those salaries?"
- [x] "Is the salary of this one employee correct for the job?"
- [x] "What does the organization pay the Engineering department in Germany?"
- [x] "What is the median salary at job level 3 in India, and in the United Kingdom?"
- [ ] "How did the payroll cost change from last year to this year?" Not met. An insight is for today only. See `docs/tradeoffs.md`.
- [x] "Who are the employees with the highest salary in one country?" Met on 8 October 2026: the Pay analysis screen, tab "Highest salaries", with a country filter (FR-19). The first check found this criterion not met.

## Slice 4: Each screen explains its figures

- [x] Each amount of money states its period (for one year) or the screen states it.
- [x] Each figure with a special name (median, compa-ratio, range penetration) has an explanation on the screen.

## Out of Scope

- The one-page requirements document. A person checks it in the repository, not in the browser.
- The tests, the commits and the deployment.

## Technical Context

- Risk level: MODERATE
- Base address: http://localhost:5173

[X] Reviewed
