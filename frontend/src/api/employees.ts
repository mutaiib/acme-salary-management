import { getJson } from './client'
import type { Employee, Page } from './types'

export interface EmployeeListQuery {
  page: number
}

export function listEmployees(query: EmployeeListQuery): Promise<Page<Employee>> {
  return getJson('/api/employees', { ...query })
}
