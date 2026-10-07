import { Button } from '@astryxdesign/core/Button'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Heading } from '@astryxdesign/core/Heading'
import { Link } from '@astryxdesign/core/Link'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { getEmployee, listSalaryChanges } from '../../api/employees'
import type { Employee } from '../../api/types'
import { DataState, PageHeader, StatusBadge } from '../../components'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatMoney } from '../../lib/format'
import { DeactivateDialog } from './DeactivateDialog'
import { PositionInRange } from './PositionInRange'
import { SalaryChangeDialog } from './SalaryChangeDialog'
import { SalaryHistoryTable } from './SalaryHistoryTable'

type OpenDialog = 'salary' | 'deactivate' | null

export function EmployeeDetailPage() {
  const id = Number(useParams().id)
  const employee = useApi(() => getEmployee(id), [id])
  const history = useApi(() => listSalaryChanges(id), [id])
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null)

  function reload() {
    employee.reload()
    history.reload()
  }

  if (employee.error?.status === 404) {
    return (
      <Stack padding={6}>
        <EmptyState
          title="Employee not found"
          description="The employee does not exist."
          headingLevel={1}
          actions={<Button label="Go to Employees" href="/employees" />}
        />
      </Stack>
    )
  }

  return (
    <Stack gap={5} padding={6}>
      <Link href="/employees" isStandalone>
        Back to Employees
      </Link>
      <DataState state={employee}>
        {(data) => (
          <>
            <PageHeader
              title={data.full_name}
              description={`${data.job_title}, ${data.department}`}
              actions={
                data.status === 'active' ? (
                  <Stack direction="horizontal" gap={2}>
                    <Button label="Deactivate" onClick={() => setOpenDialog('deactivate')} />
                    <Button
                      label="Change salary"
                      variant="primary"
                      onClick={() => setOpenDialog('salary')}
                    />
                  </Stack>
                ) : (
                  <StatusBadge status={data.status} />
                )
              }
            />
            <CurrentSalary employee={data} />
            <MetadataList columns={3}>
              <MetadataListItem label="Employee code">{data.employee_code}</MetadataListItem>
              <MetadataListItem label="Email">{data.email}</MetadataListItem>
              <MetadataListItem label="Job level">{`Level ${data.job_level}`}</MetadataListItem>
              <MetadataListItem label="Country">{data.country}</MetadataListItem>
              <MetadataListItem label="Hire date">{formatDate(data.hire_date)}</MetadataListItem>
              <MetadataListItem label="Gender">{capitalize(data.gender)}</MetadataListItem>
            </MetadataList>
            <PositionInRange employee={data} />
            {/* The key resets the form each time the salary changes. */}
            <SalaryChangeDialog
              key={data.salary_minor}
              employee={data}
              isOpen={openDialog === 'salary'}
              onClose={() => setOpenDialog(null)}
              onChanged={reload}
            />
            <DeactivateDialog
              employee={data}
              isOpen={openDialog === 'deactivate'}
              onClose={() => setOpenDialog(null)}
              onDeactivated={reload}
            />
          </>
        )}
      </DataState>
      <Stack gap={3}>
        <Heading level={2}>Salary history</Heading>
        <DataState state={history}>
          {(changes) => <SalaryHistoryTable changes={changes} />}
        </DataState>
      </Stack>
    </Stack>
  )
}

function CurrentSalary({ employee }: { employee: Employee }) {
  return (
    <Stack gap={1}>
      <Text type="label" color="secondary">
        Current salary
      </Text>
      <Text type="display-3" hasTabularNumbers data-testid="current-salary">
        {formatMoney(employee.salary_minor, employee.currency)}
      </Text>
    </Stack>
  )
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
