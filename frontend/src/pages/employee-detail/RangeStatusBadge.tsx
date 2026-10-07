import { Badge } from '@astryxdesign/core/Badge'
import { Text } from '@astryxdesign/core/Text'
import type { RangeStatus } from '../../api/types'

/** The range status. Only a salary outside the band gets a badge, so the outliers stand out. */
export function RangeStatusBadge({ status }: { status: RangeStatus }) {
  switch (status) {
    case 'below':
      return <Badge variant="warning" label="Below range" />
    case 'above':
      return <Badge variant="warning" label="Above range" />
    case 'in_range':
      return <Text type="supporting">In range</Text>
    case 'no_band':
      return <Text type="supporting">No salary band</Text>
    default: {
      // A new range status in the API type does not compile until it has a case here.
      const unknown: never = status
      return unknown
    }
  }
}
