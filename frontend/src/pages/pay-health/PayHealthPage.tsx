import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl'
import { Stack } from '@astryxdesign/core/Stack'
import { useSearchParams } from 'react-router-dom'
import { getPayHealth, listOutliers } from '../../api/insights'
import type { OutlierStatus } from '../../api/types'
import {
  BackLink,
  CountryFilter,
  DataState,
  DepartmentFilter,
  FilterBar,
  JobLevelFilter,
  ListPagination,
  MetaBanner,
  PageHeader,
  Panel,
  SearchBox,
  StatCard,
  StatRow,
} from '../../components'
import { useApi } from '../../hooks/useApi'
import { useMeta } from '../../hooks/useMeta'
import { useUrlFilters } from '../../hooks/useUrlFilters'
import { listBack } from '../../lib/backLinks'
import { formatCount, formatMoney, formatMoneyShort, formatShare } from '../../lib/format'
import { OutlierTable } from './OutlierTable'

// The value `all` puts no status in the address.
const ALL = 'all'
type ListStatus = OutlierStatus | typeof ALL

const LISTS: Record<ListStatus, { option: string; title: string; emptyTitle: string }> = {
  all: {
    option: 'All',
    title: 'Employees outside the salary band',
    emptyTitle: 'No employee is outside the salary band',
  },
  below: {
    option: 'Below range',
    title: 'Employees below range',
    emptyTitle: 'No employee is below range',
  },
  above: {
    option: 'Above range',
    title: 'Employees above range',
    emptyTitle: 'No employee is above range',
  },
}

function listStatusFrom(text: string): ListStatus {
  return text === 'below' || text === 'above' ? text : ALL
}

const OUTLIER_TABLE_ROW_HEIGHT = 61

export function PayHealthPage() {
  const meta = useMeta()
  const { filter, setFilter, page, setPage, pageSize, setPageSize } = useUrlFilters()
  const listStatus = listStatusFrom(filter('status'))
  const status = listStatus === ALL ? undefined : listStatus
  const country = filter('country')
  const department = filter('department')
  const jobLevel = filter('job_level')
  const search = filter('search')
  // Another screen can put its address in the list, so the list can go back to it.
  const [params] = useSearchParams()
  const back = listBack(params)

  const summary = useApi(getPayHealth, [])
  const outliers = useApi(
    () =>
      listOutliers({
        status,
        country,
        department,
        job_level: jobLevel,
        search,
        page,
        page_size: pageSize,
      }),
    [status, country, department, jobLevel, search, page, pageSize],
  )

  return (
    <Stack gap={5} padding={6}>
      {back && <BackLink href={back.href} label={back.label} />}
      <PageHeader
        title="Pay health"
        description="The employees who have a salary outside the salary band for their job. Each amount is for one year."
      />
      <MetaBanner state={meta} />
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
              value={formatMoneyShort(data.correction_cost_minor, data.reporting_currency)}
              fullValue={formatMoney(data.correction_cost_minor, data.reporting_currency)}
              hint={`For one year. ${formatShare(data.correction_cost_minor, data.payroll_cost_minor, 2)} of the payroll cost.`}
              help="The correction cost moves all below-range salaries to the band minimum."
              testId="correction-cost"
            />
          </StatRow>
        )}
      </DataState>
      <Panel
        title={LISTS[listStatus].title}
        end={
          <SegmentedControl
            label="Range status"
            size="sm"
            value={listStatus}
            onChange={(value) => setFilter('status', value === ALL ? '' : value)}
          >
            {(Object.keys(LISTS) as ListStatus[]).map((value) => (
              <SegmentedControlItem key={value} value={value} label={LISTS[value].option} />
            ))}
          </SegmentedControl>
        }
      >
        <FilterBar>
          <SearchBox applied={search} onApply={(text) => setFilter('search', text)} />
          <CountryFilter
            meta={meta.data}
            value={country}
            onChange={(value) => setFilter('country', value)}
          />
          <DepartmentFilter
            meta={meta.data}
            value={department}
            onChange={(value) => setFilter('department', value)}
          />
          <JobLevelFilter
            meta={meta.data}
            value={jobLevel}
            onChange={(value) => setFilter('job_level', value)}
          />
        </FilterBar>
        <DataState
          state={outliers}
          rowsOf={(data) => data.items.length}
          // A row of this list has 2 lines. A check in a browser gave 53 px for one row.
          rowHeight={OUTLIER_TABLE_ROW_HEIGHT}
          isEmpty={(data) => data.items.length === 0}
          emptyTitle={LISTS[listStatus].emptyTitle}
          emptyDescription="Each salary in this selection is in the salary band."
        >
          {(data) => (
            <>
              <OutlierTable status={status} outliers={data.items} meta={meta.data} />
              <ListPagination
                page={data}
                onChange={setPage}
                onPageSizeChange={setPageSize}
                label="Outlier pages"
              />
            </>
          )}
        </DataState>
      </Panel>
    </Stack>
  )
}
