import { Badge } from '@astryxdesign/core/Badge'
import { Icon } from '@astryxdesign/core/Icon'
import { Text } from '@astryxdesign/core/Text'
import type { RangeStatus } from '../../api/types'

/** The range status. A salary outside the band has the warning color, so the outliers stand out. */
export function RangeStatusBadge({ status }: { status: RangeStatus }) {
  switch (status) {
    case 'below':
      return <Badge variant="warning" label="Below range" icon={<Icon icon="arrowDown" />} />
    case 'above':
      return <Badge variant="warning" label="Above range" icon={<Icon icon="arrowUp" />} />
    case 'in_range':
      return <Badge variant="success" label="In range" icon={<Icon icon="check" />} />
    case 'no_band':
      return <Text type="supporting">No salary band</Text>
    default: {
      // A new range status in the API type does not compile until it has a case here.
      const unknown: never = status
      return unknown
    }
  }
}
