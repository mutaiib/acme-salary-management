import type { Band, Employee, EmployeeDetail, Meta, Page, SalaryChange } from '../api/types'

export function employee(number: number, overrides: Partial<Employee> = {}): Employee {
  return {
    id: number,
    employee_code: `E${String(number).padStart(5, '0')}`,
    full_name: `Employee ${number}`,
    email: `employee${number}@acme.example`,
    job_title: 'Software Engineer',
    job_level: 2,
    department: 'Engineering',
    country: 'US',
    currency: 'USD',
    salary_minor: 6_500_000,
    gender: 'female',
    hire_date: '2022-01-10',
    status: 'active',
    ...overrides,
  }
}

export function pageOf<T>(items: T[], page = 1, total = items.length): Page<T> {
  return { items, page, page_size: 25, total }
}

export function salaryChange(number: number, overrides: Partial<SalaryChange> = {}): SalaryChange {
  return {
    id: number,
    old_salary_minor: 6_000_000,
    new_salary_minor: 6_500_000,
    currency: 'USD',
    reason: 'Annual review',
    effective_date: '2025-06-01',
    created_at: '2025-06-01T09:00:00',
    ...overrides,
  }
}

export const META: Meta = {
  countries: [
    { code: 'US', name: 'United States', currency: 'USD' },
    { code: 'IN', name: 'India', currency: 'INR' },
  ],
  departments: ['Engineering', 'Sales'],
  job_levels: [1, 2, 3, 4, 5],
  reporting_currency: 'USD',
  rates_as_of: '2026-01-01',
  today: '2026-03-01',
}

export function band(number: number, overrides: Partial<Band> = {}): Band {
  return {
    id: number,
    job_level: 2,
    country: 'US',
    currency: 'USD',
    min_minor: 5_200_000,
    mid_minor: 6_500_000,
    max_minor: 7_800_000,
    ...overrides,
  }
}

/** An employee at the midpoint of the default band. */
export function employeeDetail(
  number: number,
  overrides: Partial<EmployeeDetail> = {},
): EmployeeDetail {
  return {
    ...employee(number),
    band: band(1),
    compa_ratio: 1.0,
    range_penetration: 50.0,
    range_status: 'in_range',
    ...overrides,
  }
}
