import { Link } from '@astryxdesign/core/Link'
import { Text } from '@astryxdesign/core/Text'
import type { BandFigures, OutlierStatus } from '../../api/types'
import { formatCount } from '../../lib/format'

interface Props {
  band: BandFigures
  status: OutlierStatus
  /** The band in words, for the name of the link: the country and the job level. */
  bandName: string
}

/**
 * The number of employees of a band who are below range or above range. A number above
 * zero is a link to these employees on the Pay health screen. A zero is quiet text.
 */
export function OutsideBand({ band, status, bandName }: Props) {
  const count = status === 'below' ? band.below_count : band.above_count
  if (count === 0) {
    return <Text type="supporting">0</Text>
  }
  const filters = new URLSearchParams({
    status,
    country: band.country,
    job_level: String(band.job_level),
  })
  const employees = count === 1 ? 'employee' : 'employees'
  return (
    <Link
      href={`/pay-health?${filters}`}
      label={`${formatCount(count)} ${employees} ${status} range: ${bandName}`}
    >
      {formatCount(count)}
    </Link>
  )
}
