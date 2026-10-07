const LOCALE = 'en-US'

/** Formats an amount in minor units as whole currency units, for example `$65,000`. */
export function formatMoney(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amountMinor / 100)
}

export function formatCount(count: number): string {
  return new Intl.NumberFormat(LOCALE).format(count)
}

/** Formats an ISO date (`2026-01-31`) as `31 Jan 2026`. */
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
