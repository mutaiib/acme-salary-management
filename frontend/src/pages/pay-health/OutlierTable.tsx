import { Badge } from '@astryxdesign/core/Badge'
import { Stack } from '@astryxdesign/core/Stack'
import { pixel, proportional, type TableColumn } from '@astryxdesign/core/Table'
import { Text } from '@astryxdesign/core/Text'
import type { Meta, Outlier, OutlierStatus } from '../../api/types'
import { DataTable, EmployeeLink, jobLevelColumn, moneyColumn, type TableRow } from '../../components'
import { countryNameOf } from '../../hooks/useMeta'
import { formatMoney, formatShare } from '../../lib/format'

// Without a status, the list has the two kinds of outlier, so the headers name the two.
const LIMIT_HEADER = { all: 'Band limit', below: 'Band minimum', above: 'Band maximum' }
const DIFFERENCE_HEADER = { all: 'Outside by', below: 'Below by', above: 'Above by' }
// The range status, in words, after the share of the band limit.
const STATUS_TEXT: Record<OutlierStatus, string> = {
  below: 'below the band minimum',
  above: 'above the band maximum',
}

interface Props {
  /** The status of the list. Without a status, the list has all outliers. */
  status: OutlierStatus | undefined
  outliers: Outlier[]
  /** The fixed values, for the name of each country. */
  meta: Meta | undefined
}

function DifferenceBadge({ outlier }: { outlier: Outlier }) {
  const isBelow = outlier.range_status === 'below'
  const amount = formatMoney(outlier.difference_minor, outlier.currency)
  return <Badge variant={isBelow ? 'red' : 'green'} label={`${isBelow ? '-' : '+'}${amount}`} />
}

export function OutlierTable({ status, outliers, meta }: Props) {
  const list = status ?? 'all'

  const columns: TableColumn<TableRow<Outlier>>[] = [
    {
      key: 'full_name',
      header: 'Employee',
      width: proportional(2),
      renderCell: (outlier) => (
        <Stack gap={0}>
          <EmployeeLink id={outlier.id} name={outlier.full_name} />
          <Text type="supporting">{outlier.job_title}</Text>
        </Stack>
      ),
    },
    jobLevelColumn<Outlier>(),
    {
      key: 'country',
      header: 'Country',
      width: pixel(130),
      renderCell: (outlier) => countryNameOf(meta, outlier.country),
    },
    moneyColumn<Outlier>('salary_minor', 'Salary'),
    moneyColumn<Outlier>('band_limit_minor', LIMIT_HEADER[list]),
    {
      key: 'difference_minor',
      header: DIFFERENCE_HEADER[list],
      width: pixel(220),
      align: 'end',
      // A below-range salary is red with a minus, an above-range salary green with a plus.
      // The share of the band limit compares rows of different currencies, and names the status.
      renderCell: (outlier) => (
        <Stack gap={1} hAlign="end" paddingBlock={1}>
          <DifferenceBadge outlier={outlier} />
          <Text type="supporting" textWrap="nowrap">
            {formatShare(outlier.difference_minor, outlier.band_limit_minor)}{' '}
            {STATUS_TEXT[outlier.range_status]}
          </Text>
        </Stack>
      ),
    },
  ]

  return <DataTable rows={outliers} columns={columns} idKey="id" hasHover />
}
