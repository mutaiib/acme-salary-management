import { useTheme } from '@astryxdesign/core/theme'

export interface ChartColors {
  /** The color of a chart with one series. */
  series: string
  /** The color of the below-range part of a bar. */
  below: string
  /** The color of the above-range part of a bar. */
  above: string
  /** The color of text on the below-range part or the above-range part of a bar. */
  onBar: string
  /** The color of axis text and labels. */
  ink: string
  /** The color of the grid lines and the axes. */
  line: string
  /** The color of the surface of a card, for the gap between two parts of a bar. */
  surface: string
}

/** The colors of a chart, from the tokens of the Astryx theme. */
export function useChartColors(): ChartColors {
  const { token } = useTheme()
  return {
    series: token('--color-data-categorical-blue'),
    below: token('--color-data-categorical-red'),
    above: token('--color-data-categorical-green'),
    onBar: token('--color-on-dark'),
    ink: token('--color-text-secondary'),
    line: token('--color-border'),
    surface: token('--color-background-surface'),
  }
}
