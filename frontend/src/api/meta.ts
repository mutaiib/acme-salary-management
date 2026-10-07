import { getJson } from './client'
import type { ExchangeRate, Meta } from './types'

export function getMeta(): Promise<Meta> {
  return getJson('/api/meta')
}

export function listExchangeRates(): Promise<ExchangeRate[]> {
  return getJson('/api/meta/exchange-rates')
}
