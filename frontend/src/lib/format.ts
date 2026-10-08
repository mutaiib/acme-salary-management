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

/**
 * Formats a change of an amount with its sign, for example `+$5,000` or `-$5,000`.
 * An amount of zero has no sign.
 */
export function formatSignedMoney(amountMinor: number, currency: string): string {
  const sign = amountMinor > 0 ? '+' : amountMinor < 0 ? '-' : ''
  return `${sign}${formatMoney(Math.abs(amountMinor), currency)}`
}

/** A total below this number of currency units shows all its digits. */
const SHORT_FROM_UNITS = 100_000

/**
 * Formats a large total in a short form, for example `$567.68M` or `$358K`.
 * A screen shows the full amount beside it or on hover. A salary always uses `formatMoney`.
 */
export function formatMoneyShort(amountMinor: number, currency: string): string {
  if (Math.abs(toUnits(amountMinor)) < SHORT_FROM_UNITS) {
    return formatMoney(amountMinor, currency)
  }
  return formatMoneyCompact(amountMinor, currency)
}

/**
 * An amount in the short form at each size, for example `$20K`. The labels of a chart
 * axis use it, so that all labels of the axis have one form.
 */
export function formatMoneyCompact(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(toUnits(amountMinor))
}

export function formatCount(count: number): string {
  return new Intl.NumberFormat(LOCALE).format(count)
}

const MICRO = 1_000_000

/** Formats an exchange rate in micro-units, for example `1.08` or `0.012`. */
export function formatRate(rateMicro: number): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 6 }).format(rateMicro / MICRO)
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

/**
 * Formats the time of a record as a date in the time zone of the HR Manager.
 * The API gives the time in UTC, so near midnight the date can differ from the UTC date.
 */
export function formatRecordedDate(utcDateTime: string, timeZone?: string): string {
  const hasZone = /(Z|[+-]\d{2}:\d{2})$/.test(utcDateTime)
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone,
  }).format(new Date(hasZone ? utcDateTime : `${utcDateTime}Z`))
}

/**
 * Formats a part of a total as a percentage, for example `61.5%`.
 * A small part can use 2 decimal places, for example `0.19%`.
 */
export function formatShare(part: number, total: number, decimals = 1): string {
  return `${(total === 0 ? 0 : (part / total) * 100).toFixed(decimals)}%`
}

/** The name of a job level on the screen, for example `Level 3`. */
export function formatJobLevel(jobLevel: number): string {
  return `Level ${jobLevel}`
}
