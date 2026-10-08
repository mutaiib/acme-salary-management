import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { useLocation, useNavigate } from 'react-router-dom'
import { listOutlierGroups } from '../../api/insights'
import type { GroupBy } from '../../api/types'
import { DataState, Panel } from '../../components'
import { useApi } from '../../hooks/useApi'
import { useUrlFilters } from '../../hooks/useUrlFilters'
import { outlierHref } from '../../lib/chartLinks'
import { OUTLIERS_HEIGHT } from './loadingHeights'
import { OutlierGroupChart } from './OutlierGroupChart'

const GROUPINGS: Record<GroupBy, { tab: string; title: string }> = {
  country: { tab: 'Country', title: 'Outliers by country' },
  department: { tab: 'Department', title: 'Outliers by department' },
  job_level: { tab: 'Job level', title: 'Outliers by job level' },
}

const FIRST_GROUPING: GroupBy = 'country'

export function OutlierGroupPanel() {
  const { filter, setFilter } = useUrlFilters()
  // The grouping is in the address, so a list can go back to it. The first one puts no value.
  const requested = filter('group_by')
  const groupBy = Object.hasOwn(GROUPINGS, requested) ? (requested as GroupBy) : FIRST_GROUPING
  // The data keeps its grouping. The old chart stays while a new grouping loads, and a
  // click on it must open the list of the grouping that the chart shows.
  const groups = useApi(
    () => listOutlierGroups(groupBy).then((items) => ({ groupBy, items })),
    [groupBy],
  )
  const navigate = useNavigate()
  // The list goes back to this address, with the tab and the grouping that the chart has now.
  const { pathname, search } = useLocation()
  return (
    <Panel
      title={GROUPINGS[groupBy].title}
      end={
        <SegmentedControl
          label="Group the outliers by"
          size="sm"
          value={groupBy}
          onChange={(value) => setFilter('group_by', value === FIRST_GROUPING ? '' : value)}
        >
          {(Object.keys(GROUPINGS) as GroupBy[]).map((value) => (
            <SegmentedControlItem key={value} value={value} label={GROUPINGS[value].tab} />
          ))}
        </SegmentedControl>
      }
    >
      <DataState
        state={groups}
        loadingHeight={OUTLIERS_HEIGHT}
        isEmpty={(data) => data.items.length === 0}
        emptyTitle="No groups to show"
        emptyDescription="No employee of these groups has a salary band."
      >
        {(data) => (
          <Stack gap={3}>
            <Text type="supporting">
              The active employees below range and above range, in each group. Each part of a bar
              shows its number of employees. Select a part of a bar to see its employees.
            </Text>
            <OutlierGroupChart
              groups={data.items}
              onSelect={(group, status) => navigate(outlierHref(data.groupBy, group.key, status, pathname + search))}
            />
          </Stack>
        )}
      </DataState>
    </Panel>
  )
}
