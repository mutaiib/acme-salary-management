# Spec: ACME Salary Management

## Overview

The HR Manager of ACME manages the salaries of 10,000 employees and answers questions about how the organization pays people. The application follows one sequence: see the pay, find the problems, correct a salary, prove the change.

Terms: `docs/glossary.md`. Requirements: `docs/requirements.md`. Each criterion below is one behavior that a test can check.

## Slice 0: Walking skeleton

- [ ] The Employees screen shows the first 25 employees, ordered by employee code.
- [ ] Each row shows the employee code, name, job title, job level, department, country and salary with its currency.
- [ ] The screen shows the total number of employees.
- [ ] The HR Manager can go to the next page and to the previous page.
- [ ] The seed script creates exactly 10,000 employees.
- [ ] Two runs of the seed script create the same data.
- [ ] The seed script creates one salary band for each job level in each country.
- [ ] The seed script creates one exchange rate for each currency.
- [ ] The seed script writes the first salary of each employee as the first row of the salary history.
- [ ] Shows an error message when the API does not respond.

## Slice 1: Employee pay record (FR-03, FR-04, FR-05, FR-06, FR-13)

- [ ] The HR Manager can find an employee by a part of the name, the email or the employee code.
- [ ] The HR Manager can filter the list by country, department, job level and status.
- [ ] The HR Manager can sort the list by employee code, name or hire date.
- [ ] Shows an empty state when no employee matches.
- [ ] The Employee detail screen shows the data of the employee and the current salary.
- [ ] The HR Manager can change the salary with a new salary, a reason and an effective date.
- [ ] After a salary change, the Employee detail screen shows the new salary.
- [ ] After a salary change, the salary history shows the old salary, the new salary, the reason and the effective date.
- [ ] The salary history shows the newest salary change first.
- [ ] Shows an error when the new salary is zero or negative.
- [ ] Shows an error when the reason is empty.
- [ ] Shows an error when the effective date is in the future.
- [ ] Shows an error when the new salary is equal to the current salary.
- [ ] The HR Manager can deactivate an active employee.
- [ ] Shows an error when the HR Manager changes the salary of an inactive employee.
- [ ] Shows a "not found" state for an employee that does not exist.

## Slice 2: Pay overview (FR-01, FR-02, FR-13)

- [ ] The Overview screen shows the total payroll cost in USD.
- [ ] The Overview screen shows the headcount.
- [ ] The Overview screen shows the date of the exchange rates.
- [ ] The Overview screen shows, for each country, the headcount, the payroll cost in USD, and the minimum, median and maximum salary in the local currency.
- [ ] The Overview screen shows, for each department and for each job level, the headcount, the payroll cost, and the minimum, median and maximum salary, in USD.
- [ ] An inactive employee does not count in the headcount or in the payroll cost.
- [ ] The median of an even number of salaries is the mean of the two middle salaries.

## Slice 3: Salary bands (FR-07, FR-08)

- [ ] The Bands screen shows the minimum, midpoint and maximum for each job level in each country.
- [ ] The HR Manager can filter the bands by country.
- [ ] The HR Manager can change the minimum, midpoint and maximum of a band.
- [ ] Shows an error when the minimum is not less than the midpoint.
- [ ] Shows an error when the midpoint is not less than the maximum.
- [ ] The Employee detail screen shows the salary band of the employee.
- [ ] The Employee detail screen shows the compa-ratio with 2 decimal places.
- [ ] The Employee detail screen shows the range penetration with 1 decimal place.
- [ ] The Employee detail screen shows the range status: below range, in range or above range.
- [ ] The Employee detail screen shows the position of the salary on a range bar.
- [ ] A salary of 45,000 in a band of 35,000 / 50,000 / 65,000 shows a compa-ratio of 0.90 and a range penetration of 33.3%.
- [ ] A salary equal to the band minimum or the band maximum is in range.

## Slice 4: Pay health (FR-09, FR-10)

- [ ] The Pay health screen shows the number of below-range employees and the number of above-range employees.
- [ ] The Pay health screen shows the correction cost in USD.
- [ ] The Pay health screen lists the below-range employees with the salary, the band minimum and the difference.
- [ ] The Pay health screen lists the above-range employees with the salary, the band maximum and the difference.
- [ ] The HR Manager can filter the lists by country and by job level.
- [ ] Each row opens the Employee detail screen.
- [ ] After the HR Manager moves a below-range salary to the band minimum, the number of below-range employees decreases by 1.
- [ ] An inactive employee does not show in the lists.
- [ ] Shows an empty state when no employee is outside the salary band.

## Slice 5: Pay equity (FR-11, FR-12, NFR-07)

- [ ] The Pay equity screen shows the mean gap and the median gap for the organization, in USD.
- [ ] The Pay equity screen shows the mean gap and the median gap for each country, in the local currency.
- [ ] Each group shows the number of men and the number of women.
- [ ] A group with a mean gap or a median gap of more than 5% has a flag.
- [ ] A group with fewer than 5 men or fewer than 5 women shows "not enough data" and no gap.
- [ ] The screen shows the label "unadjusted" and a description of its meaning.
- [ ] A negative gap shows that women have the higher pay.
- [ ] An inactive employee does not count in a gap.

## API Shape

```
GET  /api/employees?search=&country=&department=&job_level=&status=&sort=&page=&page_size=
     -> 200 { items: [Employee], page, page_size, total }
GET  /api/employees/{id}
     -> 200 Employee + { band, compa_ratio, range_penetration, range_status }
POST /api/employees/{id}/salary-changes   { new_salary_minor, reason, effective_date }
     -> 201 SalaryChange | 404 | 422 { detail: [{ field, cause }] }
GET  /api/employees/{id}/salary-changes
     -> 200 [SalaryChange]
POST /api/employees/{id}/deactivate
     -> 200 Employee | 404
GET  /api/meta
     -> 200 { countries, departments, job_levels, reporting_currency, rates_as_of }
GET  /api/insights/overview?group_by=country|department|job_level
     -> 200 { payroll_cost_minor, headcount, rates_as_of, groups: [...] }
GET  /api/bands?country=
     -> 200 [Band]
PUT  /api/bands/{id}                      { min_minor, mid_minor, max_minor }
     -> 200 Band | 404 | 422
GET  /api/insights/pay-health
     -> 200 { below_count, above_count, correction_cost_minor }
GET  /api/insights/pay-health/employees?status=below|above&country=&job_level=&page=
     -> 200 { items, page, page_size, total }
GET  /api/insights/pay-equity
     -> 200 { organization: Gap, countries: [Gap] }

Employee:     { id, employee_code, full_name, email, job_title, job_level, department,
                country, currency, salary_minor, gender, hire_date, status }
SalaryChange: { id, old_salary_minor, new_salary_minor, currency, reason, effective_date, created_at }
Band:         { id, job_level, country, currency, min_minor, mid_minor, max_minor }
Gap:          { group, currency, men, women, mean_gap_pct, median_gap_pct, flagged, enough_data }
```

## Out of Scope

- Compensation cycle, Excel import and export, pay compression, quartile analysis.
- Questions in plain language, with an AI model.
- Authentication and roles.
- Add an employee, or change the name, department or job level.
- Bonus, benefits, payroll and tax.
- Live exchange rates and market pay data.
- Sort by salary. The list has many currencies, so the order has no meaning.
- Create or delete a salary band. The seed script creates all bands.
- A salary change with a future effective date.

## Technical Context

- Patterns to follow: `CLAUDE.md` (the constitution).
- Key dependencies: FastAPI, SQLAlchemy, SQLite; React 19, Vite, Astryx.
- Risk level: MODERATE

[ ] Reviewed
