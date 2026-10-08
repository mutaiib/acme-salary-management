// The one way back, in the address. The link to a list or to a record carries the address of the
// screen that it comes from (path, filters and page) as `back`, so the screen can go back to it.
const BACK = 'back'

interface Back {
  href: string
  label: string
}

const EMPLOYEES: Back = { href: '/employees', label: 'Back to Employees' }

// The screens that a link can go back to, and the text of the link back to each one.
const LABELS: Record<string, string> = {
  '/employees': EMPLOYEES.label,
  '/pay-health': 'Back to Pay health',
  '/analysis': 'Back to Pay analysis',
}

/** The address of an employee record, with the address of the list (path and query) as the way back. */
export function recordHref(id: number, listPath: string, listSearch: string): string {
  return `/employees/${id}?${new URLSearchParams({ [BACK]: listPath + listSearch })}`
}

/**
 * The way back that the address names, or null. Only a screen of the system is accepted, so a
 * link that a person made by hand cannot go to a different site: the value must start with `/`,
 * not with `//`, and its path must be exactly one of the screens in `LABELS`.
 */
function backOf(params: URLSearchParams): Back | null {
  const back = params.get(BACK)
  if (!back || !back.startsWith('/') || back.startsWith('//')) {
    return null
  }
  const label = LABELS[back.split('?')[0]]
  return label ? { href: back, label } : null
}

/** The link back from a record. A missing or refused value goes back to the Employees list. */
export function recordBack(params: URLSearchParams): Back {
  return backOf(params) ?? EMPLOYEES
}

/** The link back from a list, or null for a list that no other screen opened. */
export function listBack(params: URLSearchParams): Back | null {
  return backOf(params)
}
