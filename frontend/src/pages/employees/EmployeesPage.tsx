import { Pagination } from '@astryxdesign/core/Pagination'
import { Stack } from '@astryxdesign/core/Stack'
import { pixel, proportional, Table, type TableColumn } from '@astryxdesign/core/Table'
import { Text } from '@astryxdesign/core/Text'
import { useState } from 'react'
import { listEmployees } from '../../api/employees'
import type { Employee } from '../../api/types'
import { DataState, Money, PageHeader } from '../../components'
import { useApi } from '../../hooks/useApi'
import { formatCount } from '../../lib/format'

type EmployeeRow = Employee & Record<string, unknown>

const COLUMNS: TableColumn<EmployeeRow>[] = [
  { key: 'employee_code', header: 'Code', width: pixel(100) },
  { key: 'full_name', header: 'Name', width: proportional(2) },
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
  const [page, setPage] = useState(1)
  const employees = useApi(() => listEmployees({ page }), [page])

  return (
    <Stack gap={4} padding={6}>
      <PageHeader title="Employees" description="The salary of each employee of ACME." />
      <DataState
        state={employees}
        isEmpty={(data) => data.total === 0}
        emptyTitle="No employees"
        emptyDescription="Run the seed script to create the employees."
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
