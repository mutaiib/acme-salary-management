import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import type { Employee } from '../../api/types'
import { stubApi } from '../../test/api'
import { renderScreen } from '../../test/render'
import { EmployeesPage } from './EmployeesPage'

function employee(number: number, overrides: Partial<Employee> = {}): Employee {
  return {
    id: number,
    employee_code: `E${String(number).padStart(5, '0')}`,
    full_name: `Employee ${number}`,
    email: `employee${number}@acme.example`,
    job_title: 'Software Engineer',
    job_level: 2,
    department: 'Engineering',
    country: 'US',
    currency: 'USD',
    salary_minor: 6_500_000,
    gender: 'female',
    hire_date: '2022-01-10',
    status: 'active',
    ...overrides,
  }
}

function pageOf(items: Employee[], page = 1, total = items.length) {
  return { items, page, page_size: 25, total }
}

test('shows the pay data of each employee', async () => {
  stubApi({
    '/api/employees': pageOf([
      employee(1, {
        full_name: 'Asha Rao',
        job_title: 'Senior Software Engineer',
        job_level: 3,
        country: 'IN',
        currency: 'INR',
        salary_minor: 250_000_000,
      }),
    ]),
  })

  renderScreen(<EmployeesPage />)

  const row = (await screen.findByText('Asha Rao')).closest('tr')!
  expect(within(row).getByText('E00001')).toBeInTheDocument()
  expect(within(row).getByText('Senior Software Engineer')).toBeInTheDocument()
  expect(within(row).getByText('Engineering')).toBeInTheDocument()
  expect(within(row).getByText('IN')).toBeInTheDocument()
  expect(within(row).getByText('₹2,500,000')).toBeInTheDocument()
})

test('shows the total number of employees', async () => {
  stubApi({ '/api/employees': pageOf([employee(1)], 1, 10_000) })

  renderScreen(<EmployeesPage />)

  expect(await screen.findByText('10,000 employees')).toBeInTheDocument()
})

test('shows the next page when the HR Manager goes to the next page', async () => {
  stubApi({
    '/api/employees': (url: URL) =>
      url.searchParams.get('page') === '2'
        ? pageOf([employee(26, { full_name: 'Second Page' })], 2, 30)
        : pageOf([employee(1, { full_name: 'First Page' })], 1, 30),
  })
  renderScreen(<EmployeesPage />)
  await screen.findByText('First Page')

  await userEvent.click(screen.getByRole('button', { name: /next/i }))

  expect(await screen.findByText('Second Page')).toBeInTheDocument()
  expect(screen.queryByText('First Page')).not.toBeInTheDocument()
})

test('shows an error message when the API does not respond', async () => {
  stubApi({})

  renderScreen(<EmployeesPage />)

  expect(await screen.findByText('The data did not load')).toBeInTheDocument()
})
