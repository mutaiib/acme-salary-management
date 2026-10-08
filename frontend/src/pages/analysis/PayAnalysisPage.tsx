import { Stack } from '@astryxdesign/core/Stack'
import { Tab, TabList } from '@astryxdesign/core/TabList'
import type { ReactElement } from 'react'
import { PageHeader } from '../../components'
import { useUrlFilters } from '../../hooks/useUrlFilters'
import { HighestSalaries } from './HighestSalaries'
import { OutlierGroupPanel } from './OutlierGroupPanel'
import { SalaryDistributionPanel } from './SalaryDistributionPanel'

const PANEL_ID = 'analysis-panel'

interface AnalysisTab {
  label: string
  section: () => ReactElement
}

// The first tab is the default. It puts no value in the address.
const TABS: Record<string, AnalysisTab> = {
  distribution: { label: 'Salary distribution', section: () => <SalaryDistributionPanel /> },
  outliers: { label: 'Outliers by group', section: () => <OutlierGroupPanel /> },
  highest: { label: 'Highest salaries', section: () => <HighestSalaries /> },
}
const [FIRST_TAB] = Object.keys(TABS)

export function PayAnalysisPage() {
  const { filter, setFilters } = useUrlFilters()
  const requested = filter('tab')
  const openTab = Object.hasOwn(TABS, requested) ? requested : FIRST_TAB

  return (
    <Stack gap={5} padding={6}>
      <PageHeader
        title="Pay analysis"
        description="How ACME pays people: the salary distribution, the outliers by group, and the highest salaries."
      />
      <TabList
        role="tablist"
        value={openTab}
        onChange={(value) =>
          // The filters of a section have no meaning in another section.
          setFilters({ tab: value === FIRST_TAB ? '' : value, group_by: '', country: '' })
        }
      >
        {Object.entries(TABS).map(([value, { label }]) => (
          <Tab key={value} value={value} label={label} panelId={PANEL_ID} />
        ))}
      </TabList>
      {/* Only the open section is in the document, so a closed tab sends no request. */}
      <Stack id={PANEL_ID} role="tabpanel" aria-label={TABS[openTab].label}>
        {TABS[openTab].section()}
      </Stack>
    </Stack>
  )
}
