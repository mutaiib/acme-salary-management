import { getJson } from './client'
import type {
  GroupBy,
  Outlier,
  OutlierStatus,
  Overview,
  Page,
  PayHealthSummary,
} from './types'

export function getOverview(groupBy: GroupBy): Promise<Overview> {
  return getJson('/api/insights/overview', { group_by: groupBy })
}

export function getPayHealth(): Promise<PayHealthSummary> {
  return getJson('/api/insights/pay-health')
}

export interface OutlierQuery {
  /** Without a status, the list has all outliers. */
  status?: OutlierStatus
  country?: string
  job_level?: string
  search?: string
  page: number
  page_size: number
}

export function listOutliers(query: OutlierQuery): Promise<Page<Outlier>> {
  return getJson('/api/insights/pay-health/employees', { ...query })
}
