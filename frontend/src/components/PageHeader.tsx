import { Heading } from '@astryxdesign/core/Heading'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import type { ReactNode } from 'react'

interface Props {
  title: string
  description?: string
  /** A picture before the title, for example the avatar of an employee. */
  start?: ReactNode
  /** A short status after the title, for example a badge. */
  status?: ReactNode
  /** Buttons for the screen, shown at the end of the title row. */
  actions?: ReactNode
}

/** The title block at the top of each screen. It renders the one `h1` of the screen. */
export function PageHeader({ title, description, start, status, actions }: Props) {
  return (
    <Stack direction="horizontal" hAlign="between" vAlign="end" gap={4} wrap="wrap">
      <Stack direction="horizontal" gap={3} vAlign="center">
        {start}
        <Stack gap={1}>
          <Stack direction="horizontal" gap={2} vAlign="center">
            <Heading level={1}>{title}</Heading>
            {status}
          </Stack>
          {description && <Text color="secondary">{description}</Text>}
        </Stack>
      </Stack>
      {actions}
    </Stack>
  )
}
