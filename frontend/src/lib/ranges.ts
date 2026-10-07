import type { Band } from '../api/types'

/** The position of an amount on the band, from 0 (minimum) to 100 (maximum), kept on the bar. */
export function positionOnBand(amountMinor: number, band: Band): number {
  const width = band.max_minor - band.min_minor
  const position = ((amountMinor - band.min_minor) / width) * 100
  return Math.min(100, Math.max(0, Math.round(position)))
}

/**
 * The amount between a salary and the band maximum. It is negative when the salary
 * is above the band maximum.
 */
export function roomToMaximum(amountMinor: number, band: Band): number {
  return band.max_minor - amountMinor
}
