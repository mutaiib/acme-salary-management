import { getJson } from './client'
import type {
  GroupBy,
  Outlier,
  OutlierStatus,
  Overview,
  Page,
  PayEquity,
  PayHealthSummary,
} from './types'

export function getOverview(groupBy: GroupBy): Promise<Overview> {
  return getJson('/api/insights/overview', { group_by: groupBy })
}

export function getPayHealth(): Promise<PayHealthSummary> {
  return getJson('/api/insights/pay-health')
}

export interface OutlierQuery {
  status: OutlierStatus
  country?: string
  job_level?: string
  page: number
}

export function listOutliers(query: OutlierQuery): Promise<Page<Outlier>> {
  return getJson('/api/insights/pay-health/employees', { ...query })
}

export function getPayEquity(): Promise<PayEquity> {
  return getJson('/api/insights/pay-equity')
}
