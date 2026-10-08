import { Avatar } from '@astryxdesign/core/Avatar'
import { Badge } from '@astryxdesign/core/Badge'
import { Button } from '@astryxdesign/core/Button'
import { Card } from '@astryxdesign/core/Card'
import { Divider } from '@astryxdesign/core/Divider'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Grid } from '@astryxdesign/core/Grid'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { getEmployee, listSalaryChanges } from '../../api/employees'
import { BackLink, DataState, MetaBanner, PageHeader, Panel, Stat } from '../../components'
import { useApi } from '../../hooks/useApi'
import { countryNameOf, useMeta } from '../../hooks/useMeta'
import { recordBack } from '../../lib/backLinks'
import { formatCount, formatDate, formatJobLevel, formatMoney } from '../../lib/format'
import { DeactivateDialog } from './DeactivateDialog'
import { PositionInRange } from './PositionInRange'
import { RangeStatusBadge } from './RangeStatusBadge'
import { SalaryChangeDialog } from './SalaryChangeDialog'
import { SalaryHistoryTable } from './SalaryHistoryTable'

type OpenDialog = 'salary' | 'deactivate' | null

export function EmployeeDetailPage() {
  const id = Number(useParams().id)
  // An id in the address that is not a whole number cannot be an employee.
  return Number.isInteger(id) && id > 0 ? <EmployeeDetail id={id} /> : <EmployeeNotFound />
}

function EmployeeNotFound() {
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

function EmployeeDetail({ id }: { id: number }) {
  const employee = useApi(() => getEmployee(id), [id])
  const history = useApi(() => listSalaryChanges(id), [id])
  const meta = useMeta()
  const today = meta.data?.today
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null)
  // The list that the HR Manager came from, with its filters. `EmployeeLink` puts it in the address.
  const [params] = useSearchParams()
  const back = recordBack(params)

  const countryName = (code: string) => countryNameOf(meta.data, code)

  function reload() {
    employee.reload()
    history.reload()
  }

  if (employee.error?.status === 404) {
    return <EmployeeNotFound />
  }

  return (
    <Stack gap={5} padding={6}>
      <BackLink href={back.href} label={back.label} />
      <MetaBanner state={meta} />
      <DataState state={employee}>
        {(data) => (
          <>
            <PageHeader
              title={data.full_name}
              description={[
                data.job_title,
                data.department,
                formatJobLevel(data.job_level),
                countryName(data.country),
              ].join(' · ')}
              start={<Avatar name={data.full_name} size="lg" tooltip={false} />}
              status={
                data.status === 'active' ? (
                  <Badge variant="success" label="Active" />
                ) : (
                  <Badge variant="neutral" label="Inactive" />
                )
              }
              actions={
                data.status === 'active' && (
                  <Stack direction="horizontal" gap={2}>
                    <Button label="Deactivate" onClick={() => setOpenDialog('deactivate')} />
                    <Button
                      label="Change salary"
                      variant="primary"
                      onClick={() => setOpenDialog('salary')}
                    />
                  </Stack>
                )
              }
            />
            <Grid columns={{ minWidth: 360, max: 2 }} gap={4}>
              <Card padding={5}>
                <Stack gap={5} data-testid="position-in-range">
                  <Stack direction="horizontal" hAlign="between" vAlign="start" gap={3}>
                    <Stat
                      label="Current salary"
                      value={formatMoney(data.salary_minor, data.currency)}
                      note={`For one year, in ${data.currency}`}
                      testId="current-salary"
                    />
                    <RangeStatusBadge status={data.range_status} />
                  </Stack>
                  {data.band && <Divider />}
                  <PositionInRange employee={data} countryName={countryName(data.country)} />
                </Stack>
              </Card>
              <Panel title="Details">
                <MetadataList>
                  <MetadataListItem label="Employee code">{data.employee_code}</MetadataListItem>
                  <MetadataListItem label="Email">{data.email}</MetadataListItem>
                  <MetadataListItem label="Department">{data.department}</MetadataListItem>
                  <MetadataListItem label="Job level">
                    {formatJobLevel(data.job_level)}
                  </MetadataListItem>
                  <MetadataListItem label="Country">{countryName(data.country)}</MetadataListItem>
                  <MetadataListItem label="Hire date">
                    {formatDate(data.hire_date)}
                  </MetadataListItem>
                  <MetadataListItem label="Gender">{capitalize(data.gender)}</MetadataListItem>
                </MetadataList>
              </Panel>
            </Grid>
            <Panel
              title="Salary history"
              end={
                history.data && (
                  <Text type="supporting">
                    {formatCount(history.data.length)}{' '}
                    {history.data.length === 1 ? 'entry' : 'entries'}
                  </Text>
                )
              }
            >
              <DataState
                state={history}
                isEmpty={(changes) => changes.length === 0}
                emptyTitle="No salary history"
                emptyDescription="This employee has no recorded salary change."
              >
                {(changes) => <SalaryHistoryTable changes={changes} />}
              </DataState>
            </Panel>
            {/* The key resets the form when the salary changes or the server date arrives. */}
            <SalaryChangeDialog
              key={`${data.salary_minor}-${today}`}
              employee={data}
              today={today}
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
    </Stack>
  )
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
