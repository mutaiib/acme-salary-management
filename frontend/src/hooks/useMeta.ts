import { getMeta } from '../api/meta'
import type { Meta } from '../api/types'
import { useApi } from './useApi'

/** The fixed values for the filters: countries, departments and job levels. */
export function useMeta(): Meta | undefined {
  return useApi(getMeta, []).data
}
