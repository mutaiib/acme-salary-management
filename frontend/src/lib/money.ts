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

/** A salary after an increase of `pct` percent, as a whole number of currency units. */
export function raisedBy(amountMinor: number, pct: number): number {
  return Math.round((amountMinor * (1 + pct / 100)) / MINOR_PER_UNIT) * MINOR_PER_UNIT
}

/** The change from an old salary to a new salary in percent, with 1 decimal place. */
export function changePct(oldMinor: number, newMinor: number): number {
  return Math.round(((newMinor - oldMinor) / oldMinor) * 1000) / 10
}
