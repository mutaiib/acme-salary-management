import { Stack } from '@astryxdesign/core/Stack'
import { pixel, proportional, Table, type TableColumn } from '@astryxdesign/core/Table'
import { Text } from '@astryxdesign/core/Text'
import { TextInput } from '@astryxdesign/core/TextInput'
import { useEffect, useState } from 'react'
import { listEmployees } from '../../api/employees'
import type { Employee } from '../../api/types'
import {
  CountryFilter,
  DataState,
  EmployeeLink,
  FilterBar,
  FilterSelect,
  JobLevelFilter,
  ListPagination,
  moneyColumn,
  PageHeader,
  StatusBadge,
  type TableRow,
} from '../../components'
import { useApi } from '../../hooks/useApi'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useMeta } from '../../hooks/useMeta'
import { useUrlFilters } from '../../hooks/useUrlFilters'
import { formatCount } from '../../lib/format'

const SEARCH_DELAY_MS = 300

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const DEFAULT_SORT = 'employee_code'
const SORT_OPTIONS = [
  { value: DEFAULT_SORT, label: 'Employee code' },
  { value: 'name', label: 'Name' },
  { value: '-hire_date', label: 'Newest hire first' },
  { value: 'hire_date', label: 'Oldest hire first' },
]

const COLUMNS: TableColumn<TableRow<Employee>>[] = [
  { key: 'employee_code', header: 'Code', width: pixel(100) },
  {
    key: 'full_name',
    header: 'Name',
    width: proportional(2),
    renderCell: (employee) => (
      <Stack direction="horizontal" gap={2} vAlign="center">
        <EmployeeLink id={employee.id} name={employee.full_name} />
        <StatusBadge status={employee.status} />
      </Stack>
    ),
  },
  { key: 'job_title', header: 'Job title', width: proportional(2) },
  {
    key: 'job_level',
    header: 'Level',
    width: pixel(100),
    renderCell: (employee) => `Level ${employee.job_level}`,
  },
  { key: 'department', header: 'Department', width: proportional(1) },
  { key: 'country', header: 'Country', width: pixel(100) },
  moneyColumn<Employee>('salary_minor', 'Salary'),
]

export function EmployeesPage() {
  const meta = useMeta()
  const { filter, setFilter, page, setPage } = useUrlFilters()
  const query = {
    page,
    search: filter('search'),
    country: filter('country'),
    department: filter('department'),
    job_level: filter('job_level'),
    status: filter('status'),
    sort: filter('sort'),
  }
  const employees = useApi(() => listEmployees(query), [JSON.stringify(query)])

  const [searchText, setSearchText] = useState(query.search)
  const debouncedSearch = useDebouncedValue(searchText, SEARCH_DELAY_MS)
  // Only a change of the text that the HR Manager typed starts a search,
  // so `query.search` and `setFilter` are not dependencies.
  useEffect(() => {
    if (debouncedSearch !== query.search) {
      setFilter('search', debouncedSearch)
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  return (
    <Stack gap={4} padding={6}>
      <PageHeader title="Employees" description="Find an employee and open the pay record." />
      <FilterBar>
        <TextInput
          label="Search"
          placeholder="Name, email or employee code"
          value={searchText}
          onChange={setSearchText}
          hasClear
          size="sm"
          width={280}
        />
        <CountryFilter
          meta={meta}
          value={query.country}
          onChange={(value) => setFilter('country', value)}
        />
        <FilterSelect
          label="Department"
          value={query.department}
          onChange={(value) => setFilter('department', value)}
          options={(meta?.departments ?? []).map((d) => ({ value: d, label: d }))}
        />
        <JobLevelFilter
          meta={meta}
          value={query.job_level}
          onChange={(value) => setFilter('job_level', value)}
        />
        <FilterSelect
          label="Status"
          value={query.status}
          onChange={(value) => setFilter('status', value)}
          options={STATUS_OPTIONS}
          width={140}
        />
        <FilterSelect
          label="Sort by"
          value={query.sort || DEFAULT_SORT}
          onChange={(value) => setFilter('sort', value)}
          options={SORT_OPTIONS}
        />
      </FilterBar>
      <DataState
        state={employees}
        isEmpty={(data) => data.items.length === 0}
        emptyTitle="No employee matches"
        emptyDescription="Change the search text or remove a filter."
      >
        {(data) => (
          <Stack gap={3}>
            <Text type="supporting">{formatCount(data.total)} employees</Text>
            <Table
              data={data.items as TableRow<Employee>[]}
              columns={COLUMNS}
              idKey="id"
              density="compact"
              hasHover
              rowIndexStart={(data.page - 1) * data.page_size + 1}
              rowCount={data.total}
            />
            <ListPagination page={data} onChange={setPage} label="Employee pages" />
          </Stack>
        )}
      </DataState>
    </Stack>
  )
}
