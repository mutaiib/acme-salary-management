import { Button } from '@astryxdesign/core/Button'
import { Stack } from '@astryxdesign/core/Stack'
import { pixel, proportional, type TableColumn } from '@astryxdesign/core/Table'
import { useState } from 'react'
import { listBands } from '../../api/bands'
import type { Band } from '../../api/types'
import {
  CountryFilter,
  DataState,
  DataTable,
  FilterBar,
  jobLevelColumn,
  MetaBanner,
  moneyColumn,
  PageHeader,
  type TableRow,
} from '../../components'
import { useApi } from '../../hooks/useApi'
import { useMeta } from '../../hooks/useMeta'
import { useUrlFilters } from '../../hooks/useUrlFilters'
import { formatJobLevel } from '../../lib/format'
import { BandEditDialog } from './BandEditDialog'

export function BandsPage() {
  const meta = useMeta()
  const { filter, setFilter } = useUrlFilters()
  const country = filter('country')
  const bands = useApi(() => listBands(country || undefined), [country])
  const [editing, setEditing] = useState<Band | null>(null)

  const countryName = (code: string) =>
    meta.data?.countries.find((item) => item.code === code)?.name ?? code

  const columns: TableColumn<TableRow<Band>>[] = [
    {
      key: 'country',
      header: 'Country',
      width: proportional(2),
      renderCell: (band) => countryName(band.country),
    },
    jobLevelColumn<Band>('Job level'),
    moneyColumn<Band>('min_minor', 'Minimum'),
    moneyColumn<Band>('mid_minor', 'Midpoint'),
    moneyColumn<Band>('max_minor', 'Maximum'),
    {
      key: 'actions',
      header: '',
      width: pixel(100),
      align: 'end',
      renderCell: (band) => (
        <Button
          label={`Edit the band of ${countryName(band.country)}, ${formatJobLevel(band.job_level)}`}
          variant="ghost"
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
        description="The pay range for each job level in each country. A band is the reference point for a salary."
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
        isEmpty={(data) => data.length === 0}
        emptyTitle="No salary bands"
        emptyDescription="Run the seed script to create the salary bands."
      >
        {(data) => <DataTable rows={data} columns={columns} idKey="id" hasHover />}
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
