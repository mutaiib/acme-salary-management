import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { useLocation, useNavigate } from 'react-router-dom'
import { getSalaryDistribution } from '../../api/insights'
import { DataState, Panel } from '../../components'
import { useApi } from '../../hooks/useApi'
import { bracketHref } from '../../lib/chartLinks'
import { formatMoney } from '../../lib/format'
import { DISTRIBUTION_HEIGHT } from './loadingHeights'
import { SalaryDistributionChart } from './SalaryDistributionChart'

export function SalaryDistributionPanel() {
  const distribution = useApi(getSalaryDistribution, [])
  const navigate = useNavigate()
  // The list goes back to this address, with the tab and the filters that the chart has now.
  const { pathname, search } = useLocation()
  return (
    <Panel title="Salary distribution">
      <DataState
        state={distribution}
        loadingHeight={DISTRIBUTION_HEIGHT}
        isEmpty={(data) => data.brackets.length === 0}
        emptyTitle="No salaries to show"
        emptyDescription="The active employees have no salary in the reporting currency."
      >
        {(data) => (
          <Stack gap={3}>
            <Text type="supporting">
              The headcount of the active employees in each salary bracket of{' '}
              {formatMoney(data.bracket_width_minor, data.reporting_currency)}. The salaries are
              for one year, in {data.reporting_currency}. The label of a bar is the start of its
              bracket. Select a bar to see its employees.
            </Text>
            <SalaryDistributionChart
              distribution={data}
              onSelect={(bracket) => navigate(bracketHref(bracket, pathname + search))}
            />
          </Stack>
        )}
      </DataState>
    </Panel>
  )
}
