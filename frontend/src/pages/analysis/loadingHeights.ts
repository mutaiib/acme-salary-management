import { loadingRowsHeight } from '../../components'
import { DISTRIBUTION_CHART_HEIGHT, outlierChartHeight } from './chartSizes'

// The supporting text above a chart and the gap below it, from a measurement in a browser
// at a width of 1,900 px. A narrow window wraps the text, and the height then differs a little.
const TEXT_AND_GAP = 32
// The supporting text above the table of the highest salaries, and the header row of the table.
const TEXT_AND_HEADER = 86
// The first load of the outliers chart has no groups to count. A country grouping has 8.
const FIRST_LOAD_GROUPS = 8
const HIGHEST_SALARY_ROWS = 10

/** The height of each section of Pay analysis, so a tab keeps its height while it loads. */
export const DISTRIBUTION_HEIGHT = TEXT_AND_GAP + DISTRIBUTION_CHART_HEIGHT
export const OUTLIERS_HEIGHT = TEXT_AND_GAP + outlierChartHeight(FIRST_LOAD_GROUPS)
export const HIGHEST_SALARIES_HEIGHT = TEXT_AND_HEADER + loadingRowsHeight(HIGHEST_SALARY_ROWS)
