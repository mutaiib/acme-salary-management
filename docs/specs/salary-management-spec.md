# Spec: ACME Salary Management

## Overview

The HR Manager of ACME manages the salaries of 10,000 employees and answers questions about how the organization pays people. The application follows this sequence:
1. See the pay.
2. Find the problems.
3. Change a salary.
4. Prove the salary change.

Terms: `docs/glossary.md`. Requirements: `docs/requirements.md`. Each criterion below is one behavior that a test can check.

## Slice 0: Walking skeleton

- [x] The Employees screen shows the first 25 employees, ordered by employee code.
- [x] Each row shows the employee code, name, job title, job level, department, country and salary with its currency.
- [x] The screen shows the total number of employees.
- [x] The HR Manager can go to the next page and to the previous page.
- [x] The seed script creates exactly 10,000 employees.
- [x] Two runs of the seed script create the same data.
- [x] The seed script creates one salary band for each job level in each country.
- [x] The seed script creates one exchange rate for each currency.
- [x] The seed script writes the first salary of each employee as the first row of the salary history.
- [x] The system shows an error message when the API does not respond.

## Slice 1: Employee pay record (FR-03, FR-04, FR-05, FR-06, FR-13)

- [x] The HR Manager can find an employee by a part of the name, the email or the employee code.
- [x] The HR Manager can filter the list by country, department, job level and status.
- [x] The HR Manager can sort the list by employee code, name or hire date.
- [x] The system shows an empty state when no employee matches.
- [x] The Employee detail screen shows the data of the employee and the current salary.
- [x] The HR Manager can change the salary with a new salary, a reason and an effective date.
- [x] After a salary change, the Employee detail screen shows the new salary.
- [x] After a salary change, the salary history shows the old salary, the new salary, the reason and the effective date.
- [x] The salary history shows the newest salary change first.
- [x] The system shows an error when the new salary is zero or negative.
- [x] The system shows an error when the reason is empty.
- [x] The system shows an error when the effective date is in the future.
- [x] The system shows an error when the new salary is equal to the current salary.
- [x] The system shows an error when the effective date is before the hire date.
- [x] The system shows an error when the effective date is before the last salary change.
- [x] The newest row of the salary history always gives the current salary.
- [x] The HR Manager can deactivate an active employee.
- [x] The system shows an error when the HR Manager changes the salary of an inactive employee.
- [x] The system shows a "not found" state for an employee that does not exist.

## Slice 2: Pay overview (FR-01, FR-02, FR-13)

- [x] The Pay overview screen shows the total payroll cost in USD.
- [x] The Pay overview screen shows the headcount.
- [x] The Pay overview screen shows the date of the exchange rates.
- [x] The Pay overview screen shows, for each country, the headcount, the payroll cost in USD, and the minimum, median and maximum salary in the local currency.
- [x] The Pay overview screen shows the headcount and the payroll cost of each department and each job level, in USD.
- [x] The Pay overview screen shows the minimum, median and maximum salary of each department and each job level, in USD.
- [x] An inactive employee does not count in the headcount or in the payroll cost.
- [x] The median of an even number of salaries is the mean of the two middle salaries.

## Slice 3: Salary bands (FR-07, FR-08)

- [x] The Salary bands screen shows the minimum, midpoint and maximum for each job level in each country.
- [x] The HR Manager can filter the bands by country.
- [x] The HR Manager can change the minimum, midpoint and maximum of a band.
- [x] The system shows an error when the minimum is not less than the midpoint.
- [x] The system shows an error when the midpoint is not less than the maximum.
- [x] The Employee detail screen shows the salary band of the employee.
- [x] The Employee detail screen shows the compa-ratio with 2 decimal places.
- [x] The Employee detail screen shows the range penetration with 1 decimal place.
- [x] The Employee detail screen shows the range status: below range, in range or above range.
- [x] The Employee detail screen shows the position of the salary on a range bar.
- [x] A salary of 45,000 in a band of 35,000 / 50,000 / 65,000 shows a compa-ratio of 0.90 and a range penetration of 33.3%.
- [x] A salary equal to the band minimum or the band maximum is in range.

## Slice 4: Pay health (FR-09, FR-10)

- [x] The Pay health screen shows the number of below-range employees and the number of above-range employees.
- [x] The Pay health screen shows the correction cost in USD.
- [x] The Pay health screen lists the below-range employees with the salary, the band minimum and the difference.
- [x] The Pay health screen lists the above-range employees with the salary, the band maximum and the difference.
- [x] The HR Manager can filter the lists by country and by job level.
- [x] Each row opens the Employee detail screen.
- [x] After the HR Manager moves a below-range salary to the band minimum, the number of below-range employees decreases by 1.
- [x] An inactive employee does not show in the lists.
- [x] The system shows an empty state when no employee is outside the salary band.

## Slice 5: Pay equity (FR-11, FR-12, NFR-07)

- [x] The Pay equity screen shows the mean gap and the median gap for the organization, in USD.
- [x] The Pay equity screen shows the mean gap and the median gap for each country, in the local currency.
- [x] Each group shows the number of men and the number of women.
- [x] A group with a mean gap or a median gap of more than 5%, in favor of men or of women, has a flag.
- [x] A group with fewer than 5 men or fewer than 5 women shows "not enough data" and no gap.
- [x] The screen shows the label "unadjusted" and a description of its meaning.
- [x] A negative gap states in words that women have the higher pay.
- [x] The system shows an empty state when there are no active employees.
- [x] An inactive employee does not count in a gap.

## API Shape

```
GET  /api/employees?search=&country=&department=&job_level=&status=&sort=&page=&page_size=
     -> 200 { items: [Employee], page, page_size, total } | 422
GET  /api/employees/{id}
     -> 200 Employee + { band: Band | null, compa_ratio, range_penetration, range_status } | 404
POST /api/employees/{id}/salary-changes   { new_salary_minor, reason, effective_date }
     -> 201 SalaryChange | 404 | 422
GET  /api/employees/{id}/salary-changes
     -> 200 [SalaryChange] | 404
POST /api/employees/{id}/deactivate
     -> 200 Employee | 404 | 422
GET  /api/meta
     -> 200 { countries: [{ code, name, currency }], departments, job_levels,
              reporting_currency, rates_as_of, today }
GET  /api/insights/overview?group_by=country|department|job_level
     -> 200 { reporting_currency, payroll_cost_minor, headcount, rates_as_of, group_by,
              groups: [Group] } | 422
GET  /api/bands?country=
     -> 200 [Band]
PUT  /api/bands/{id}                      { min_minor, mid_minor, max_minor }
     -> 200 Band | 404 | 422
GET  /api/insights/pay-health
     -> 200 { below_count, above_count, correction_cost_minor, reporting_currency }
GET  /api/insights/pay-health/employees?status=below|above&country=&job_level=&page=&page_size=
     -> 200 { items: [Outlier], page, page_size, total } | 422
GET  /api/insights/pay-equity
     -> 200 { organization: Gap, countries: [Gap], flag_threshold_pct, min_group_size }

Each 422 reply: { detail: [{ field, cause }] }

Employee:     { id, employee_code, full_name, email, job_title, job_level, department,
                country, currency, salary_minor, gender, hire_date, status }
SalaryChange: { id, old_salary_minor, new_salary_minor, currency, reason, effective_date, created_at }
Band:         { id, job_level, country, currency, min_minor, mid_minor, max_minor }
Group:        { key, label, headcount, payroll_cost_minor, currency,
                min_minor, median_minor, max_minor }
Outlier:      { id, employee_code, full_name, job_title, job_level, department, country,
                currency, salary_minor, band_limit_minor, difference_minor }
Gap:          { key, label, currency, men, women, mean_gap_pct, median_gap_pct,
                is_flagged, has_enough_data }
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
