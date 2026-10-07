import { Badge } from '@astryxdesign/core/Badge'
import { Banner } from '@astryxdesign/core/Banner'
import { Heading } from '@astryxdesign/core/Heading'
import { Stack } from '@astryxdesign/core/Stack'
import { pixel, proportional, Table, type TableColumn } from '@astryxdesign/core/Table'
import { Text } from '@astryxdesign/core/Text'
import { getPayEquity } from '../../api/insights'
import type { Gap } from '../../api/types'
import { DataState, PageHeader, StatCard, StatRow } from '../../components'
import { useApi } from '../../hooks/useApi'
import { formatCount, formatGap } from '../../lib/format'

type GapRow = Gap & Record<string, unknown>

const NOT_ENOUGH_DATA = 'Not enough data'

function gapText(gapPct: number | null): string {
  return gapPct === null ? NOT_ENOUGH_DATA : formatGap(gapPct)
}

function GapValue({ gapPct }: { gapPct: number | null }) {
  return gapPct === null ? (
    <Text type="supporting">{NOT_ENOUGH_DATA}</Text>
  ) : (
    <Text type="inherit" hasTabularNumbers>
      {formatGap(gapPct)}
    </Text>
  )
}

export function PayEquityPage() {
  const equity = useApi(getPayEquity, [])

  return (
    <Stack gap={5} padding={6}>
      <PageHeader
        title="Pay equity"
        description="The difference between the pay of men and the pay of women, as a percentage of the pay of men."
      />
      <DataState state={equity}>
        {(data) => {
          const flagged = data.countries.filter((country) => country.is_flagged).length
          const columns: TableColumn<GapRow>[] = [
            { key: 'label', header: 'Country', width: proportional(2) },
            {
              key: 'men',
              header: 'Men',
              width: pixel(100),
              align: 'end',
              renderCell: (gap) => formatCount(gap.men),
            },
            {
              key: 'women',
              header: 'Women',
              width: pixel(100),
              align: 'end',
              renderCell: (gap) => formatCount(gap.women),
            },
            {
              key: 'mean_gap_pct',
              header: 'Mean gap',
              width: proportional(1),
              align: 'end',
              renderCell: (gap) => <GapValue gapPct={gap.mean_gap_pct} />,
            },
            {
              key: 'median_gap_pct',
              header: 'Median gap',
              width: proportional(1),
              align: 'end',
              renderCell: (gap) =>
                gap.has_enough_data ? <GapValue gapPct={gap.median_gap_pct} /> : null,
            },
            {
              key: 'is_flagged',
              header: 'Flag',
              width: pixel(140),
              renderCell: (gap) =>
                gap.is_flagged ? (
                  <Badge variant="warning" label={`Above ${data.flag_threshold_pct}%`} />
                ) : null,
            },
          ]

          return (
            <Stack gap={5}>
              <Banner
                status="info"
                title="These figures are unadjusted"
                description="An unadjusted gap does not correct for job level, department or length of service. It shows where to look. It does not prove unequal pay for equal work."
              />
              <StatRow>
                <StatCard
                  label="Mean gap, organization"
                  value={gapText(data.organization.mean_gap_pct)}
                  hint={`In ${data.organization.currency}`}
                  testId="organization-mean-gap"
                />
                <StatCard
                  label="Median gap, organization"
                  value={gapText(data.organization.median_gap_pct)}
                  hint={`${formatCount(data.organization.men)} men, ${formatCount(data.organization.women)} women`}
                  testId="organization-median-gap"
                />
                <StatCard
                  label="Countries with a flag"
                  value={`${flagged} of ${data.countries.length}`}
                  hint={`A gap of more than ${data.flag_threshold_pct}%`}
                  testId="flagged-countries"
                />
              </StatRow>
              <Stack gap={3}>
                <Heading level={2}>By country</Heading>
                <Table
                  data={data.countries as GapRow[]}
                  columns={columns}
                  idKey="key"
                  density="compact"
                />
                <Text type="supporting">
                  A positive gap means that men have the higher pay. Each country uses its local
                  currency. A group with fewer than {data.min_group_size} men or{' '}
                  {data.min_group_size} women shows no gap.
                </Text>
              </Stack>
            </Stack>
          )
        }}
      </DataState>
    </Stack>
  )
}
