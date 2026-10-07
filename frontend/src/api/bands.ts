import { getJson, sendJson } from './client'
import type { Band, BandRequest } from './types'

export function listBands(country?: string): Promise<Band[]> {
  return getJson('/api/bands', { country })
}

export function updateBand(id: number, request: BandRequest): Promise<Band> {
  return sendJson('PUT', `/api/bands/${id}`, request)
}
