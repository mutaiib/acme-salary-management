import { Banner } from '@astryxdesign/core/Banner'
import { Link } from '@astryxdesign/core/Link'
import { getPayHealth } from '../../api/insights'
import { useApi } from '../../hooks/useApi'
import { formatCount, formatMoney } from '../../lib/format'

/**
 * Tells the HR Manager that salaries are outside the salary band, with the figures of
 * the Pay health screen. It shows nothing when all salaries are in the band, or when
 * the figures did not load: the Pay overview is still correct without it.
 */
export function OutlierNotice() {
  const { data } = useApi(getPayHealth, [])
  if (!data || data.below_count + data.above_count === 0) {
    return null
  }
  const cost = formatMoney(data.correction_cost_minor, data.reporting_currency)
  return (
    <Banner
      status="warning"
      title={`${formatCount(data.below_count + data.above_count)} salaries are outside the salary band`}
      description={`${formatCount(data.below_count)} are below range and ${formatCount(data.above_count)} are above range. The correction cost is ${cost} for one year.`}
      endContent={
        <Link href="/pay-health" isStandalone>
          Go to Pay health
        </Link>
      }
    />
  )
}
