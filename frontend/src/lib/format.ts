import { toUnits } from './money'

const LOCALE = 'en-US'

/**
 * Formats an amount in minor units, for example `$65,000`.
 * It shows the minor units only when the amount has some, for example `$65,000.50`.
 */
export function formatMoney(amountMinor: number, currency: string): string {
  const fractionDigits = amountMinor % 100 === 0 ? 0 : 2
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(toUnits(amountMinor))
}

export function formatCount(count: number): string {
  return new Intl.NumberFormat(LOCALE).format(count)
}

/** Formats an ISO date (`2026-01-31`) or an ISO date and time as `31 Jan 2026`. */
export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`))
}

/** Formats a part of a total as a percentage with 1 decimal place, for example `61.5%`. */
export function formatShare(part: number, total: number): string {
  return total === 0 ? '0.0%' : `${((part / total) * 100).toFixed(1)}%`
}

/** Formats a pay gap with 1 decimal place, for example `9.9%` or `-0.9%`. */
export function formatGap(gapPct: number): string {
  return `${gapPct.toFixed(1)}%`
}

/** The name of a job level on the screen, for example `Level 3`. */
export function formatJobLevel(jobLevel: number): string {
  return `Level ${jobLevel}`
}
