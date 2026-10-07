import { Link } from '@astryxdesign/core/Link'

interface Props {
  id: number
  name: string
  /** The screen that the link is on, when it is not the Employees list. The record then goes back to it. */
  from?: 'pay-health'
}

/** The name of an employee, as a link to the Employee detail screen. */
export function EmployeeLink({ id, name, from }: Props) {
  return <Link href={`/employees/${id}${from ? `?from=${from}` : ''}`}>{name}</Link>
}
