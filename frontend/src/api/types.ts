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
