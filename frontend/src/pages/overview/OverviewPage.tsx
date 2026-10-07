import { Link } from '@astryxdesign/core/Link'
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { useState } from 'react'
import { getOverview } from '../../api/insights'
import type { GroupBy } from '../../api/types'
import { DataState, PageHeader, Panel, StatCard, StatRow } from '../../components'
import { useApi } from '../../hooks/useApi'
import { formatCount, formatDate, formatMoney, formatMoneyShort } from '../../lib/format'
import { GroupTable } from './GroupTable'
import { OutlierNotice } from './OutlierNotice'

const GROUPINGS: Record<GroupBy, { tab: string; title: string; header: string; note: string }> = {
  country: {
    tab: 'Country',
    title: 'Payroll cost by country',
    header: 'Country',
    note: 'The salaries of a country are in the local currency.',
  },
  department: {
    tab: 'Department',
    title: 'Payroll cost by department',
    header: 'Department',
    note: 'A department has many currencies, so the salaries are in the reporting currency.',
  },
  job_level: {
    tab: 'Job level',
    title: 'Payroll cost by job level',
    header: 'Job level',
    note: 'A job level has many currencies, so the salaries are in the reporting currency.',
  },
}

export function OverviewPage() {
  const [groupBy, setGroupBy] = useState<GroupBy>('country')
  const overview = useApi(() => getOverview(groupBy), [groupBy])

  return (
    <Stack gap={5} padding={6}>
      <PageHeader
        title="Pay overview"
        description="The payroll cost of ACME, and where ACME spends it."
      />
      <DataState
        state={overview}
        isEmpty={(data) => data.headcount === 0}
        emptyTitle="No active employees"
        emptyDescription="Run the seed script to create the employees."
      >
        {(data) => {
          // The old table stays while a new grouping loads. The header and the note
          // come from the data, so they always agree with the figures on the screen.
          const shown = GROUPINGS[data.group_by]
          return (
            <Stack gap={5}>
              <StatRow>
                <StatCard
                  label="Payroll cost"
                  value={formatMoneyShort(data.payroll_cost_minor, data.reporting_currency)}
                  fullValue={formatMoney(data.payroll_cost_minor, data.reporting_currency)}
                  hint={`For one year, in ${data.reporting_currency}`}
                  help="The payroll cost is the sum of the salaries of the active employees, for one year, in the reporting currency."
                  testId="payroll-cost"
                />
                <StatCard
                  label="Headcount"
                  value={formatCount(data.headcount)}
                  hint="Active employees"
                  help="The headcount is the number of active employees. An inactive employee is not in a pay figure."
                  testId="headcount"
                />
                <StatCard
                  label="Median salary"
                  value={formatMoney(data.median_salary_minor, data.reporting_currency)}
                  hint={`For one year, in ${data.reporting_currency}`}
                  help="The median is the middle salary. Half of the active employees get less, and half get more."
                  testId="median-salary"
                />
              </StatRow>
              <OutlierNotice />
              <Panel
                title={shown.title}
                end={
                  <SegmentedControl
                    label="Group the payroll cost by"
                    size="sm"
                    value={groupBy}
                    onChange={(value) => setGroupBy(value as GroupBy)}
                  >
                    {(Object.keys(GROUPINGS) as GroupBy[]).map((value) => (
                      <SegmentedControlItem key={value} value={value} label={GROUPINGS[value].tab} />
                    ))}
                  </SegmentedControl>
                }
              >
                <Text type="supporting">
                  The amounts are for one year. The payroll cost is in {data.reporting_currency}.{' '}
                  {shown.note}{' '}
                  {data.rates_as_of && (
                    <Link href="/exchange-rates">
                      Exchange rates of {formatDate(data.rates_as_of)}
                    </Link>
                  )}
                </Text>
                <GroupTable
                  groupHeader={shown.header}
                  groups={data.groups}
                  totalCostMinor={data.payroll_cost_minor}
                  reportingCurrency={data.reporting_currency}
                />
              </Panel>
            </Stack>
          )
        }}
      </DataState>
    </Stack>
  )
}
