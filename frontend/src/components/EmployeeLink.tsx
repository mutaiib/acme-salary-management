import { Link } from '@astryxdesign/core/Link'
import { useLocation } from 'react-router-dom'
import { recordHref } from '../lib/backLinks'

interface Props {
  id: number
  name: string
}

/**
 * The name of an employee, as a link to the Employee detail screen. The link carries the
 * address of the list that it is on, so the record goes back to that list with its filters.
 */
export function EmployeeLink({ id, name }: Props) {
  const { pathname, search } = useLocation()
  return <Link href={recordHref(id, pathname, search)}>{name}</Link>
}
