import { Card } from '@astryxdesign/core/Card'
import { Heading } from '@astryxdesign/core/Heading'
import { Stack } from '@astryxdesign/core/Stack'
import type { ReactNode } from 'react'

interface Props {
  /** The title of the section. It is also the accessible name of the region. */
  title: string
  /** A short note or the controls of the section, shown at the end of the title row. */
  end?: ReactNode
  children: ReactNode
  /** A test finds the section with this id. */
  testId?: string
}

/** One section of a screen in a card: a title row, then the content. */
export function Panel({ title, end, children, testId }: Props) {
  return (
    <Card padding={5}>
      <Stack gap={5} role="region" aria-label={title} data-testid={testId}>
        <Stack direction="horizontal" hAlign="between" vAlign="center" gap={3} wrap="wrap">
          <Heading level={2}>{title}</Heading>
          {end}
        </Stack>
        {children}
      </Stack>
    </Card>
  )
}
