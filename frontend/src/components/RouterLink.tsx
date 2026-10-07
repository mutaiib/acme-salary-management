import type { ComponentProps } from 'react'
import { Link } from 'react-router-dom'

type Props = Omit<ComponentProps<typeof Link>, 'to'> & { href?: string }

/** Lets Astryx links and navigation items use the router, so a click does not reload the page. */
export function RouterLink({ href = '', ...rest }: Props) {
  return <Link to={href} {...rest} />
}
