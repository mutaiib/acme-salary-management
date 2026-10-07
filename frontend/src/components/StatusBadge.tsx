import { Badge } from '@astryxdesign/core/Badge'
import type { EmployeeStatus } from '../api/types'

/** Marks an inactive employee. An active employee is the normal case and gets no badge. */
export function StatusBadge({ status }: { status: EmployeeStatus }) {
  return status === 'inactive' ? <Badge variant="neutral" label="Inactive" /> : null
}
