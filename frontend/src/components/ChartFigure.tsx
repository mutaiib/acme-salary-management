import { Stack } from '@astryxdesign/core/Stack'
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden'
import type { ReactElement, ReactNode } from 'react'
import { ResponsiveContainer } from 'recharts'

interface ChartFigureProps {
  /** The name of the chart, for a screen reader. */
  label: string
  height: number
  /** The marks of the chart. A screen reader does not read them. */
  children: ReactElement
  /** The same values as a table. A screen reader reads it. */
  table: ReactNode
}

/** The frame of a chart: the marks are hidden from a screen reader, and the table view is not. */
export function ChartFigure({ label, height, children, table }: ChartFigureProps) {
  return (
    <Stack role="group" aria-label={label}>
      <Stack aria-hidden="true" data-testid="chart-figure" height={height}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </Stack>
      <VisuallyHidden as="div">{table}</VisuallyHidden>
    </Stack>
  )
}
