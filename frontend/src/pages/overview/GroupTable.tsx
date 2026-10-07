import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { Stack } from '@astryxdesign/core/Stack'
import { pixel, proportional, Table, type TableColumn } from '@astryxdesign/core/Table'
import { Text } from '@astryxdesign/core/Text'
import type { GroupFigures } from '../../api/types'
import { Money } from '../../components'
import { formatCount, formatShare } from '../../lib/format'

type GroupRow = GroupFigures & Record<string, unknown>

interface Props {
  /** The heading of the first column, for example "Country". */
  groupHeader: string
  groups: GroupFigures[]
  totalCostMinor: number
  reportingCurrency: string
}

export function GroupTable({ groupHeader, groups, totalCostMinor, reportingCurrency }: Props) {
  const money = (key: 'min_minor' | 'median_minor' | 'max_minor', header: string) =>
    ({
      key,
      header,
      width: proportional(1),
      align: 'end',
      renderCell: (group) => <Money amountMinor={group[key]} currency={group.currency} />,
    }) satisfies TableColumn<GroupRow>

  const columns: TableColumn<GroupRow>[] = [
    { key: 'label', header: groupHeader, width: proportional(2) },
    {
      key: 'headcount',
      header: 'Headcount',
      width: pixel(110),
      align: 'end',
      renderCell: (group) => formatCount(group.headcount),
    },
    {
      key: 'payroll_cost_minor',
      header: 'Payroll cost',
      width: proportional(1),
      align: 'end',
      renderCell: (group) => (
        <Money amountMinor={group.payroll_cost_minor} currency={reportingCurrency} />
      ),
    },
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
    money('min_minor', 'Minimum salary'),
    money('median_minor', 'Median salary'),
    money('max_minor', 'Maximum salary'),
  ]

  return <Table data={groups as GroupRow[]} columns={columns} idKey="key" density="compact" />
}
