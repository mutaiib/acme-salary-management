// FR-06, FR-08, FR-13: the Employee detail screen.
import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { refuse, stubApi } from '../../test/api'
import { band, META, salaryChange } from '../../test/data'
import { renderScreen } from '../../test/render'
import { EmployeeDetailPage } from './EmployeeDetailPage'
import { ASHA, openEmployeeDetail } from './testSetup'

test('shows the data and the current salary of the employee', async () => {
  openEmployeeDetail()

  expect(await screen.findByRole('heading', { level: 1, name: 'Asha Rao' })).toBeInTheDocument()
  expect(screen.getByText('E00007')).toBeInTheDocument()
  expect(screen.getByText('Software Engineer, Engineering')).toBeInTheDocument()
  expect(screen.getByTestId('current-salary')).toHaveTextContent(/^\$65,000$/)
})

test('shows the old salary, the new salary, the reason and the date of each salary change', async () => {
  openEmployeeDetail({
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
  openEmployeeDetail({
    '/api/employees/7/salary-changes': [
      salaryChange(1, { old_salary_minor: null, reason: 'First salary' }),
    ],
  })

  const row = (await screen.findByText('First salary')).closest('tr')!
  expect(within(row).getByText('None')).toBeInTheDocument()
})

test('shows a not found state for an employee that does not exist', async () => {
  stubApi({ '/api/employees/7': refuse(404, 'The employee does not exist.') })

  renderScreen(<EmployeeDetailPage />, { at: '/employees/7', path: '/employees/:id' })

  expect(await screen.findByText('Employee not found')).toBeInTheDocument()
})

test('shows the compa-ratio, the range penetration and the band of the employee', async () => {
  openEmployeeDetail(
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
  openEmployeeDetail({}, { ...ASHA, compa_ratio: 0.75, range_penetration: -12.5, range_status: 'below' })

  expect(await screen.findByText('Below range')).toBeInTheDocument()
})

test('marks an employee who is above range', async () => {
  openEmployeeDetail({}, { ...ASHA, compa_ratio: 1.3, range_penetration: 125.0, range_status: 'above' })

  expect(await screen.findByText('Above range')).toBeInTheDocument()
})

test('shows that an employee has no salary band', async () => {
  openEmployeeDetail(
    {},
    { ...ASHA, band: null, compa_ratio: null, range_penetration: null, range_status: 'no_band' },
  )

  expect(await screen.findByText('No salary band')).toBeInTheDocument()
  expect(screen.queryByTestId('compa-ratio')).not.toBeInTheDocument()
})

test('shows a whole range penetration with 1 decimal place', async () => {
  openEmployeeDetail({}, { ...ASHA, compa_ratio: 1, range_penetration: 50 })

  expect(await screen.findByTestId('range-penetration')).toHaveTextContent(/^50\.0%$/)
  expect(screen.getByTestId('compa-ratio')).toHaveTextContent(/^1\.00$/)
})

test('shows an empty state for an employee without a salary history', async () => {
  openEmployeeDetail({ '/api/employees/7/salary-changes': [] })

  expect(await screen.findByText('No salary history')).toBeInTheDocument()
})

test('shows a not found state for an employee id that is not a number', async () => {
  stubApi({ '/api/meta': META })

  renderScreen(<EmployeeDetailPage />, { at: '/employees/abc', path: '/employees/:id' })

  expect(await screen.findByText('Employee not found')).toBeInTheDocument()
})

test('shows the current salary with its label', async () => {
  openEmployeeDetail()

  const figure = await screen.findByRole('group', { name: 'Current salary' })
  expect(within(figure).getByText('$65,000')).toBeInTheDocument()
})
