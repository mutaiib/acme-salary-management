import { Link } from '@astryxdesign/core/Link'

/** The name of an employee, as a link to the Employee detail screen. */
export function EmployeeLink({ id, name }: { id: number; name: string }) {
  return <Link href={`/employees/${id}`}>{name}</Link>
}
