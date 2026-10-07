import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import type { Band } from '../../api/types'
import { formatMoney } from '../../lib/format'
import { positionOnBand } from '../../lib/ranges'

interface Props {
  band: Band
  salaryMinor: number
}

/**
 * A salary band as a bar from the minimum to the maximum. The fill ends at the salary.
 * A salary outside the band stays at the end of the bar. The three amounts below the bar
 * name its points; a mark on the fill looked like a break in the bar.
 */
export function RangeBar({ band, salaryMinor }: Props) {
  const isOutside = salaryMinor < band.min_minor || salaryMinor > band.max_minor
  const money = (amountMinor: number) => formatMoney(amountMinor, band.currency)

  return (
    <Stack gap={1}>
      <ProgressBar
        label={`Position of the salary ${money(salaryMinor)} in the salary band`}
        isLabelHidden
        value={positionOnBand(salaryMinor, band)}
        max={100}
        variant={isOutside ? 'warning' : 'accent'}
      />
      <Stack direction="horizontal" hAlign="between">
        <BandPoint name="Minimum" amount={money(band.min_minor)} />
        <BandPoint name="Midpoint" amount={money(band.mid_minor)} />
        <BandPoint name="Maximum" amount={money(band.max_minor)} />
      </Stack>
    </Stack>
  )
}

function BandPoint({ name, amount }: { name: string; amount: string }) {
  return (
    <Stack gap={0}>
      <Text type="supporting">{name}</Text>
      <Text hasTabularNumbers>{amount}</Text>
    </Stack>
  )
}
