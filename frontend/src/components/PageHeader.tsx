import { Heading } from '@astryxdesign/core/Heading'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import type { ReactNode } from 'react'

interface Props {
  title: string
  description?: string
  /** Buttons for the screen, shown at the end of the title row. */
  actions?: ReactNode
}

/** The title block at the top of each screen. It renders the one `h1` of the screen. */
export function PageHeader({ title, description, actions }: Props) {
  return (
    <Stack direction="horizontal" hAlign="between" vAlign="end" gap={4} wrap="wrap">
      <Stack gap={1}>
        <Heading level={1}>{title}</Heading>
        {description && <Text type="supporting">{description}</Text>}
      </Stack>
      {actions}
    </Stack>
  )
}
