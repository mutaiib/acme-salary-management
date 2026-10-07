import { Badge } from '@astryxdesign/core/Badge'
import { Stack } from '@astryxdesign/core/Stack'
import { pixel, proportional, type TableColumn } from '@astryxdesign/core/Table'
import { Text } from '@astryxdesign/core/Text'
import type { Gap } from '../../api/types'
import { DataTable, type TableRow } from '../../components'
import { formatCount, formatGap } from '../../lib/format'

export const NOT_ENOUGH_DATA = 'Not enough data'

/** One gap figure. A negative gap also says in words who has the higher pay. */
function GapValue({ gapPct }: { gapPct: number }) {
  return (
    <Stack direction="horizontal" gap={2} hAlign="end" vAlign="center">
      {gapPct < 0 && <Text type="supporting">Women higher</Text>}
      <Text type="inherit" hasTabularNumbers>
        {formatGap(gapPct)}
      </Text>
    </Stack>
  )
}

function countColumn(key: 'men' | 'women', header: string): TableColumn<TableRow<Gap>> {
  return {
    key,
    header,
    width: pixel(100),
    align: 'end',
    renderCell: (gap) => formatCount(gap[key]),
  }
}

function gapColumns(flagThresholdPct: number): TableColumn<TableRow<Gap>>[] {
  return [
    { key: 'label', header: 'Country', width: proportional(2) },
    countColumn('men', 'Men'),
    countColumn('women', 'Women'),
    {
      key: 'mean_gap_pct',
      header: 'Mean gap',
      width: proportional(1),
      align: 'end',
      // A group that is too small shows the cause one time, in this column.
      renderCell: (gap) =>
        gap.mean_gap_pct === null ? (
          <Text type="supporting">{NOT_ENOUGH_DATA}</Text>
        ) : (
          <GapValue gapPct={gap.mean_gap_pct} />
        ),
    },
    {
      key: 'median_gap_pct',
      header: 'Median gap',
      width: proportional(1),
      align: 'end',
      renderCell: (gap) =>
        gap.median_gap_pct === null ? null : <GapValue gapPct={gap.median_gap_pct} />,
    },
    {
      key: 'is_flagged',
      header: 'Flag',
      width: pixel(140),
      renderCell: (gap) =>
        gap.is_flagged ? <Badge variant="warning" label={`Above ${flagThresholdPct}%`} /> : null,
    },
  ]
}

interface Props {
  countries: Gap[]
  flagThresholdPct: number
}

/** The gender pay gap of each country. */
export function GapTable({ countries, flagThresholdPct }: Props) {
  return <DataTable rows={countries} columns={gapColumns(flagThresholdPct)} idKey="key" />
}
