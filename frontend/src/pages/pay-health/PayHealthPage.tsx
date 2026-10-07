import { Pagination } from '@astryxdesign/core/Pagination'
import { Stack } from '@astryxdesign/core/Stack'
import { Tab, TabList } from '@astryxdesign/core/TabList'
import { useSearchParams } from 'react-router-dom'
import { getPayHealth, listOutliers } from '../../api/insights'
import type { OutlierStatus } from '../../api/types'
import {
  DataState,
  FilterBar,
  FilterSelect,
  PageHeader,
  StatCard,
  StatRow,
} from '../../components'
import { useApi } from '../../hooks/useApi'
import { useMeta } from '../../hooks/useMeta'
import { formatCount, formatMoney } from '../../lib/format'
import { OutlierTable } from './OutlierTable'

const EMPTY_TITLE: Record<OutlierStatus, string> = {
  below: 'No employee is below range',
  above: 'No employee is above range',
}

export function PayHealthPage() {
  const meta = useMeta()
  const [params, setParams] = useSearchParams()
  const status: OutlierStatus = params.get('status') === 'above' ? 'above' : 'below'
  const country = params.get('country') ?? ''
  const jobLevel = params.get('job_level') ?? ''
  const page = Number(params.get('page')) || 1

  const summary = useApi(getPayHealth, [])
  const outliers = useApi(
    () => listOutliers({ status, country, job_level: jobLevel, page }),
    [status, country, jobLevel, page],
  )

  /** Sets one value in the address. A new filter starts at the first page. */
  function setParam(name: string, value: string) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) {
          next.set(name, value)
        } else {
          next.delete(name)
        }
        if (name !== 'page') {
          next.delete('page')
        }
        return next
      },
      { replace: name !== 'page' },
    )
  }

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
          onChange={(value) => setParam('status', value)}
          role="tablist"
          hasDivider
        >
          <Tab value="below" label="Below range" />
          <Tab value="above" label="Above range" />
        </TabList>
        <FilterBar>
          <FilterSelect
            label="Country"
            value={country}
            onChange={(value) => setParam('country', value)}
            options={(meta?.countries ?? []).map((c) => ({ value: c.code, label: c.name }))}
          />
          <FilterSelect
            label="Job level"
            value={jobLevel}
            onChange={(value) => setParam('job_level', value)}
            options={(meta?.job_levels ?? []).map((l) => ({ value: String(l), label: `Level ${l}` }))}
            width={140}
          />
        </FilterBar>
        <DataState
          state={outliers}
          isEmpty={(data) => data.total === 0}
          emptyTitle={EMPTY_TITLE[status]}
          emptyDescription="Each salary in this selection is in the salary band."
        >
          {(data) => (
            <Stack gap={3}>
              <OutlierTable status={status} outliers={data.items} />
              {data.total > data.page_size && (
                <Pagination
                  page={data.page}
                  onChange={(next) => setParam('page', String(next))}
                  totalItems={data.total}
                  pageSize={data.page_size}
                  label="Outlier pages"
                />
              )}
            </Stack>
          )}
        </DataState>
      </Stack>
    </Stack>
  )
}
