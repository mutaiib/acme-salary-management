import type { ISODateString } from '@astryxdesign/core/utils'

/** Today as an ISO date (`2026-01-31`), in the time zone of the user. */
export function todayIso(now: Date = new Date()): ISODateString {
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}` as ISODateString
}
