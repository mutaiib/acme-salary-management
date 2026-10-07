import { pixel, proportional, Table, type TableColumn } from '@astryxdesign/core/Table'
import { Text } from '@astryxdesign/core/Text'
import type { SalaryChange } from '../../api/types'
import { Money } from '../../components'
import { formatDate } from '../../lib/format'

type ChangeRow = SalaryChange & Record<string, unknown>

const COLUMNS: TableColumn<ChangeRow>[] = [
  {
    key: 'effective_date',
    header: 'Effective date',
    width: pixel(140),
    renderCell: (change) => formatDate(change.effective_date),
  },
  {
    key: 'old_salary_minor',
    header: 'Old salary',
    width: proportional(1),
    align: 'end',
    renderCell: (change) =>
      change.old_salary_minor === null ? (
        <Text type="supporting">None</Text>
      ) : (
        <Money amountMinor={change.old_salary_minor} currency={change.currency} />
      ),
  },
  {
    key: 'new_salary_minor',
    header: 'New salary',
    width: proportional(1),
    align: 'end',
    renderCell: (change) => (
      <Money amountMinor={change.new_salary_minor} currency={change.currency} />
    ),
  },
  { key: 'reason', header: 'Reason', width: proportional(3) },
  {
    key: 'created_at',
    header: 'Recorded on',
    width: pixel(140),
    renderCell: (change) => formatDate(change.created_at),
  },
]

export function SalaryHistoryTable({ changes }: { changes: SalaryChange[] }) {
  return <Table data={changes as ChangeRow[]} columns={COLUMNS} idKey="id" density="compact" />
}
