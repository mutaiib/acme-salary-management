import { getJson, sendJson } from './client'
import type {
  Employee,
  EmployeeSummary,
  EmployeeDetail,
  Page,
  SalaryChange,
  SalaryChangeRequest,
} from './types'

export interface EmployeeListQuery {
  page: number
  page_size: number
  search?: string
  country?: string
  department?: string
  job_level?: string
  status?: string
  /** A salary bracket in the reporting currency: from (included) to (not included). */
  salary_from_minor?: string
  salary_to_minor?: string
  sort?: string
}

export function listEmployees(query: EmployeeListQuery): Promise<Page<Employee>> {
  return getJson('/api/employees', { ...query })
}

/** The pay figures for the same search and filters as the list. */
export function getEmployeeSummary(
  query: Omit<EmployeeListQuery, 'page' | 'page_size' | 'sort'>,
): Promise<EmployeeSummary> {
  return getJson('/api/employees/summary', { ...query })
}

export function getEmployee(id: number): Promise<EmployeeDetail> {
  return getJson(`/api/employees/${id}`)
}

export function listSalaryChanges(id: number): Promise<SalaryChange[]> {
  return getJson(`/api/employees/${id}/salary-changes`)
}

export function changeSalary(id: number, request: SalaryChangeRequest): Promise<SalaryChange> {
  return sendJson('POST', `/api/employees/${id}/salary-changes`, request)
}

export function deactivateEmployee(id: number): Promise<Employee> {
  return sendJson('POST', `/api/employees/${id}/deactivate`)
}
