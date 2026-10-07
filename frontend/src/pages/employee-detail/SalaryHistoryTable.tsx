import { pixel, proportional, type TableColumn } from '@astryxdesign/core/Table'
import { Text } from '@astryxdesign/core/Text'
import type { SalaryChange } from '../../api/types'
import { DataTable, Money, moneyColumn, type TableRow } from '../../components'
import { formatDate } from '../../lib/format'

const COLUMNS: TableColumn<TableRow<SalaryChange>>[] = [
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
  moneyColumn<SalaryChange>('new_salary_minor', 'New salary'),
  { key: 'reason', header: 'Reason', width: proportional(3) },
  {
    key: 'created_at',
    header: 'Recorded on',
    width: pixel(140),
    renderCell: (change) => formatDate(change.created_at),
  },
]

export function SalaryHistoryTable({ changes }: { changes: SalaryChange[] }) {
  return <DataTable rows={changes} columns={COLUMNS} idKey="id" />
}
