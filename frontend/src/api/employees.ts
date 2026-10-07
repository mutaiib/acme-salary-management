import { getJson, sendJson } from './client'
import type { Employee, Page, SalaryChange, SalaryChangeRequest } from './types'

export interface EmployeeListQuery {
  page: number
  search?: string
  country?: string
  department?: string
  job_level?: string
  status?: string
  sort?: string
}

export function listEmployees(query: EmployeeListQuery): Promise<Page<Employee>> {
  return getJson('/api/employees', { ...query })
}

export function getEmployee(id: number): Promise<Employee> {
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
