import { getJson } from './client'
import type { Meta } from './types'

export function getMeta(): Promise<Meta> {
  return getJson('/api/meta')
}
