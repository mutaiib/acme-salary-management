import { Card } from '@astryxdesign/core/Card'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts'
import type { SalaryBracket, SalaryDistribution } from '../../api/types'
import { ChartFigure } from '../../components'
import { useChartColors } from '../../hooks/useChartColors'
import { formatCount, formatMoney, formatMoneyCompact } from '../../lib/format'
import { DISTRIBUTION_CHART_HEIGHT } from './chartSizes'

const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0]
const MAX_BAR_SIZE = 48

/** One bar for each salary bracket, with a table view for a screen reader. */
export function SalaryDistributionChart({
  distribution,
  onSelect,
}: {
  distribution: SalaryDistribution
  onSelect: (bracket: SalaryBracket) => void
}) {
  const { reporting_currency: currency, brackets } = distribution
  return (
    <ChartFigure
      label="Salary distribution"
      height={DISTRIBUTION_CHART_HEIGHT}
      table={<BracketTable brackets={brackets} currency={currency} />}
    >
      <SalaryDistributionBars distribution={distribution} onSelect={onSelect} />
    </ChartFigure>
  )
}

interface BarsProps {
  distribution: SalaryDistribution
  /** Called with the salary bracket of the bar that the HR Manager clicks. */
  onSelect?: (bracket: SalaryBracket) => void
  /** A size, when the bars are not in a `ChartFigure`: a test has no layout to measure. */
  width?: number
  height?: number
  /** False in a test: the marks of an animated chart are not in the document at once. */
  isAnimated?: boolean
}

/** The marks of the chart. `ChartFigure` gives them a size. */
export function SalaryDistributionBars({
  distribution,
  width,
  height,
  isAnimated = true,
  onSelect,
}: BarsProps) {
  const { series, ink, line } = useChartColors()
  const { reporting_currency: currency, brackets } = distribution
  const bars = brackets.map((bracket) => ({
    ...bracket,
    label: formatMoneyCompact(bracket.from_minor, currency),
  }))

  return (
    <BarChart data={bars} accessibilityLayer={false} width={width} height={height}>
      <CartesianGrid vertical={false} stroke={line} />
      <XAxis dataKey="label" tick={{ fill: ink }} tickLine={false} axisLine={{ stroke: line }} />
      <YAxis
        domain={[0, 'auto']}
        allowDecimals={false}
        tick={{ fill: ink }}
        tickLine={false}
        axisLine={false}
      />
      <Tooltip
        cursor={{ fill: line, fillOpacity: 0.4 }}
        content={(props) => <BracketTooltip {...props} currency={currency} />}
      />
      <Bar
        dataKey="headcount"
        fill={series}
        radius={BAR_RADIUS}
        maxBarSize={MAX_BAR_SIZE}
        isAnimationActive={isAnimated}
        cursor={onSelect ? 'pointer' : undefined}
        onClick={(_, index) => onSelect?.(brackets[index])}
      />
    </BarChart>
  )
}

function bracketName(bracket: SalaryBracket, currency: string): string {
  return `From ${formatMoney(bracket.from_minor, currency)} to ${formatMoney(bracket.to_minor, currency)}`
}

function BracketTooltip({
  active,
  payload,
  currency,
}: TooltipContentProps & { currency: string }) {
  const bracket: SalaryBracket | undefined = payload?.[0]?.payload
  if (!active || !bracket) {
    return null
  }
  return (
    <Card padding={3}>
      <Stack gap={1}>
        <Text type="supporting">{bracketName(bracket, currency)}</Text>
        <Text>Headcount: {formatCount(bracket.headcount)}</Text>
      </Stack>
    </Card>
  )
}

function BracketTable({ brackets, currency }: { brackets: SalaryBracket[]; currency: string }) {
  return (
    <table>
      <caption>
        Salary distribution: the headcount of the active employees in each salary bracket. The
        salaries are for one year, in {currency}.
      </caption>
      <thead>
        <tr>
          <th scope="col">Salary bracket</th>
          <th scope="col">Headcount</th>
        </tr>
      </thead>
      <tbody>
        {brackets.map((bracket) => (
          <tr key={bracket.from_minor}>
            <th scope="row">{bracketName(bracket, currency)}</th>
            <td>{formatCount(bracket.headcount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
