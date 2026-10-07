import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import type { Employee, SalaryChange } from '../../api/types'
import { refuse, stubApi } from '../../test/api'
import { employee, salaryChange } from '../../test/data'
import { renderScreen } from '../../test/render'
import { EmployeeDetailPage } from './EmployeeDetailPage'

const ASHA = employee(7, { full_name: 'Asha Rao', salary_minor: 6_500_000 })

function open(replies: Record<string, unknown> = {}, who: Employee = ASHA) {
  const api = stubApi({
    '/api/employees/7': who,
    '/api/employees/7/salary-changes': [salaryChange(1)],
    ...replies,
  })
  renderScreen(<EmployeeDetailPage />, { at: '/employees/7', path: '/employees/:id' })
  return api
}

async function fillSalaryChange(salary: string, reason: string) {
  await userEvent.click(await screen.findByRole('button', { name: 'Change salary' }))
  const dialog = await screen.findByRole('dialog')
  const salaryInput = within(dialog).getByLabelText(/New salary/)
  await userEvent.clear(salaryInput)
  await userEvent.type(salaryInput, salary)
  await userEvent.tab()
  await userEvent.type(within(dialog).getByLabelText(/Reason/), reason)
  return dialog
}

test('shows the data and the current salary of the employee', async () => {
  open()

  expect(await screen.findByRole('heading', { level: 1, name: 'Asha Rao' })).toBeInTheDocument()
  expect(screen.getByText('E00007')).toBeInTheDocument()
  expect(screen.getByText('Software Engineer, Engineering')).toBeInTheDocument()
  expect(screen.getByTestId('current-salary')).toHaveTextContent('$65,000')
})

test('shows the old salary, the new salary, the reason and the date of each salary change', async () => {
  open({
    '/api/employees/7/salary-changes': [
      salaryChange(2, {
        old_salary_minor: 6_000_000,
        new_salary_minor: 6_500_000,
        reason: 'Promotion',
        effective_date: '2025-06-01',
        created_at: '2025-06-03T09:00:00',
      }),
    ],
  })

  const row = (await screen.findByText('Promotion')).closest('tr')!
  expect(within(row).getByText('$60,000')).toBeInTheDocument()
  expect(within(row).getByText('$65,000')).toBeInTheDocument()
  expect(within(row).getByText('1 Jun 2025')).toBeInTheDocument()
  expect(within(row).getByText('3 Jun 2025')).toBeInTheDocument()
})

test('shows no old salary for the first salary', async () => {
  open({
    '/api/employees/7/salary-changes': [
      salaryChange(1, { old_salary_minor: null, reason: 'First salary' }),
    ],
  })

  const row = (await screen.findByText('First salary')).closest('tr')!
  expect(within(row).getByText('None')).toBeInTheDocument()
})

test('sends the new salary in minor units with the reason and the date', async () => {
  let sent: unknown
  open({
    'POST /api/employees/7/salary-changes': (_url: URL, body: unknown) => {
      sent = body
      return salaryChange(2)
    },
  })

  const dialog = await fillSalaryChange('70000', 'Annual review')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

  await waitFor(() =>
    expect(sent).toMatchObject({ new_salary_minor: 7_000_000, reason: 'Annual review' }),
  )
  expect((sent as { effective_date: string }).effective_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
})

test('shows the new salary and the new history row after a salary change', async () => {
  let current: Employee = ASHA
  let history: SalaryChange[] = [salaryChange(1)]
  open({
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
  open({
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
  const api = open()

  await userEvent.click(await screen.findByRole('button', { name: 'Change salary' }))
  const dialog = await screen.findByRole('dialog')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

  expect(await within(dialog).findByText('Give a reason for the salary change.')).toBeInTheDocument()
  expect(api.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
})

test('deactivates the employee after the HR Manager confirms', async () => {
  let current: Employee = ASHA
  open({
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
  open({}, { ...ASHA, status: 'inactive' })

  await screen.findByRole('heading', { level: 1, name: 'Asha Rao' })

  expect(screen.queryByRole('button', { name: 'Change salary' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Deactivate' })).not.toBeInTheDocument()
})

test('shows a not found state for an employee that does not exist', async () => {
  stubApi({ '/api/employees/7': refuse(404, 'The employee does not exist.') })

  renderScreen(<EmployeeDetailPage />, { at: '/employees/7', path: '/employees/:id' })

  expect(await screen.findByText('Employee not found')).toBeInTheDocument()
})
