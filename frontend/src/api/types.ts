// The shapes of the API. `backend/app/schemas.py` has the same shapes.
// Change the two files together.

export type EmployeeStatus = 'active' | 'inactive'
export type Gender = 'male' | 'female'

export interface Employee {
  id: number
  employee_code: string
  full_name: string
  email: string
  job_title: string
  job_level: number
  department: string
  country: string
  currency: string
  salary_minor: number
  gender: Gender
  hire_date: string
  status: EmployeeStatus
}

export interface Page<T> {
  items: T[]
  page: number
  page_size: number
  total: number
}

export interface SalaryChange {
  id: number
  /** Null for the first salary of the employee. */
  old_salary_minor: number | null
  new_salary_minor: number
  currency: string
  reason: string
  effective_date: string
  created_at: string
}

export interface SalaryChangeRequest {
  new_salary_minor: number
  reason: string
  effective_date: string
}

export interface Country {
  code: string
  name: string
  currency: string
}

export interface ExchangeRate {
  currency: string
  /** The value of 1 unit of the currency, in micro-units of the reporting currency. */
  rate_micro: number
  as_of_date: string
}

export interface Meta {
  countries: Country[]
  departments: string[]
  job_levels: number[]
  reporting_currency: string
  rates_as_of: string | null
  /** The date of the server, as an ISO date. The UI uses it for "today". */
  today: string
}

export interface GroupFigures {
  key: string
  label: string
  headcount: number
  /** In the reporting currency. */
  payroll_cost_minor: number
  /** The currency of the minimum, the median and the maximum. */
  currency: string
  min_minor: number
  median_minor: number
  max_minor: number
}

export type GroupBy = 'country' | 'department' | 'job_level'

export interface Overview {
  reporting_currency: string
  payroll_cost_minor: number
  headcount: number
  /** The median salary of all active employees, in the reporting currency. */
  median_salary_minor: number
  rates_as_of: string | null
  group_by: GroupBy
  groups: GroupFigures[]
}

export interface Band {
  id: number
  job_level: number
  country: string
  currency: string
  min_minor: number
  mid_minor: number
  max_minor: number
}

export interface BandRequest {
  min_minor: number
  mid_minor: number
  max_minor: number
}

export type RangeStatus = 'below' | 'in_range' | 'above' | 'no_band'

/** An employee with the position of the salary in the salary band. */
export interface EmployeeDetail extends Employee {
  band: Band | null
  compa_ratio: number | null
  range_penetration: number | null
  range_status: RangeStatus
}

export interface PayHealthSummary {
  below_count: number
  above_count: number
  /** The cost to move all below-range salaries to the band minimum, in the reporting currency. */
  correction_cost_minor: number
  /** The payroll cost of all active employees, in the reporting currency. */
  payroll_cost_minor: number
  reporting_currency: string
}

export type OutlierStatus = 'below' | 'above'

export interface Outlier {
  id: number
  employee_code: string
  full_name: string
  job_title: string
  job_level: number
  department: string
  country: string
  currency: string
  salary_minor: number
  range_status: OutlierStatus
  /** The band minimum for a below-range employee, the band maximum for an above-range one. */
  band_limit_minor: number
  difference_minor: number
}

/** The lowest, the middle and the highest salary of a group of employees. */
export interface SalaryFigures {
  currency: string
  min_minor: number
  median_minor: number
  max_minor: number
}

/** The pay figures of the active employees that a list shows. */
export interface EmployeeSummary {
  headcount: number
  /** In the reporting currency. */
  payroll_cost_minor: number
  reporting_currency: string
  /** True when all these employees have the same currency. */
  has_one_currency: boolean
  /** Null when no active employee matches. */
  salary: SalaryFigures | null
}
