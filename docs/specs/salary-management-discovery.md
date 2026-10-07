# Discovery: ACME Salary Management

This document is the record of the discovery, before the build. After the review of the screens, the developer removed pay equity from the scope. See `docs/requirements.md`.

Source: the assessment brief (`docs/brief/`), a review of compensation tools, and the scope decisions of the developer.

## Why

The HR team of ACME manages the salary data of 10,000 employees in Excel files. The brief calls this work "tedious". An Excel file does not record when a salary changed, or why. It cannot answer a pay question without manual work.

## Who

The HR Manager of ACME. There is one user role.

## Success Criteria

- The HR Manager knows the payroll cost of the organization, and where the organization spends it.
- The HR Manager finds the employees who have a salary outside the salary band for their job.
- The HR Manager sees if the organization pays men and women differently.
- The HR Manager corrects a salary in one dialog.
- The HR Manager can show the reason and the date of each salary change.

## Problem Statement

A salary in an Excel file has no reference point and no history. The HR Manager cannot tell if a salary is correct for the job, and cannot prove how the salary changed. The HR Manager needs one application that shows the pay, finds the problems, records each correction, and keeps the proof.

## Hypotheses

- H1: A salary is only useful with a reference point. The salary band is that reference point. This puts salary bands IN scope.
- H2: The HR Manager acts on a short list of outliers, not on 10,000 rows. This puts the pay health list IN scope.
- H3: One headline figure for the gender pay gap is sufficient for a first version. This puts analysis by job category OUT of scope.
- H4: The HR Manager corrects salaries one at a time in a first version. This puts the compensation cycle OUT of scope.
- H5: The data of the first version comes from a seed script. This puts Excel import OUT of scope.

## Out of Scope

- Compensation cycle (budget, merit matrix, proposals).
- Excel or CSV import and export.
- Pay compression and quartile analysis.
- Questions in plain language, with an AI model.
- Authentication and roles.
- Add an employee, or change the name, department or job level.
- Bonus, benefits, payroll and tax.
- Live exchange rates and market pay data.

The reason for each item is in `docs/requirements.md`.

## Milestone Map

### Phase 1: Walking skeleton
- The deployed application shows the employee list from 10,000 seeded employees.

### Phase 2: Manage (act and prove)
- Employee pay record: find an employee, change a salary, see the salary history, deactivate an employee.

### Phase 3: See
- Pay overview: payroll cost, headcount, and salary figures by country, department and job level.

### Phase 4: Diagnose
- Salary bands, with the compa-ratio and the range penetration of each employee.
- Pay health: below-range and above-range employees, and the correction cost.
- Pay equity: the gender pay gap for the organization and for each country.

## Module Structure

The plan replaced these module names with `routers/` and `services/`. The ownership is the same.

- `calculations/` owns: compa-ratio, range penetration, range status, gender pay gap, currency conversion. Depends on: (none)
- `employees/` owns: Employee, Salary change. Depends on: (none)
- `bands/` owns: Salary band, position in range. Depends on: `calculations/`
- `insights/` owns: Pay overview, Pay health, Pay equity. Depends on: `calculations/`, `employees/`, `bands/`

## Open Questions

- Which host gets the deployment? The developer selects the host and supplies the account.
- Is the reporting currency USD for ACME? The first version uses USD.

## Revised Assessment

Size: EPIC
Risk: MODERATE (the application shows business figures to a user; it has no payment, no authentication and no data migration)
Greenfield: yes

[X] Reviewed
