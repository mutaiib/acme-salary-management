# Requirements: ACME Salary Management

Status: written before the build. Terms: see `glossary.md`.

## Goal

The HR team of ACME keeps the salary data of 10,000 employees in Excel files. This work is slow, and the files cannot answer pay questions quickly.

The HR Manager gets one web application that does two things:
1. It manages salary data, with a record of each change.
2. It answers questions about how the organization pays people.

The application follows this sequence:
1. See the pay.
2. Find the problems.
3. Change a salary.
4. Prove the salary change.

## Scope and features

| ID | Requirement |
|---|---|
| FR-01 | The system must show the total payroll cost in one reporting currency. The system must show the date of the exchange rates. |
| FR-02 | The system must show the headcount, the payroll cost, and the minimum, median and maximum salary for each country, department and job level. |
| FR-03 | The system must let the HR Manager find an employee by name, email or employee code. The system must let the HR Manager filter the list by country, department, job level and status, and sort the list. |
| FR-04 | The system must let the HR Manager change a salary. Each salary change must have a reason and an effective date. |
| FR-05 | The system must refuse a salary that is zero or negative. The system must show the cause. |
| FR-06 | The system must keep each salary change. The system must show the salary history of an employee. |
| FR-07 | The system must let the HR Manager set a salary band for each job level in a country. A band has a minimum, a midpoint and a maximum. |
| FR-08 | The system must show the compa-ratio and the range penetration of each employee. |
| FR-09 | The system must show the employees who are below range and the employees who are above range. |
| FR-10 | The system must show the cost to move all below-range salaries to the band minimum. |
| FR-11 | The system must show the mean and the median gender pay gap for the organization and for each country. |
| FR-12 | The system must flag each country that has a mean gap or a median gap of more than 5%, in favor of men or of women. |
| FR-13 | The system must let the HR Manager deactivate an employee. The insights must count active employees only. |

| ID | Quality requirement |
|---|---|
| NFR-01 | A list page must respond in less than 300 ms with 10,000 employees. |
| NFR-02 | A pay insight must respond in less than 500 ms with 10,000 employees. |
| NFR-03 | The seed script must create exactly 10,000 employees in less than 30 seconds. Two runs must give the same data. |
| NFR-04 | The system must keep money as an integer in minor units. |
| NFR-05 | The unit tests must complete in less than 10 seconds, with no network, clock or shared database state. |
| NFR-06 | One command must install, seed and start the system. |
| NFR-07 | The system must not show a gender pay gap for a group that has fewer than 5 employees of each gender. |

## What is left out, and why

| Left out | Reason |
|---|---|
| Compensation cycle (budget, merit matrix, proposals) | It is a product in itself. It is the next iteration. |
| Excel or CSV import and export | It has many validation cases and a low value for a first version. |
| Pay compression and quartile analysis | They are extensions of pay health and pay equity. |
| Questions in plain language, with an AI model | The answers are not deterministic. The fixed insights answer the known questions. |
| Authentication and roles | The brief gives one user role. This is the first item for production. |
| Add an employee, or change the name, department or job level | This data belongs to the HR information system. |
| Bonus, benefits, payroll and tax | The system manages base salary only, so that each figure is exact. |
| Live exchange rates and market pay data | Static rates with a date, and bands that the HR Manager enters, are sufficient and testable. |

## Technical constraints

- Backend: Python with FastAPI, and SQLite.
- UI: React, with the Astryx component library.
- The pay calculations are pure functions with unit tests.
