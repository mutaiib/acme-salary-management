import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { useId } from 'react'

interface Props {
  label: string
  value: string
  /** A short note below the value, for example the unit or the date. */
  note?: string
  /** `lg` is for a headline figure. `md` is for a figure in a section. */
  size?: 'lg' | 'md'
  /** A test finds the value with this id. */
  testId?: string
}

/**
 * One figure with its label. The label names the group, so a screen reader
 * says the label with the value.
 */
export function Stat({ label, value, note, size = 'lg', testId }: Props) {
  const labelId = useId()
  return (
    <Stack gap={1} role="group" aria-labelledby={labelId}>
      <Text type="label" color="secondary" id={labelId}>
        {label}
      </Text>
      {size === 'lg' ? (
        <Text type="display-3" hasTabularNumbers data-testid={testId}>
          {value}
        </Text>
      ) : (
        <Text type="large" weight="semibold" hasTabularNumbers data-testid={testId}>
          {value}
        </Text>
      )}
      {note && <Text type="supporting">{note}</Text>}
    </Stack>
  )
}
