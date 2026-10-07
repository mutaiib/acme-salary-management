# Glossary

This document gives one meaning to each term. All project documents and the code use these terms. Do not use a synonym for a term.

## People

| Term | Meaning |
|---|---|
| System | The salary management software: the API and the UI together. |
| HR Manager | The person who uses the system. There is one user role. |
| Employee | A person that ACME pays. An employee has one salary. |
| Active employee | An employee with the status `active`. Only active employees count in the insights. |

## Pay

| Term | Meaning |
|---|---|
| Salary | The base pay of an employee for one year, before tax, in the local currency. |
| Minor unit | The smallest unit of a currency (for example, the cent). The system keeps all money as an integer in minor units. |
| Local currency | The currency of the country of the employee. Each country has one currency. |
| Reporting currency | The currency for totals across countries. The reporting currency is USD. |
| Exchange rate | The value of one unit of a local currency in the reporting currency, on a given date. An employee who has a currency without an exchange rate is not in the insights. |
| Payroll cost | The sum of the salaries of the active employees, in the reporting currency. |
| Headcount | The number of active employees. |
| Salary change | A record of one change to a salary. It has the old salary, the new salary, a reason and an effective date. |
| Salary history | All the salary changes of one employee, newest first. |
| Effective date | The date from which a salary change applies. |

## Structure

| Term | Meaning |
|---|---|
| Job level | The seniority of a job, from 1 (lowest) to 5 (highest). |
| Salary band | The pay range for one job level in one country. A band has a minimum, a midpoint and a maximum. |
| Compa-ratio | The salary divided by the band midpoint. |
| Range penetration | The position of the salary in the band, as a percentage. |
| Range status | One of: below range, in range, above range, no salary band. The API values are `below`, `in_range`, `above` and `no_band`. |
| Below range | The salary is less than the band minimum. |
| Above range | The salary is more than the band maximum. |
| Outlier | An active employee who is below range or above range. |
| Correction cost | The cost to move all below-range salaries to the band minimum, for one year, in the reporting currency. |

## Formulas

```
compa-ratio        = salary / band midpoint
range penetration  = (salary - band minimum) / (band maximum - band minimum) x 100
correction cost    = sum of (band minimum - salary) for each below-range employee
```

Example: a salary of 45,000 in a band of 35,000 / 50,000 / 65,000 has a compa-ratio of 0.90 and a range penetration of 33.3%.
