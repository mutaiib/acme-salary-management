export const DISTRIBUTION_CHART_HEIGHT = 280

// The height of the slot of one bar of the outliers chart: the bar and the space around it.
const GROUP_BAR_SLOT_HEIGHT = 36
// The height of the x-axis and the legend of the outliers chart, below the bars.
const GROUP_CHART_AXIS_HEIGHT = 72

/** The height of the outliers chart for a number of groups. */
export const outlierChartHeight = (groupCount: number) =>
  GROUP_CHART_AXIS_HEIGHT + GROUP_BAR_SLOT_HEIGHT * groupCount
