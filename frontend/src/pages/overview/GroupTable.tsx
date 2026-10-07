import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { Stack } from '@astryxdesign/core/Stack'
import { pixel, proportional, type TableColumn } from '@astryxdesign/core/Table'
import { Text } from '@astryxdesign/core/Text'
import { Tooltip } from '@astryxdesign/core/Tooltip'
import type { GroupFigures } from '../../api/types'
import { DataTable, Money, type TableRow } from '../../components'
import { formatCount, formatMoney, formatMoneyShort, formatShare } from '../../lib/format'

interface Props {
  /** The heading of the first column, for example "Country". */
  groupHeader: string
  groups: GroupFigures[]
  totalCostMinor: number
  reportingCurrency: string
}

/**
 * The salaries of a group: the minimum, the median and the maximum. The bar goes from
 * the minimum to the maximum, and the fill ends at the median.
 */
function SalaryRange({ group }: { group: GroupFigures }) {
  return (
    <Stack gap={1}>
      <ProgressBar
        label={`Position of the median salary between the minimum and the maximum: ${group.label}`}
        isLabelHidden
        value={group.median_minor - group.min_minor}
        max={group.max_minor - group.min_minor}
        variant="neutral"
        marks={[{ value: group.median_minor - group.min_minor, label: 'Median' }]}
      />
      <Stack direction="horizontal" hAlign="between" gap={2}>
        <Text type="supporting" hasTabularNumbers>
          <Money amountMinor={group.min_minor} currency={group.currency} />
        </Text>
        <Stack direction="horizontal" gap={1}>
          <Text type="supporting">Median</Text>
          <Text type="supporting" color="primary" weight="semibold" hasTabularNumbers>
            <Money amountMinor={group.median_minor} currency={group.currency} />
          </Text>
        </Stack>
        <Text type="supporting" hasTabularNumbers>
          <Money amountMinor={group.max_minor} currency={group.currency} />
        </Text>
      </Stack>
    </Stack>
  )
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
    {
      key: 'payroll_cost_minor',
      header: 'Payroll cost',
      width: pixel(130),
      align: 'end',
      // The short form is easy to compare. The full amount shows on hover.
      renderCell: (group) => (
        <Tooltip content={formatMoney(group.payroll_cost_minor, reportingCurrency)}>
          <Text type="inherit" hasTabularNumbers>
            {formatMoneyShort(group.payroll_cost_minor, reportingCurrency)}
          </Text>
        </Tooltip>
      ),
    },
    {
      key: 'share',
      header: 'Share of the ACME payroll cost',
      width: proportional(2),
      renderCell: (group) => (
        <Stack direction="horizontal" gap={2} vAlign="center">
          <ProgressBar
            label={`Share of the payroll cost: ${group.label}`}
            isLabelHidden
            value={group.payroll_cost_minor}
            max={totalCostMinor}
            variant="accent"
          />
          <Text hasTabularNumbers textWrap="nowrap">
            {formatShare(group.payroll_cost_minor, totalCostMinor)}
          </Text>
        </Stack>
      ),
    },
    {
      key: 'median_minor',
      header: 'Salary: minimum, median, maximum',
      width: proportional(3),
      renderCell: (group) => <SalaryRange group={group} />,
    },
  ]

  return <DataTable rows={groups} columns={columns} idKey="key" />
}
