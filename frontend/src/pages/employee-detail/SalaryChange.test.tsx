// FR-04, FR-05, FR-06, FR-13: a salary change and a deactivation on the Employee detail screen.
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import type { EmployeeDetail, SalaryChange } from '../../api/types'
import { refuse } from '../../test/api'
import { META, salaryChange } from '../../test/data'
import { ASHA, fillSalaryChange, openEmployeeDetail } from './testSetup'

test('sends the new salary in minor units, the reason, and the server date as the effective date', async () => {
  let sent: unknown
  openEmployeeDetail({
    'POST /api/employees/7/salary-changes': (_url: URL, body: unknown) => {
      sent = body
      return salaryChange(2)
    },
  })

  const dialog = await fillSalaryChange('70000', 'Annual review')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

  await waitFor(() =>
    expect(sent).toEqual({
      new_salary_minor: 7_000_000,
      reason: 'Annual review',
      effective_date: META.today,
    }),
  )
})

test('shows the new salary and the new history row after a salary change', async () => {
  let current: EmployeeDetail = ASHA
  let history: SalaryChange[] = [salaryChange(1)]
  openEmployeeDetail({
    '/api/employees/7': () => current,
    '/api/employees/7/salary-changes': () => history,
    'POST /api/employees/7/salary-changes': () => {
      const change = salaryChange(2, {
        old_salary_minor: 6_500_000,
        new_salary_minor: 7_000_000,
        reason: 'Market adjustment',
      })
      current = { ...ASHA, salary_minor: 7_000_000 }
      history = [change, ...history]
      return change
    },
  })

  const dialog = await fillSalaryChange('70000', 'Market adjustment')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

  await waitFor(() => expect(screen.getByTestId('current-salary')).toHaveTextContent('$70,000'))
  expect(await screen.findByText('Market adjustment')).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('shows the cause when the API refuses the salary change', async () => {
  openEmployeeDetail({
    'POST /api/employees/7/salary-changes': refuse(422, [
      { field: 'new_salary_minor', cause: 'The new salary is equal to the current salary.' },
    ]),
  })

  const dialog = await fillSalaryChange('65000', 'No change')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

  expect(
    await within(dialog).findByText('The new salary is equal to the current salary.'),
  ).toBeInTheDocument()
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})

test('does not send a salary change without a reason', async () => {
  const api = openEmployeeDetail()

  await userEvent.click(await screen.findByRole('button', { name: 'Change salary' }))
  const dialog = await screen.findByRole('dialog')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

  expect(await within(dialog).findByText('Give a reason for the salary change.')).toBeInTheDocument()
  expect(api.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
})

test('deactivates the employee after the HR Manager confirms', async () => {
  let current: EmployeeDetail = ASHA
  openEmployeeDetail({
    '/api/employees/7': () => current,
    'POST /api/employees/7/deactivate': () => {
      current = { ...ASHA, status: 'inactive' }
      return current
    },
  })

  await userEvent.click(await screen.findByRole('button', { name: 'Deactivate' }))
  const dialog = await screen.findByRole('dialog')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Deactivate' }))

  expect(await screen.findByText('Inactive')).toBeInTheDocument()
})

test('an inactive employee has no salary change and no deactivate action', async () => {
  openEmployeeDetail({}, { ...ASHA, status: 'inactive' })

  await screen.findByRole('heading', { level: 1, name: 'Asha Rao' })

  expect(screen.queryByRole('button', { name: 'Change salary' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Deactivate' })).not.toBeInTheDocument()
})

test('shows the cause next to the effective date when the API refuses the date', async () => {
  openEmployeeDetail({
    'POST /api/employees/7/salary-changes': refuse(422, [
      { field: 'effective_date', cause: 'The effective date must not be before the hire date.' },
    ]),
  })

  const dialog = await fillSalaryChange('70000', 'Annual review')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

  expect(
    await within(dialog).findByText('The effective date must not be before the hire date.'),
  ).toBeInTheDocument()
})

test('shows an error that belongs to no input at the top of the dialog', async () => {
  openEmployeeDetail({
    'POST /api/employees/7/salary-changes': refuse(422, [
      { field: 'employee', cause: 'The employee is not active.' },
    ]),
  })

  const dialog = await fillSalaryChange('70000', 'Annual review')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

  expect(await within(dialog).findByText('The employee is not active.')).toBeInTheDocument()
})

test('shows an error for an input that the dialog does not have', async () => {
  openEmployeeDetail({
    'POST /api/employees/7/salary-changes': refuse(422, [
      { field: 'body', cause: 'The request is not valid.' },
    ]),
  })

  const dialog = await fillSalaryChange('70000', 'Annual review')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

  expect(await within(dialog).findByText('The request is not valid.')).toBeInTheDocument()
})

test('shows that the server did not respond when a salary change fails to send', async () => {
  openEmployeeDetail()

  const dialog = await fillSalaryChange('70000', 'Annual review')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

  expect(await within(dialog).findByText('The server did not respond.')).toBeInTheDocument()
})

test('sends nothing when the HR Manager cancels the salary change', async () => {
  const api = openEmployeeDetail()

  const dialog = await fillSalaryChange('70000', 'Annual review')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(api.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
})

test('shows the room to the band maximum for the new salary', async () => {
  openEmployeeDetail()

  // The band maximum of Asha is $78,000.
  const dialog = await fillSalaryChange('70000', 'Annual review')

  expect(within(dialog).getByText(/Room to the band maximum: \$8,000\./)).toBeInTheDocument()
})

test('states that a new salary is above the band maximum', async () => {
  openEmployeeDetail()

  const dialog = await fillSalaryChange('80000', 'Annual review')

  expect(within(dialog).getByText(/This salary is \$2,000 above the band maximum\./)).toBeInTheDocument()
})

test('sets the new salary from an increase in percent', async () => {
  let sent: unknown
  openEmployeeDetail({
    'POST /api/employees/7/salary-changes': (_url: URL, body: unknown) => {
      sent = body
      return salaryChange(2)
    },
  })
  await userEvent.click(await screen.findByRole('button', { name: 'Change salary' }))
  const dialog = await screen.findByRole('dialog')

  // The current salary of Asha is $65,000.
  const increase = within(dialog).getByLabelText(/Increase/)
  await userEvent.clear(increase)
  await userEvent.type(increase, '10')
  await userEvent.tab()
  await userEvent.type(within(dialog).getByLabelText(/Reason/), 'Annual review')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

  await waitFor(() => expect(sent).toMatchObject({ new_salary_minor: 7_150_000 }))
})

test('shows the increase in percent for a new salary', async () => {
  openEmployeeDetail()

  const dialog = await fillSalaryChange('71500', 'Annual review')

  expect(within(dialog).getByLabelText(/Increase/)).toHaveValue('10')
})

test('shows the salary band in the dialog', async () => {
  openEmployeeDetail()
  await userEvent.click(await screen.findByRole('button', { name: 'Change salary' }))
  const dialog = await screen.findByRole('dialog')

  // The band of Asha: $52,000, $65,000 and $78,000.
  expect(within(dialog).getByText('$52,000')).toBeInTheDocument()
  expect(within(dialog).getByText('$78,000')).toBeInTheDocument()
})
