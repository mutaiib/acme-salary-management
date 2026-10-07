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
  status: 'active' | 'inactive'
}

export interface Page<T> {
  items: T[]
  page: number
  page_size: number
  total: number
}
