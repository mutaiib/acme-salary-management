/** The number of minor units in one unit. All currencies of ACME have 2 decimal places. */
const MINOR_PER_UNIT = 100

/**
 * Converts an amount from a form (in currency units) to minor units.
 * An empty input gives zero, and the API refuses zero with a cause.
 */
export function toMinor(units: number | null): number {
  return Math.round((units ?? 0) * MINOR_PER_UNIT)
}

/** Converts minor units to currency units, to show an amount or to fill a form. */
export function toUnits(amountMinor: number): number {
  return amountMinor / MINOR_PER_UNIT
}
