import { getJson, sendJson } from './client'
import type { Band, BandChangePreview, BandFigures, BandRequest } from './types'

export function listBands(country?: string): Promise<BandFigures[]> {
  return getJson('/api/bands', { country })
}

export function updateBand(id: number, request: BandRequest): Promise<Band> {
  return sendJson('PUT', `/api/bands/${id}`, request)
}

export function previewBandChange(id: number, request: BandRequest): Promise<BandChangePreview> {
  return sendJson('POST', `/api/bands/${id}/preview`, request)
}
