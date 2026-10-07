import { Stack } from '@astryxdesign/core/Stack'
import { Tab, TabList } from '@astryxdesign/core/TabList'
import { Text } from '@astryxdesign/core/Text'
import { useState } from 'react'
import { getOverview } from '../../api/insights'
import type { GroupBy } from '../../api/types'
import { DataState, PageHeader, StatCard, StatRow } from '../../components'
import { useApi } from '../../hooks/useApi'
import { formatCount, formatDate, formatMoney } from '../../lib/format'
import { GroupTable } from './GroupTable'

const GROUPINGS: Record<GroupBy, { tab: string; header: string; note: string }> = {
  country: {
    tab: 'By country',
    header: 'Country',
    note: 'The salaries of a country are in the local currency.',
  },
  department: {
    tab: 'By department',
    header: 'Department',
    note: 'A department has many currencies, so the salaries are in the reporting currency.',
  },
  job_level: {
    tab: 'By job level',
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
                  value={formatMoney(data.payroll_cost_minor, data.reporting_currency)}
                  hint={`For one year, in ${data.reporting_currency}`}
                  testId="payroll-cost"
                />
                <StatCard
                  label="Headcount"
                  value={formatCount(data.headcount)}
                  hint="Active employees"
                  testId="headcount"
                />
              </StatRow>
              <Stack gap={3}>
                <TabList
                  value={groupBy}
                  onChange={(value) => setGroupBy(value as GroupBy)}
                  role="tablist"
                  hasDivider
                >
                  {(Object.keys(GROUPINGS) as GroupBy[]).map((value) => (
                    <Tab key={value} value={value} label={GROUPINGS[value].tab} />
                  ))}
                </TabList>
                <GroupTable
                  groupHeader={shown.header}
                  groups={data.groups}
                  totalCostMinor={data.payroll_cost_minor}
                  reportingCurrency={data.reporting_currency}
                />
                <Text type="supporting">
                  {shown.note}
                  {data.rates_as_of && ` Exchange rates of ${formatDate(data.rates_as_of)}.`}
                </Text>
              </Stack>
            </Stack>
          )
        }}
      </DataState>
    </Stack>
  )
}
