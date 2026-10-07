// FR-04, FR-05, FR-06, FR-08, FR-13: the Employee detail screen.
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import type { EmployeeDetail, SalaryChange } from '../../api/types'
import { refuse, stubApi } from '../../test/api'
import { band, employeeDetail, META, salaryChange } from '../../test/data'
import { renderScreen } from '../../test/render'
import { EmployeeDetailPage } from './EmployeeDetailPage'

const ASHA = employeeDetail(7, { full_name: 'Asha Rao', salary_minor: 6_500_000 })

function open(replies: Record<string, unknown> = {}, who: EmployeeDetail = ASHA) {
  const api = stubApi({
    '/api/meta': META,
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
  expect(screen.getByTestId('current-salary')).toHaveTextContent(/^\$65,000$/)
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

test('sends the new salary in minor units, the reason, and the server date as the effective date', async () => {
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
  let current: EmployeeDetail = ASHA
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

test('shows the compa-ratio, the range penetration and the band of the employee', async () => {
  open(
    {},
    {
      ...ASHA,
      salary_minor: 4_500_000,
      band: band(1, { min_minor: 3_500_000, mid_minor: 5_000_000, max_minor: 6_500_000 }),
      compa_ratio: 0.9,
      range_penetration: 33.3,
      range_status: 'in_range',
    },
  )

  expect(await screen.findByTestId('compa-ratio')).toHaveTextContent(/^0\.90$/)
  expect(screen.getByTestId('range-penetration')).toHaveTextContent(/^33\.3%$/)
  const section = within(screen.getByTestId('position-in-range'))
  expect(section.getByText('In range')).toBeInTheDocument()
  expect(section.getByText('$35,000')).toBeInTheDocument()
  expect(section.getByText('$65,000')).toBeInTheDocument()
})

test('marks an employee who is below range', async () => {
  open({}, { ...ASHA, compa_ratio: 0.75, range_penetration: -12.5, range_status: 'below' })

  expect(await screen.findByText('Below range')).toBeInTheDocument()
})

test('marks an employee who is above range', async () => {
  open({}, { ...ASHA, compa_ratio: 1.3, range_penetration: 125.0, range_status: 'above' })

  expect(await screen.findByText('Above range')).toBeInTheDocument()
})

test('shows that an employee has no salary band', async () => {
  open(
    {},
    { ...ASHA, band: null, compa_ratio: null, range_penetration: null, range_status: 'no_band' },
  )

  expect(await screen.findByText('No salary band')).toBeInTheDocument()
  expect(screen.queryByTestId('compa-ratio')).not.toBeInTheDocument()
})

test('shows a whole range penetration with 1 decimal place', async () => {
  open({}, { ...ASHA, compa_ratio: 1, range_penetration: 50 })

  expect(await screen.findByTestId('range-penetration')).toHaveTextContent(/^50\.0%$/)
  expect(screen.getByTestId('compa-ratio')).toHaveTextContent(/^1\.00$/)
})

test('shows the cause next to the effective date when the API refuses the date', async () => {
  open({
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

test('shows the cause when the API refuses a salary of zero', async () => {
  open({
    'POST /api/employees/7/salary-changes': refuse(422, [
      { field: 'new_salary_minor', cause: 'The salary must be more than zero.' },
    ]),
  })

  const dialog = await fillSalaryChange('0', 'Annual review')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

  expect(await within(dialog).findByText('The salary must be more than zero.')).toBeInTheDocument()
})

test('shows an empty state for an employee without a salary history', async () => {
  open({ '/api/employees/7/salary-changes': [] })

  expect(await screen.findByText('No salary history')).toBeInTheDocument()
})
