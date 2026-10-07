import { Button } from '@astryxdesign/core/Button'
import { Stack } from '@astryxdesign/core/Stack'
import { pixel, proportional, Table, type TableColumn } from '@astryxdesign/core/Table'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listBands } from '../../api/bands'
import type { Band } from '../../api/types'
import { DataState, FilterBar, FilterSelect, Money, PageHeader } from '../../components'
import { useApi } from '../../hooks/useApi'
import { useMeta } from '../../hooks/useMeta'
import { BandEditDialog } from './BandEditDialog'

type BandRow = Band & Record<string, unknown>

export function BandsPage() {
  const meta = useMeta()
  const [params, setParams] = useSearchParams()
  const country = params.get('country') ?? ''
  const bands = useApi(() => listBands(country || undefined), [country])
  const [editing, setEditing] = useState<Band | null>(null)

  const countryName = (code: string) =>
    meta?.countries.find((item) => item.code === code)?.name ?? code

  const money = (key: 'min_minor' | 'mid_minor' | 'max_minor', header: string) =>
    ({
      key,
      header,
      width: proportional(1),
      align: 'end',
      renderCell: (band) => <Money amountMinor={band[key]} currency={band.currency} />,
    }) satisfies TableColumn<BandRow>

  const columns: TableColumn<BandRow>[] = [
    {
      key: 'country',
      header: 'Country',
      width: proportional(2),
      renderCell: (band) => countryName(band.country),
    },
    {
      key: 'job_level',
      header: 'Job level',
      width: pixel(120),
      renderCell: (band) => `Level ${band.job_level}`,
    },
    money('min_minor', 'Minimum'),
    money('mid_minor', 'Midpoint'),
    money('max_minor', 'Maximum'),
    {
      key: 'actions',
      header: '',
      width: pixel(100),
      align: 'end',
      renderCell: (band) => (
        <Button
          label={`Edit the band of ${countryName(band.country)}, Level ${band.job_level}`}
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
      <FilterBar>
        <FilterSelect
          label="Country"
          value={country}
          onChange={(value) => setParams(value ? { country: value } : {}, { replace: true })}
          options={(meta?.countries ?? []).map((c) => ({ value: c.code, label: c.name }))}
        />
      </FilterBar>
      <DataState
        state={bands}
        isEmpty={(data) => data.length === 0}
        emptyTitle="No salary bands"
        emptyDescription="Run the seed script to create the salary bands."
      >
        {(data) => (
          <Table data={data as BandRow[]} columns={columns} idKey="id" density="compact" hasHover />
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
