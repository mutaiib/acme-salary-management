import { Stack } from '@astryxdesign/core/Stack'
import { pixel, proportional, type TableColumn } from '@astryxdesign/core/Table'
import { Text } from '@astryxdesign/core/Text'
import { listHighestSalaries } from '../../api/insights'
import type { HighSalary, Meta } from '../../api/types'
import {
  CountryFilter,
  DataState,
  DataTable,
  EmployeeLink,
  jobLevelColumn,
  moneyColumn,
  Panel,
  type TableRow,
} from '../../components'
import { useApi } from '../../hooks/useApi'
import { countryNameOf, useMeta } from '../../hooks/useMeta'
import { useUrlFilters } from '../../hooks/useUrlFilters'
import { HIGHEST_SALARIES_HEIGHT } from './loadingHeights'

const NO_BAND_TEXT = 'No salary band'

interface ColumnOptions {
  meta: Meta | undefined
  /** True when the list is for all countries, so the country is a fact of each row. */
  hasCountry: boolean
  /** True when a row has a currency other than the reporting currency. */
  hasReportingColumn: boolean
}

function columnsOf({
  meta,
  hasCountry,
  hasReportingColumn,
}: ColumnOptions): TableColumn<TableRow<HighSalary>>[] {
  return [
    {
      key: 'full_name',
      header: 'Employee',
      width: proportional(2),
      renderCell: (row) => (
        <Stack gap={0}>
          <EmployeeLink id={row.id} name={row.full_name} />
          <Text type="supporting">{row.job_title}</Text>
        </Stack>
      ),
    },
    jobLevelColumn<HighSalary>(),
    ...(hasCountry
      ? [
          {
            key: 'country',
            header: 'Country',
            width: pixel(130),
            renderCell: (row: HighSalary) => countryNameOf(meta, row.country),
          },
        ]
      : []),
    moneyColumn<HighSalary>('salary_minor', 'Salary'),
    ...(hasReportingColumn && meta
      ? [
          moneyColumn<HighSalary>(
            'salary_reporting_minor',
            `Salary in ${meta.reporting_currency}`,
            () => meta.reporting_currency,
          ),
        ]
      : []),
    {
      key: 'compa_ratio',
      header: 'Compa-ratio',
      width: pixel(130),
      align: 'end',
      renderCell: (row) =>
        row.compa_ratio === null ? (
          <Text type="supporting">{NO_BAND_TEXT}</Text>
        ) : (
          <Text type="inherit" hasTabularNumbers>
            {row.compa_ratio.toFixed(2)}
          </Text>
        ),
    },
  ]
}

/**
 * The 10 active employees with the highest salary, for one country or for all countries.
 * The section owns its load and its country, so a failure here leaves the other sections.
 */
export function HighestSalaries() {
  const { filter, setFilter } = useUrlFilters()
  // The country is in the address, so a record can go back to the list of this country.
  const country = filter('country')
  const meta = useMeta()
  const highest = useApi(() => listHighestSalaries(country), [country])
  const reportingCurrency = meta.data?.reporting_currency ?? 'the reporting currency'

  return (
    <Panel
      title="Highest salaries"
      end={<CountryFilter meta={meta.data} value={country} onChange={(code) => setFilter('country', code)} />}
    >
      <Stack gap={3}>
        <Text type="supporting">
          The amounts are for one year. The amount in {reportingCurrency} is the cost to ACME; the
          compa-ratio compares a salary with the salary band of its country.
        </Text>
        <DataState
          state={highest}
          isEmpty={(rows) => rows.length === 0}
          emptyTitle="No active employees"
          emptyDescription="No active employee matches this country."
          rowsOf={(rows) => rows.length}
          loadingHeight={HIGHEST_SALARIES_HEIGHT}
        >
          {(rows) => (
            <DataTable
              rows={rows}
              idKey="id"
              hasHover
              columns={columnsOf({
                meta: meta.data,
                hasCountry: country === '',
                hasReportingColumn: rows.some((row) => row.currency !== meta.data?.reporting_currency),
              })}
            />
          )}
        </DataState>
      </Stack>
    </Panel>
  )
}
