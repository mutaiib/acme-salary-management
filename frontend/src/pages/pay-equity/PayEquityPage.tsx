import { Banner } from '@astryxdesign/core/Banner'
import { Heading } from '@astryxdesign/core/Heading'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { getPayEquity } from '../../api/insights'
import type { Gap } from '../../api/types'
import { DataState, PageHeader, StatCard, StatRow } from '../../components'
import { useApi } from '../../hooks/useApi'
import { formatCount, formatGap } from '../../lib/format'
import { GapTable, NOT_ENOUGH_DATA } from './GapTable'

function gapText(gapPct: number | null): string {
  return gapPct === null ? NOT_ENOUGH_DATA : formatGap(gapPct)
}

/** The note below a gap of the organization. A negative gap says who has the higher pay. */
function gapNote(gapPct: number | null, note: string): string {
  return gapPct !== null && gapPct < 0 ? `Women have the higher pay. ${note}` : note
}

function OrganizationStats({ organization, countries, flagThresholdPct }: StatsProps) {
  const flagged = countries.filter((country) => country.is_flagged).length
  return (
    <StatRow>
      <StatCard
        label="Mean gap, organization"
        value={gapText(organization.mean_gap_pct)}
        hint={gapNote(organization.mean_gap_pct, `In ${organization.currency}`)}
        testId="organization-mean-gap"
      />
      <StatCard
        label="Median gap, organization"
        value={gapText(organization.median_gap_pct)}
        hint={gapNote(
          organization.median_gap_pct,
          `${formatCount(organization.men)} men, ${formatCount(organization.women)} women`,
        )}
        testId="organization-median-gap"
      />
      <StatCard
        label="Countries with a flag"
        value={`${flagged} of ${countries.length}`}
        hint={`A gap of more than ${flagThresholdPct}%, in favor of men or of women`}
        testId="flagged-countries"
      />
    </StatRow>
  )
}

interface StatsProps {
  organization: Gap
  countries: Gap[]
  flagThresholdPct: number
}

export function PayEquityPage() {
  const equity = useApi(getPayEquity, [])

  return (
    <Stack gap={5} padding={6}>
      <PageHeader
        title="Pay equity"
        description="The difference between the pay of men and the pay of women, as a percentage of the pay of men."
      />
      {/* The note is outside the data state, so the screen shows it in each state. */}
      <Banner
        status="info"
        title="These figures are unadjusted"
        description="An unadjusted gap does not correct for job level, department or length of service. It shows where to look. It does not prove unequal pay for equal work."
      />
      <DataState
        state={equity}
        isEmpty={(data) => data.countries.length === 0}
        emptyTitle="No active employees"
        emptyDescription="A pay gap needs active employees."
      >
        {(data) => (
          <Stack gap={5}>
            <OrganizationStats
              organization={data.organization}
              countries={data.countries}
              flagThresholdPct={data.flag_threshold_pct}
            />
            <Stack gap={3}>
              <Heading level={2}>By country</Heading>
              <GapTable countries={data.countries} flagThresholdPct={data.flag_threshold_pct} />
              <Text type="supporting">
                A positive gap means that men have the higher pay. Each country uses its local
                currency. A group with fewer than {data.min_group_size} men or{' '}
                {data.min_group_size} women shows no gap.
              </Text>
            </Stack>
          </Stack>
        )}
      </DataState>
    </Stack>
  )
}
