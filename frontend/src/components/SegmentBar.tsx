import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { Stack } from '@astryxdesign/core/Stack'

type Variant = 'accent' | 'neutral' | 'warning'

interface Props {
  /** The meaning of the bar in words, for a screen reader. */
  label: string
  /** The start and the end of the segment, on the scale from 0 to `max`. */
  from: number
  to: number
  max: number
  variant?: Variant
}

/**
 * A bar with a segment that can start after zero, for example a salary band on the
 * scale of a country. It puts Astryx progress bars end to end: an empty one, a full
 * one for the segment, and an empty one. A screen reader gets the segment only.
 */
export function SegmentBar({ label, from, to, max, variant = 'accent' }: Props) {
  const start = Math.min(Math.max(from, 0), max)
  const end = Math.min(Math.max(to, start), max)
  const share = (amount: number) => `${(amount / max) * 100}%`

  return (
    <Stack direction="horizontal" gap={0} width="100%" vAlign="center">
      {start > 0 && (
        <Stack width={share(start)} aria-hidden="true">
          <ProgressBar label="" isLabelHidden value={0} variant="neutral" />
        </Stack>
      )}
      {end > start && (
        <Stack width={share(end - start)}>
          <ProgressBar
            label={label}
            isLabelHidden
            value={end - start}
            max={end - start}
            variant={variant}
          />
        </Stack>
      )}
      {end < max && (
        <Stack width={share(max - end)} aria-hidden="true">
          <ProgressBar label="" isLabelHidden value={0} variant="neutral" />
        </Stack>
      )}
    </Stack>
  )
}
