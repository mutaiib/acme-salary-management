import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Tooltip } from '@astryxdesign/core/Tooltip'
import { useId } from 'react'
import { TermHelp } from './TermHelp'

interface Props {
  label: string
  value: string
  /** The value with all its digits, when `value` is a short form. It shows on hover. */
  fullValue?: string
  /** A short note below the value, for example the unit or the date. */
  note?: string
  /** The explanation of the figure. It opens from an info button beside the label. */
  help?: string
  /** `lg` is for a headline figure. `md` is for a figure in a section. */
  size?: 'lg' | 'md'
  /** A test finds the value with this id. */
  testId?: string
}

/**
 * One figure with its label. The label names the group, so a screen reader
 * says the label with the value.
 */
export function Stat({ label, value, fullValue, note, help, size = 'lg', testId }: Props) {
  const labelId = useId()
  const figure =
    size === 'lg' ? (
      <Text type="display-3" hasTabularNumbers data-testid={testId}>
        {value}
      </Text>
    ) : (
      <Text type="large" weight="semibold" hasTabularNumbers data-testid={testId}>
        {value}
      </Text>
    )
  return (
    <Stack gap={1} role="group" aria-labelledby={labelId}>
      <Stack direction="horizontal" gap={1} vAlign="center">
        <Text type="label" color="secondary" id={labelId}>
          {label}
        </Text>
        {help && <TermHelp term={label} text={help} />}
      </Stack>
      {fullValue ? (
        <Tooltip content={fullValue} placement="below" alignment="start">
          {figure}
        </Tooltip>
      ) : (
        figure
      )}
      {note && <Text type="supporting">{note}</Text>}
    </Stack>
  )
}
