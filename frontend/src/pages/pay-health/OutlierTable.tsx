import { Icon } from '@astryxdesign/core/Icon'
import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { Stack } from '@astryxdesign/core/Stack'
import { pixel, proportional, type TableColumn } from '@astryxdesign/core/Table'
import { Text } from '@astryxdesign/core/Text'
import type { Meta, Outlier, OutlierStatus } from '../../api/types'
import {
  DataTable,
  EmployeeLink,
  jobLevelColumn,
  Money,
  moneyColumn,
  type TableRow,
} from '../../components'
import { countryNameOf } from '../../hooks/useMeta'

// Without a status, the list has the two kinds of outlier, so the headers name the two.
const LIMIT_HEADER = { all: 'Band limit', below: 'Band minimum', above: 'Band maximum' }
const DIFFERENCE_HEADER = { all: 'Outside by', below: 'Below by', above: 'Above by' }
const STATUS_TEXT: Record<OutlierStatus, string> = {
  below: 'Below range',
  above: 'Above range',
}

// A full bar is a difference of this part of the band limit. All pages use the same scale.
const FULL_BAR_SHARE = 0.25

interface Props {
  /** The status of the list. Without a status, the list has all outliers. */
  status: OutlierStatus | undefined
  outliers: Outlier[]
  /** The fixed values, for the name of each country. */
  meta: Meta | undefined
}

/** The part of the band limit that the difference is. It compares rows of different currencies. */
function differenceShare(outlier: Outlier): number {
  return outlier.difference_minor / outlier.band_limit_minor
}

export function OutlierTable({ status, outliers, meta }: Props) {
  const list = status ?? 'all'

  const columns: TableColumn<TableRow<Outlier>>[] = [
    {
      key: 'full_name',
      header: 'Employee',
      width: proportional(3),
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
      width: pixel(140),
      renderCell: (outlier) => countryNameOf(meta, outlier.country),
    },
    {
      key: 'range_status',
      header: 'Range status',
      width: pixel(140),
      renderCell: (outlier) => (
        <Stack direction="horizontal" gap={1} vAlign="center">
          <Icon icon={outlier.range_status === 'below' ? 'arrowDown' : 'arrowUp'} size="sm" />
          <Text type="inherit" textWrap="nowrap">
            {STATUS_TEXT[outlier.range_status]}
          </Text>
        </Stack>
      ),
    },
    moneyColumn<Outlier>('salary_minor', 'Salary'),
    moneyColumn<Outlier>('band_limit_minor', LIMIT_HEADER[list]),
    {
      key: 'difference_minor',
      header: DIFFERENCE_HEADER[list],
      width: proportional(2),
      renderCell: (outlier) => (
        <Stack direction="horizontal" gap={3} vAlign="center">
          <ProgressBar
            label={`${DIFFERENCE_HEADER[list]}: ${outlier.full_name}`}
            isLabelHidden
            value={Math.min(differenceShare(outlier), FULL_BAR_SHARE)}
            max={FULL_BAR_SHARE}
            variant="warning"
          />
          <Text weight="semibold" hasTabularNumbers textWrap="nowrap">
            <Money amountMinor={outlier.difference_minor} currency={outlier.currency} />
          </Text>
        </Stack>
      ),
    },
  ]

  return <DataTable rows={outliers} columns={columns} idKey="id" hasHover />
}
