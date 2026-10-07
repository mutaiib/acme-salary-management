import { Stack } from '@astryxdesign/core/Stack'
import { Tab, TabList } from '@astryxdesign/core/TabList'
import { getPayHealth, listOutliers } from '../../api/insights'
import type { OutlierStatus } from '../../api/types'
import {
  CountryFilter,
  DataState,
  FilterBar,
  JobLevelFilter,
  ListPagination,
  PageHeader,
  StatCard,
  StatRow,
} from '../../components'
import { useApi } from '../../hooks/useApi'
import { useMeta } from '../../hooks/useMeta'
import { useUrlFilters } from '../../hooks/useUrlFilters'
import { formatCount, formatMoney } from '../../lib/format'
import { OutlierTable } from './OutlierTable'

const EMPTY_TITLE: Record<OutlierStatus, string> = {
  below: 'No employee is below range',
  above: 'No employee is above range',
}

export function PayHealthPage() {
  const meta = useMeta()
  const { filter, setFilter, page, setPage } = useUrlFilters()
  const status: OutlierStatus = filter('status') === 'above' ? 'above' : 'below'
  const country = filter('country')
  const jobLevel = filter('job_level')

  const summary = useApi(getPayHealth, [])
  const outliers = useApi(
    () => listOutliers({ status, country, job_level: jobLevel, page }),
    [status, country, jobLevel, page],
  )

  return (
    <Stack gap={5} padding={6}>
      <PageHeader
        title="Pay health"
        description="The employees who have a salary outside the salary band for their job."
      />
      <DataState state={summary}>
        {(data) => (
          <StatRow>
            <StatCard
              label="Below range"
              value={formatCount(data.below_count)}
              hint="Salary under the band minimum"
              testId="below-count"
            />
            <StatCard
              label="Above range"
              value={formatCount(data.above_count)}
              hint="Salary over the band maximum"
              testId="above-count"
            />
            <StatCard
              label="Correction cost"
              value={formatMoney(data.correction_cost_minor, data.reporting_currency)}
              hint="To move all below-range salaries to the band minimum, for one year"
              testId="correction-cost"
            />
          </StatRow>
        )}
      </DataState>
      <Stack gap={3}>
        <TabList
          value={status}
          onChange={(value) => setFilter('status', value)}
          role="tablist"
          hasDivider
        >
          <Tab value="below" label="Below range" />
          <Tab value="above" label="Above range" />
        </TabList>
        <FilterBar>
          <CountryFilter
            meta={meta}
            value={country}
            onChange={(value) => setFilter('country', value)}
          />
          <JobLevelFilter
            meta={meta}
            value={jobLevel}
            onChange={(value) => setFilter('job_level', value)}
          />
        </FilterBar>
        <DataState
          state={outliers}
          isEmpty={(data) => data.items.length === 0}
          emptyTitle={EMPTY_TITLE[status]}
          emptyDescription="Each salary in this selection is in the salary band."
        >
          {(data) => (
            <Stack gap={3}>
              <OutlierTable status={status} outliers={data.items} />
              <ListPagination page={data} onChange={setPage} label="Outlier pages" />
            </Stack>
          )}
        </DataState>
      </Stack>
    </Stack>
  )
}
