import { getJson } from './client'
import type { GroupBy, Overview } from './types'

export function getOverview(groupBy: GroupBy): Promise<Overview> {
  return getJson('/api/insights/overview', { group_by: groupBy })
}
