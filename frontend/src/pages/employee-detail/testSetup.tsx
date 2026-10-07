import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { EmployeeDetail } from '../../api/types'
import { stubApi } from '../../test/api'
import { employeeDetail, META, salaryChange } from '../../test/data'
import { renderScreen } from '../../test/render'
import { EmployeeDetailPage } from './EmployeeDetailPage'

/** The employee of the Employee detail tests: an active employee with a salary of $65,000. */
export const ASHA = employeeDetail(7, { full_name: 'Asha Rao', salary_minor: 6_500_000 })

/** Opens the Employee detail screen of Asha. A test gives only the replies that it changes. */
export function openEmployeeDetail(
  replies: Record<string, unknown> = {},
  who: EmployeeDetail = ASHA,
) {
  const api = stubApi({
    '/api/meta': META,
    '/api/employees/7': who,
    '/api/employees/7/salary-changes': [salaryChange(1)],
    ...replies,
  })
  renderScreen(<EmployeeDetailPage />, { at: '/employees/7', path: '/employees/:id' })
  return api
}

/** Opens the salary change dialog and types a new salary and a reason. */
export async function fillSalaryChange(salary: string, reason: string) {
  await userEvent.click(await screen.findByRole('button', { name: 'Change salary' }))
  const dialog = await screen.findByRole('dialog')
  const salaryInput = within(dialog).getByLabelText(/New salary/)
  await userEvent.clear(salaryInput)
  await userEvent.type(salaryInput, salary)
  await userEvent.tab()
  await userEvent.type(within(dialog).getByLabelText(/Reason/), reason)
  return dialog
}
