import { getMeta } from '../api/meta'
import type { Meta } from '../api/types'
import { type ApiState, useApi } from './useApi'

/**
 * The fixed values for the filters (countries, departments, job levels) and the date
 * of the server. Show `MetaBanner` with this state, so that a failure is visible.
 */
export function useMeta(): ApiState<Meta> {
  return useApi(getMeta, [])
}

/** The name of a country for its code. The code shows while the fixed values load. */
export function countryNameOf(meta: Meta | undefined, code: string): string {
  return meta?.countries.find((country) => country.code === code)?.name ?? code
}
