import { Card } from '@astryxdesign/core/Card'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  LabelList,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts'
import type { OutlierGroup, OutlierStatus } from '../../api/types'
import { ChartFigure } from '../../components'
import { useChartColors } from '../../hooks/useChartColors'
import { formatCount } from '../../lib/format'
import { outlierChartHeight } from './chartSizes'

const LABEL_WIDTH = 130
const BAR_SIZE = 20
const PART_GAP = 2
const STACK = 'outliers'

/** The signed count inside a part of a bar, as in the badges of the outlier list. A zero has no label. */
const signedLabel = (sign: '-' | '+') => (value: unknown) =>
  typeof value === 'number' && value > 0 ? `${sign}${formatCount(value)}` : ''

type Row = OutlierGroup & { outlier_count: number }

const toRows = (groups: OutlierGroup[]): Row[] =>
  groups.map((group) => ({ ...group, outlier_count: group.below_count + group.above_count }))

type OnSelect = (group: OutlierGroup, status: OutlierStatus) => void

/** One stacked bar for each group: the below-range part and the above-range part. */
export function OutlierGroupChart({
  groups,
  onSelect,
}: {
  groups: OutlierGroup[]
  onSelect: OnSelect
}) {
  return (
    <ChartFigure
      label="Outliers by group"
      height={outlierChartHeight(groups.length)}
      table={<GroupTable groups={groups} />}
    >
      <OutlierGroupBars groups={groups} onSelect={onSelect} />
    </ChartFigure>
  )
}

interface BarsProps {
  groups: OutlierGroup[]
  /** Called with the group and the status of the part that the HR Manager clicks. */
  onSelect?: OnSelect
  /** A size, when the bars are not in a `ChartFigure`: a test has no layout to measure. */
  width?: number
  height?: number
  /** False in a test: the marks of an animated chart are not in the document at once. */
  isAnimated?: boolean
}

/** The marks of the chart. `ChartFigure` gives them a size. */
export function OutlierGroupBars({
  groups,
  width,
  height,
  isAnimated = true,
  onSelect,
}: BarsProps) {
  const { below, above, onBar, ink, line, surface } = useChartColors()
  const rows = toRows(groups)
  const legendText = (name: string) => (
    <Text type="inherit" color="secondary">
      {name}
    </Text>
  )

  return (
    <BarChart
      data={rows}
      layout="vertical"
      accessibilityLayer={false}
      width={width}
      height={height}
    >
      <CartesianGrid horizontal={false} stroke={line} />
      <XAxis
        type="number"
        domain={[0, 'auto']}
        allowDecimals={false}
        tick={{ fill: ink }}
        tickLine={false}
        axisLine={{ stroke: line }}
      />
      <YAxis
        type="category"
        dataKey="label"
        width={LABEL_WIDTH}
        tick={{ fill: ink }}
        tickLine={false}
        axisLine={{ stroke: line }}
      />
      <Tooltip cursor={{ fill: line, fillOpacity: 0.4 }} content={GroupTooltip} />
      {/* The legend has the order of the parts of a bar: below range, then above range. */}
      <Legend formatter={legendText} itemSorter={(item) => (item.dataKey === 'below_count' ? 0 : 1)} />
      <Bar
        name="Below range"
        dataKey="below_count"
        stackId={STACK}
        fill={below}
        stroke={surface}
        strokeWidth={PART_GAP}
        barSize={BAR_SIZE}
        isAnimationActive={isAnimated}
        cursor={onSelect ? 'pointer' : undefined}
        onClick={(_, index) => onSelect?.(groups[index], 'below')}
      >
        <LabelList dataKey="below_count" fill={onBar} formatter={signedLabel('-')} />
      </Bar>
      <Bar
        name="Above range"
        dataKey="above_count"
        stackId={STACK}
        fill={above}
        stroke={surface}
        strokeWidth={PART_GAP}
        barSize={BAR_SIZE}
        isAnimationActive={isAnimated}
        cursor={onSelect ? 'pointer' : undefined}
        onClick={(_, index) => onSelect?.(groups[index], 'above')}
      >
        <LabelList dataKey="above_count" fill={onBar} formatter={signedLabel('+')} />
      </Bar>
    </BarChart>
  )
}

function GroupTooltip({ active, payload }: TooltipContentProps) {
  const row: Row | undefined = payload?.[0]?.payload
  if (!active || !row) {
    return null
  }
  return (
    <Card padding={3}>
      <Stack gap={1}>
        <Text type="supporting">{row.label}</Text>
        <Text>Below range: {formatCount(row.below_count)}</Text>
        <Text>Above range: {formatCount(row.above_count)}</Text>
        <Text>Headcount: {formatCount(row.headcount)}</Text>
      </Stack>
    </Card>
  )
}

function GroupTable({ groups }: { groups: OutlierGroup[] }) {
  return (
    <table>
      <caption>
        Outliers by group: the active employees below range and above range, with a salary band.
      </caption>
      <thead>
        <tr>
          <th scope="col">Group</th>
          <th scope="col">Below range</th>
          <th scope="col">Above range</th>
          <th scope="col">Outliers</th>
        </tr>
      </thead>
      <tbody>
        {groups.map((group) => (
          <tr key={group.key}>
            <th scope="row">{group.label}</th>
            <td>{formatCount(group.below_count)}</td>
            <td>{formatCount(group.above_count)}</td>
            <td>{formatCount(group.below_count + group.above_count)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
