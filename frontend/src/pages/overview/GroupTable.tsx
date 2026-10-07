import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { Stack } from '@astryxdesign/core/Stack'
import { pixel, proportional, type TableColumn } from '@astryxdesign/core/Table'
import { Text } from '@astryxdesign/core/Text'
import type { GroupFigures } from '../../api/types'
import { DataTable, moneyColumn, type TableRow } from '../../components'
import { formatCount, formatShare } from '../../lib/format'

interface Props {
  /** The heading of the first column, for example "Country". */
  groupHeader: string
  groups: GroupFigures[]
  totalCostMinor: number
  reportingCurrency: string
}

export function GroupTable({ groupHeader, groups, totalCostMinor, reportingCurrency }: Props) {
  const columns: TableColumn<TableRow<GroupFigures>>[] = [
    { key: 'label', header: groupHeader, width: proportional(2) },
    {
      key: 'headcount',
      header: 'Headcount',
      width: pixel(110),
      align: 'end',
      renderCell: (group) => formatCount(group.headcount),
    },
    moneyColumn<GroupFigures>('payroll_cost_minor', 'Payroll cost', () => reportingCurrency),
    {
      key: 'share',
      header: 'Share of cost',
      width: proportional(2),
      renderCell: (group) => (
        <Stack direction="horizontal" gap={2} vAlign="center">
          <ProgressBar
            label={`Share of the payroll cost: ${group.label}`}
            isLabelHidden
            value={group.payroll_cost_minor}
            max={totalCostMinor}
            variant="neutral"
          />
          <Text type="supporting" hasTabularNumbers textWrap="nowrap">
            {formatShare(group.payroll_cost_minor, totalCostMinor)}
          </Text>
        </Stack>
      ),
    },
    moneyColumn<GroupFigures>('min_minor', 'Minimum salary'),
    moneyColumn<GroupFigures>('median_minor', 'Median salary'),
    moneyColumn<GroupFigures>('max_minor', 'Maximum salary'),
  ]

  return <DataTable rows={groups} columns={columns} idKey="key" />
}
