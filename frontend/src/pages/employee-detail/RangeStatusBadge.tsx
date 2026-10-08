import { Badge } from '@astryxdesign/core/Badge'
import { Icon } from '@astryxdesign/core/Icon'
import { Text } from '@astryxdesign/core/Text'
import type { RangeStatus } from '../../api/types'

/**
 * The range status. Only an exception gets a badge: a salary outside the band, or no band.
 * Below range is red and above range is green, as in the list and the chart of the outliers.
 * A salary in range gets nothing, because the range bar already shows its position.
 */
export function RangeStatusBadge({ status }: { status: RangeStatus }) {
  switch (status) {
    case 'below':
      return <Badge variant="red" label="Below range" icon={<Icon icon="arrowDown" />} />
    case 'above':
      return <Badge variant="green" label="Above range" icon={<Icon icon="arrowUp" />} />
    case 'in_range':
      return null
    case 'no_band':
      return <Text type="supporting">No salary band</Text>
    default: {
      // A new range status in the API type does not compile until it has a case here.
      const unknown: never = status
      return unknown
    }
  }
}
