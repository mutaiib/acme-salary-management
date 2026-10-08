import { getJson } from './client'
import type {
  GroupBy,
  HighSalary,
  Outlier,
  OutlierGroup,
  OutlierStatus,
  Overview,
  Page,
  PayHealthSummary,
  SalaryDistribution,
} from './types'

export function getOverview(groupBy: GroupBy): Promise<Overview> {
  return getJson('/api/insights/overview', { group_by: groupBy })
}

export function getSalaryDistribution(): Promise<SalaryDistribution> {
  return getJson('/api/insights/salary-distribution')
}

export function getPayHealth(): Promise<PayHealthSummary> {
  return getJson('/api/insights/pay-health')
}

export function listOutlierGroups(groupBy: GroupBy): Promise<OutlierGroup[]> {
  return getJson('/api/insights/pay-health/groups', { group_by: groupBy })
}

export interface OutlierQuery {
  /** Without a status, the list has all outliers. */
  status?: OutlierStatus
  country?: string
  department?: string
  job_level?: string
  search?: string
  page: number
  page_size: number
}

export function listOutliers(query: OutlierQuery): Promise<Page<Outlier>> {
  return getJson('/api/insights/pay-health/employees', { ...query })
}

export function listHighestSalaries(country?: string): Promise<HighSalary[]> {
  return getJson('/api/insights/highest-salaries', { country })
}
