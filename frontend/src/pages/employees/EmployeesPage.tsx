import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl'
import { Stack } from '@astryxdesign/core/Stack'
import { pixel, proportional, type TableColumn } from '@astryxdesign/core/Table'
import { Text } from '@astryxdesign/core/Text'
import { listEmployees } from '../../api/employees'
import type { Employee, EmployeeStatus, Meta } from '../../api/types'
import {
  CountryFilter,
  DataState,
  DataTable,
  EmployeeLink,
  FilterBar,
  FilterSelect,
  JobLevelFilter,
  jobLevelColumn,
  ListPagination,
  MetaBanner,
  moneyColumn,
  type Option,
  PageHeader,
  SearchBox,
  StatusBadge,
  type TableRow,
} from '../../components'
import { useApi } from '../../hooks/useApi'
import { countryNameOf, useMeta } from '../../hooks/useMeta'
import { useUrlFilters } from '../../hooks/useUrlFilters'
import { formatCount } from '../../lib/format'
import { PaySummary } from './PaySummary'

// The value `all` puts no status in the address.
const ALL_STATUSES = 'all'
const STATUS_OPTIONS: Option<EmployeeStatus | typeof ALL_STATUSES>[] = [
  { value: ALL_STATUSES, label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

// The values are the sort options of `GET /api/employees`.
// Without a sort, the API uses the order of the employee code.
const SORT_OPTIONS: Option[] = [
  { value: 'employee_code', label: 'Employee code' },
  { value: 'name', label: 'Name' },
  { value: '-hire_date', label: 'Newest hire first' },
  { value: 'hire_date', label: 'Oldest hire first' },
]

// A list of inactive employees only does not show the badge: each row has the same one.
const columnsFor = (
  meta: Meta | undefined,
  hasStatusBadge: boolean,
): TableColumn<TableRow<Employee>>[] => [
  { key: 'employee_code', header: 'Code', width: pixel(100) },
  {
    key: 'full_name',
    header: 'Name',
    width: proportional(2),
    renderCell: (employee) => (
      <Stack direction="horizontal" gap={2} vAlign="center">
        <EmployeeLink id={employee.id} name={employee.full_name} />
        {hasStatusBadge && <StatusBadge status={employee.status} />}
      </Stack>
    ),
  },
  { key: 'job_title', header: 'Job title', width: proportional(2) },
  jobLevelColumn<Employee>(),
  { key: 'department', header: 'Department', width: proportional(1) },
  {
    key: 'country',
    header: 'Country',
    width: pixel(140),
    renderCell: (employee) => countryNameOf(meta, employee.country),
  },
  moneyColumn<Employee>('salary_minor', 'Salary'),
]

export function EmployeesPage() {
  const meta = useMeta()
  const { filter, setFilter, page, setPage, pageSize, setPageSize } = useUrlFilters()
  const query = {
    page,
    page_size: pageSize,
    search: filter('search'),
    country: filter('country'),
    department: filter('department'),
    job_level: filter('job_level'),
    status: filter('status'),
    sort: filter('sort'),
  }
  const employees = useApi(() => listEmployees(query), [JSON.stringify(query)])

  return (
    <Stack gap={4} padding={6}>
      <PageHeader title="Employees" description="Find an employee and open the pay record." />
      <MetaBanner state={meta} />
      <FilterBar>
        <SearchBox applied={query.search} onApply={(text) => setFilter('search', text)} />
        <CountryFilter
          meta={meta.data}
          value={query.country}
          onChange={(value) => setFilter('country', value)}
        />
        <FilterSelect
          label="Department"
          value={query.department}
          onChange={(value) => setFilter('department', value)}
          options={(meta.data?.departments ?? []).map((d) => ({ value: d, label: d }))}
        />
        <JobLevelFilter
          meta={meta.data}
          value={query.job_level}
          onChange={(value) => setFilter('job_level', value)}
        />
        <SegmentedControl
          label="Status"
          size="sm"
          value={query.status || ALL_STATUSES}
          onChange={(value) => setFilter('status', value === ALL_STATUSES ? '' : value)}
        >
          {STATUS_OPTIONS.map((option) => (
            <SegmentedControlItem key={option.value} value={option.value} label={option.label} />
          ))}
        </SegmentedControl>
      </FilterBar>
      <PaySummary
        filters={{
          search: query.search,
          country: query.country,
          department: query.department,
          job_level: query.job_level,
          status: query.status,
        }}
      />
      <DataState
        state={employees}
        isEmpty={(data) => data.items.length === 0}
        emptyTitle="No employee matches"
        emptyDescription="Change the search text or remove a filter."
      >
        {(data) => (
          <Stack gap={3}>
            <Stack direction="horizontal" hAlign="between" vAlign="center" gap={3} wrap="wrap">
              <Text type="supporting">{formatCount(data.total)} employees</Text>
              <FilterSelect
                label="Sort by"
                value={query.sort}
                onChange={(value) => setFilter('sort', value)}
                options={SORT_OPTIONS}
              />
            </Stack>
            <DataTable
              rows={data.items}
              columns={columnsFor(meta.data, query.status !== 'inactive')}
              idKey="id"
              hasHover
              rowIndexStart={(data.page - 1) * data.page_size + 1}
              rowCount={data.total}
            />
            <ListPagination
              page={data}
              onChange={setPage}
              onPageSizeChange={setPageSize}
              label="Employee pages"
            />
          </Stack>
        )}
      </DataState>
    </Stack>
  )
}
