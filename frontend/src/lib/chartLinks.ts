import type { GroupBy, OutlierStatus, SalaryBracket } from '../api/types'

// `back` is the address of the chart (path and query), so the list can go back to the same view.
function address(path: string, parameters: Record<string, string>, back: string): string {
  return `${path}?${new URLSearchParams({ ...parameters, back })}`
}

/** The Employees list with the active employees of one salary bracket. */
export function bracketHref(bracket: SalaryBracket, back: string): string {
  return address(
    '/employees',
    {
      status: 'active',
      salary_from_minor: String(bracket.from_minor),
      salary_to_minor: String(bracket.to_minor),
    },
    back,
  )
}

/** The Pay health list with the outliers of one group and one status. */
export function outlierHref(
  groupBy: GroupBy,
  key: string,
  status: OutlierStatus,
  back: string,
): string {
  return address('/pay-health', { status, [groupBy]: key }, back)
}
