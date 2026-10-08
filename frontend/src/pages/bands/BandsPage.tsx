import { Button } from '@astryxdesign/core/Button'
import { Stack } from '@astryxdesign/core/Stack'
import { pixel, proportional, type TableColumn } from '@astryxdesign/core/Table'
import { Text } from '@astryxdesign/core/Text'
import { useState } from 'react'
import { listBands } from '../../api/bands'
import type { Band, BandFigures, OutlierStatus } from '../../api/types'
import {
  CountryFilter,
  DataState,
  DataTable,
  FilterBar,
  jobLevelColumn,
  MetaBanner,
  Money,
  moneyColumn,
  PageHeader,
  Panel,
  type TableRow,
} from '../../components'
import { useApi } from '../../hooks/useApi'
import { countryNameOf, useMeta } from '../../hooks/useMeta'
import { useUrlFilters } from '../../hooks/useUrlFilters'
import { formatCount, formatJobLevel } from '../../lib/format'
import { BandEditDialog } from './BandEditDialog'
import { OutsideBand } from './OutsideBand'

export function BandsPage() {
  const meta = useMeta()
  const { filter, setFilter } = useUrlFilters()
  const country = filter('country')
  const bands = useApi(() => listBands(country || undefined), [country])
  const [editing, setEditing] = useState<Band | null>(null)

  const countryName = (code: string) => countryNameOf(meta.data, code)

  // The employees outside the band: one column for each range status.
  const outsideColumn = (
    status: OutlierStatus,
    header: string,
  ): TableColumn<TableRow<BandFigures>> => ({
    key: `${status}_count`,
    header,
    width: pixel(120),
    align: 'end',
    renderCell: (band) => (
      <OutsideBand
        band={band}
        status={status}
        bandName={`${countryName(band.country)}, ${formatJobLevel(band.job_level)}`}
      />
    ),
  })

  const columns: TableColumn<TableRow<BandFigures>>[] = [
    jobLevelColumn<BandFigures>('Job level'),
    moneyColumn<BandFigures>('min_minor', 'Minimum'),
    {
      key: 'mid_minor',
      header: 'Midpoint',
      width: proportional(1),
      align: 'end',
      renderCell: (band) => (
        <Text weight="semibold">
          <Money amountMinor={band.mid_minor} currency={band.currency} />
        </Text>
      ),
    },
    moneyColumn<BandFigures>('max_minor', 'Maximum'),
    {
      key: 'headcount',
      header: 'Employees',
      width: pixel(110),
      align: 'end',
      renderCell: (band) => formatCount(band.headcount),
    },
    outsideColumn('below', 'Below range'),
    outsideColumn('above', 'Above range'),
    {
      key: 'actions',
      header: '',
      width: pixel(100),
      align: 'end',
      renderCell: (band) => (
        <Button
          label={`Edit the band of ${countryName(band.country)}, ${formatJobLevel(band.job_level)}`}
          variant="secondary"
          size="sm"
          onClick={() => setEditing(band)}
        >
          Edit
        </Button>
      ),
    },
  ]

  return (
    <Stack gap={4} padding={6}>
      <PageHeader
        title="Salary bands"
        description="The pay range for one year, for each job level in each country. A salary below the minimum or above the maximum shows on the Pay health screen."
      />
      <MetaBanner state={meta} />
      <FilterBar>
        <CountryFilter
          meta={meta.data}
          value={country}
          onChange={(value) => setFilter('country', value)}
        />
      </FilterBar>
      <DataState
        state={bands}
        rowsOf={(data) => data.length}
        isEmpty={(data) => data.length === 0}
        emptyTitle="No salary bands"
        emptyDescription="Run the seed script to create the salary bands."
      >
        {(data) => (
          <Stack gap={4}>
            {bandsByCountry(data).map(([code, countryBands]) => (
              <Panel
                key={code}
                title={countryName(code)}
                end={
                  <Text type="supporting">
                    {countryBands[0].currency}, {countryBands.length}{' '}
                    {countryBands.length === 1 ? 'job level' : 'job levels'}
                  </Text>
                }
              >
                <DataTable rows={countryBands} columns={columns} idKey="id" hasHover />
              </Panel>
            ))}
          </Stack>
        )}
      </DataState>
      {editing && (
        <BandEditDialog
          band={editing}
          countryName={countryName(editing.country)}
          onClose={() => setEditing(null)}
          onChanged={bands.reload}
        />
      )}
    </Stack>
  )
}

/** The bands of each country, in the order of the list from the API. */
function bandsByCountry(bands: BandFigures[]): [string, BandFigures[]][] {
  const groups = new Map<string, BandFigures[]>()
  for (const band of bands) {
    groups.set(band.country, [...(groups.get(band.country) ?? []), band])
  }
  return [...groups]
}
