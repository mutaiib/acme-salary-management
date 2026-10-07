export type EmployeeStatus = 'active' | 'inactive'

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
  gender: string
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

export interface Meta {
  countries: Country[]
  departments: string[]
  job_levels: number[]
  reporting_currency: string
  rates_as_of: string | null
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
  rates_as_of: string | null
  group_by: string
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
