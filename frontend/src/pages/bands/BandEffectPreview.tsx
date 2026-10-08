import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { previewBandChange } from '../../api/bands'
import type { Band, BandRequest } from '../../api/types'
import { LoadingMark } from '../../components'
import { useApi } from '../../hooks/useApi'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { formatCount, formatMoney, formatSignedMoney } from '../../lib/format'

/** The pause after the last key, before the preview request. */
const PAUSE_MS = 300

function isBandAmounts(band: Band, amounts: BandRequest): boolean {
  return (
    amounts.min_minor === band.min_minor &&
    amounts.mid_minor === band.mid_minor &&
    amounts.max_minor === band.max_minor
  )
}

interface FigureProps {
  label: string
  current: number
  proposed: number
  format: (value: number) => string
  formatDifference: (difference: number) => string
}

/** One figure. A figure that does not change shows one value. */
function Figure({ label, current, proposed, format, formatDifference }: FigureProps) {
  return (
    <Stack direction="horizontal" gap={2} vAlign="center" hAlign="between">
      <Text type="supporting">{label}</Text>
      {current === proposed ? (
        <Text hasTabularNumbers>{format(current)}</Text>
      ) : (
        <Stack direction="horizontal" gap={2} vAlign="center">
          <Text hasTabularNumbers>
            {format(current)} to {format(proposed)}
          </Text>
          <Text type="supporting" hasTabularNumbers>
            {formatDifference(proposed - current)}
          </Text>
        </Stack>
      )}
    </Stack>
  )
}

const signedCount = (difference: number) =>
  `${difference > 0 ? '+' : '-'}${formatCount(Math.abs(difference))}`

/**
 * The effect of the amounts on the employees of the band, after the HR Manager stops typing.
 * A band that is not valid shows a hint, not an error. Another failure says that the effect
 * did not load.
 */
export function BandEffectPreview({ band, amounts }: { band: Band; amounts: BandRequest }) {
  const pausedAmounts = useDebouncedValue(amounts, PAUSE_MS)
  const isChanged = !isBandAmounts(band, pausedAmounts)
  const preview = useApi(
    () => (isChanged ? previewBandChange(band.id, pausedAmounts) : Promise.resolve(undefined)),
    [band.id, pausedAmounts.min_minor, pausedAmounts.mid_minor, pausedAmounts.max_minor],
  )

  if (!isChanged) return null
  if (preview.error) {
    // The API refuses a band that is not valid with the status 422. The save shows the cause.
    const hint =
      preview.error.status === 422
        ? 'Give a valid band to see the effect.'
        : 'The effect did not load.'
    return <Text type="supporting">{hint}</Text>
  }
  if (!preview.data) return <LoadingMark isLoading={preview.isLoading} />
  const { current, proposed, reporting_currency: currency } = preview.data
  return (
    <Stack gap={1} aria-live="polite">
      <Text weight="semibold">Effect on the employees of this band</Text>
      <Figure
        label="Below range"
        current={current.below_count}
        proposed={proposed.below_count}
        format={formatCount}
        formatDifference={signedCount}
      />
      <Figure
        label="Above range"
        current={current.above_count}
        proposed={proposed.above_count}
        format={formatCount}
        formatDifference={signedCount}
      />
      <Figure
        label="Correction cost, for one year"
        current={current.correction_cost_minor}
        proposed={proposed.correction_cost_minor}
        format={(value) => formatMoney(value, currency)}
        formatDifference={(difference) => formatSignedMoney(difference, currency)}
      />
    </Stack>
  )
}
