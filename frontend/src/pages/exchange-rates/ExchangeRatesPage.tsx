import { Stack } from '@astryxdesign/core/Stack'
import { pixel, proportional, type TableColumn } from '@astryxdesign/core/Table'
import { listExchangeRates } from '../../api/meta'
import type { ExchangeRate } from '../../api/types'
import { BackLink, DataState, DataTable, PageHeader, Panel, type TableRow } from '../../components'
import { useApi } from '../../hooks/useApi'
import { useMeta } from '../../hooks/useMeta'
import { formatDate, formatRate } from '../../lib/format'

const columnsFor = (reportingCurrency: string): TableColumn<TableRow<ExchangeRate>>[] => [
  { key: 'currency', header: 'Currency', width: proportional(1) },
  {
    key: 'rate_micro',
    header: `Value of 1 unit, in ${reportingCurrency}`,
    width: proportional(1),
    align: 'end',
    renderCell: (rate) => formatRate(rate.rate_micro),
  },
  {
    key: 'as_of_date',
    header: 'Date of the rate',
    width: pixel(180),
    align: 'end',
    renderCell: (rate) => formatDate(rate.as_of_date),
  },
]

/** The exchange rates that convert each salary to the reporting currency. */
export function ExchangeRatesPage() {
  const rates = useApi(listExchangeRates, [])
  // The name of the reporting currency comes from the API, as on the other screens.
  const reportingCurrency = useMeta().data?.reporting_currency ?? 'the reporting currency'

  return (
    <Stack gap={4} padding={6}>
      <BackLink href="/overview" label="Back to Pay overview" />
      <PageHeader
        title="Exchange rates"
        description={`The payroll cost converts each salary to ${reportingCurrency} with these rates. The rates do not change with the market.`}
      />
      <Panel title="Rates">
        <DataState
          state={rates}
          isEmpty={(data) => data.length === 0}
          emptyTitle="No exchange rates"
          emptyDescription="Run the seed script to create the exchange rates."
        >
          {(data) => <DataTable rows={data} columns={columnsFor(reportingCurrency)} idKey="currency" />}
        </DataState>
      </Panel>
    </Stack>
  )
}
