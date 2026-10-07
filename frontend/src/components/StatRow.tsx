import { Grid } from '@astryxdesign/core/Grid'
import type { ReactNode } from 'react'

/** A row of stat cards. The cards wrap to the next line on a narrow screen. */
export function StatRow({ children }: { children: ReactNode }) {
  return (
    <Grid columns={{ minWidth: 220, max: 4 }} gap={4}>
      {children}
    </Grid>
  )
}
