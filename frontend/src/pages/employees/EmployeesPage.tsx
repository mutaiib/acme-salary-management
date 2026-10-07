import { Link } from '@astryxdesign/core/Link'
import { Pagination } from '@astryxdesign/core/Pagination'
import { Stack } from '@astryxdesign/core/Stack'
import { pixel, proportional, Table, type TableColumn } from '@astryxdesign/core/Table'
import { Text } from '@astryxdesign/core/Text'
import { TextInput } from '@astryxdesign/core/TextInput'
import { useEffect, useState } from 'react'
import { listEmployees } from '../../api/employees'
import type { Employee } from '../../api/types'
import {
  DataState,
  FilterBar,
  FilterSelect,
  Money,
  PageHeader,
  StatusBadge,
} from '../../components'
import { useApi } from '../../hooks/useApi'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useMeta } from '../../hooks/useMeta'
import { formatCount } from '../../lib/format'
import { useEmployeeFilters } from './useEmployeeFilters'

type EmployeeRow = Employee & Record<string, unknown>

const SEARCH_DELAY_MS = 300

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const SORT_OPTIONS = [
  { value: 'employee_code', label: 'Employee code' },
  { value: 'name', label: 'Name' },
  { value: '-hire_date', label: 'Newest hire first' },
  { value: 'hire_date', label: 'Oldest hire first' },
]

const COLUMNS: TableColumn<EmployeeRow>[] = [
  { key: 'employee_code', header: 'Code', width: pixel(100) },
  {
    key: 'full_name',
    header: 'Name',
    width: proportional(2),
    renderCell: (employee) => (
      <Stack direction="horizontal" gap={2} vAlign="center">
        <Link href={`/employees/${employee.id}`}>{employee.full_name}</Link>
        <StatusBadge status={employee.status} />
      </Stack>
    ),
  },
  { key: 'job_title', header: 'Job title', width: proportional(2) },
  { key: 'job_level', header: 'Level', width: pixel(80) },
  { key: 'department', header: 'Department', width: proportional(1) },
  { key: 'country', header: 'Country', width: pixel(100) },
  {
    key: 'salary_minor',
    header: 'Salary',
    width: proportional(1),
    align: 'end',
    renderCell: (employee) => (
      <Money amountMinor={employee.salary_minor} currency={employee.currency} />
    ),
  },
]

export function EmployeesPage() {
  const meta = useMeta()
  const { query, setFilter, setPage } = useEmployeeFilters()
  const employees = useApi(() => listEmployees(query), [JSON.stringify(query)])

  const [searchText, setSearchText] = useState(query.search ?? '')
  const debouncedSearch = useDebouncedValue(searchText, SEARCH_DELAY_MS)
  useEffect(() => {
    if (debouncedSearch !== (query.search ?? '')) {
      setFilter('search', debouncedSearch)
    }
    // Only a change of the text that the HR Manager typed starts a search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <FilterSelect
          label="Country"
          value={query.country ?? ''}
          onChange={(value) => setFilter('country', value)}
          options={(meta?.countries ?? []).map((c) => ({ value: c.code, label: c.name }))}
        />
        <FilterSelect
          label="Department"
          value={query.department ?? ''}
          onChange={(value) => setFilter('department', value)}
          options={(meta?.departments ?? []).map((d) => ({ value: d, label: d }))}
        />
        <FilterSelect
          label="Job level"
          value={query.job_level ?? ''}
          onChange={(value) => setFilter('job_level', value)}
          options={(meta?.job_levels ?? []).map((l) => ({ value: String(l), label: `Level ${l}` }))}
          width={140}
        />
        <FilterSelect
          label="Status"
          value={query.status ?? ''}
          onChange={(value) => setFilter('status', value)}
          options={STATUS_OPTIONS}
          width={140}
        />
        <FilterSelect
          label="Sort by"
          value={query.sort ?? 'employee_code'}
          onChange={(value) => setFilter('sort', value)}
          options={SORT_OPTIONS}
        />
      </FilterBar>
      <DataState
        state={employees}
        isEmpty={(data) => data.total === 0}
        emptyTitle="No employee matches"
        emptyDescription="Change the search text or remove a filter."
      >
        {(data) => (
          <Stack gap={3}>
            <Text type="supporting">{formatCount(data.total)} employees</Text>
            <Table
              data={data.items as EmployeeRow[]}
              columns={COLUMNS}
              idKey="id"
              density="compact"
              hasHover
              rowIndexStart={(data.page - 1) * data.page_size + 1}
              rowCount={data.total}
            />
            {data.total > data.page_size && (
              <Pagination
                page={data.page}
                onChange={setPage}
                totalItems={data.total}
                pageSize={data.page_size}
                label="Employee pages"
              />
            )}
          </Stack>
        )}
      </DataState>
    </Stack>
  )
}
