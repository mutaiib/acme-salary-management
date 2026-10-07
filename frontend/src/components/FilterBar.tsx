import { Stack } from '@astryxdesign/core/Stack'
import type { ReactNode } from 'react'

/** A row of search and filter controls above a table. The controls wrap on a narrow screen. */
export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <Stack direction="horizontal" gap={3} wrap="wrap" vAlign="end" role="search">
      {children}
    </Stack>
  )
}
