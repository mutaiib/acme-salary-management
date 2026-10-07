// FR-03: the Employees screen.
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link } from 'react-router-dom'
import { afterEach, expect, test, vi } from 'vitest'
import { refuse, requestsTo, stubApi } from '../../test/api'
import { employee, META, pageOf } from '../../test/data'
import { renderScreen } from '../../test/render'
import { EmployeesPage } from './EmployeesPage'

afterEach(() => {
  vi.useRealTimers()
})

function lastQuery(fetchStub: ReturnType<typeof stubApi>) {
  return requestsTo(fetchStub, '/api/employees').at(-1)!.searchParams
}

test('shows the pay data of each employee', async () => {
  stubApi({
    '/api/meta': META,
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
  expect(within(row).getByText('Level 3')).toBeInTheDocument()
  expect(within(row).getByText('Engineering')).toBeInTheDocument()
  expect(within(row).getByText('IN')).toBeInTheDocument()
  expect(within(row).getByText('₹2,500,000')).toBeInTheDocument()
})

test('shows the total number of employees', async () => {
  stubApi({ '/api/meta': META, '/api/employees': pageOf([employee(1)], 1, 10_000) })

  renderScreen(<EmployeesPage />)

  expect(await screen.findByText('10,000 employees')).toBeInTheDocument()
})

test('shows the next page when the HR Manager goes to the next page', async () => {
  stubApi({
    '/api/meta': META,
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

/** Types with fake timers, so that a test controls the delay of the search. */
function fakeClock() {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
}

function searchRequests(fetchStub: ReturnType<typeof stubApi>) {
  return requestsTo(fetchStub, '/api/employees').filter((url) => url.searchParams.has('search'))
}

test('sends one search to the API after the HR Manager stops typing', async () => {
  const api = stubApi({ '/api/meta': META, '/api/employees': pageOf([employee(1)]) })
  const user = fakeClock()
  renderScreen(<EmployeesPage />)
  await screen.findByText('Employee 1')

  await user.type(screen.getByRole('textbox', { name: 'Search' }), 'asha')
  expect(searchRequests(api)).toHaveLength(0)
  await act(() => vi.advanceTimersByTimeAsync(300))

  expect(searchRequests(api)).toHaveLength(1)
  expect(lastQuery(api).get('search')).toBe('asha')
})

test('goes back to the first page when the search text changes', async () => {
  const api = stubApi({ '/api/meta': META, '/api/employees': pageOf([employee(1)], 3, 100) })
  const user = fakeClock()
  renderScreen(<EmployeesPage />, { at: '/?page=3' })
  await screen.findByText('Employee 1')

  await user.type(screen.getByRole('textbox', { name: 'Search' }), 'asha')
  await act(() => vi.advanceTimersByTimeAsync(300))

  expect(lastQuery(api).get('search')).toBe('asha')
  expect(lastQuery(api).get('page')).toBe('1')
})

test('sends the filters in the address to the API', async () => {
  const api = stubApi({ '/api/meta': META, '/api/employees': pageOf([employee(1)]) })

  renderScreen(<EmployeesPage />, {
    at: '/?country=IN&department=Sales&job_level=4&status=inactive&sort=name',
  })
  await screen.findByText('Employee 1')

  const query = lastQuery(api)
  expect(query.get('country')).toBe('IN')
  expect(query.get('department')).toBe('Sales')
  expect(query.get('job_level')).toBe('4')
  expect(query.get('status')).toBe('inactive')
  expect(query.get('sort')).toBe('name')
})

test('shows an empty state when no employee matches', async () => {
  stubApi({ '/api/meta': META, '/api/employees': pageOf([]) })

  renderScreen(<EmployeesPage />, { at: '/?search=nobody' })

  expect(await screen.findByText('No employee matches')).toBeInTheDocument()
})

test('links each employee to the Employee detail screen', async () => {
  stubApi({ '/api/meta': META, '/api/employees': pageOf([employee(7, { full_name: 'Asha Rao' })]) })

  renderScreen(<EmployeesPage />)

  expect(await screen.findByRole('link', { name: 'Asha Rao' })).toHaveAttribute(
    'href',
    '/employees/7',
  )
})

test('shows a badge for an inactive employee', async () => {
  stubApi({
    '/api/meta': META,
    '/api/employees': pageOf([employee(1, { status: 'inactive' })]),
  })

  renderScreen(<EmployeesPage />)

  expect(await screen.findByText('Inactive')).toBeInTheDocument()
})

test('shows the previous page when the HR Manager goes back', async () => {
  const api = stubApi({
    '/api/meta': META,
    '/api/employees': (url: URL) =>
      url.searchParams.get('page') === '2'
        ? pageOf([employee(26, { full_name: 'Second Page' })], 2, 30)
        : pageOf([employee(1, { full_name: 'First Page' })], 1, 30),
  })
  renderScreen(<EmployeesPage />, { at: '/?page=2' })
  await screen.findByText('Second Page')

  await userEvent.click(screen.getByRole('button', { name: /previous/i }))

  expect(await screen.findByText('First Page')).toBeInTheDocument()
  expect(lastQuery(api).get('page')).toBe('1')
})

test('sends the country to the API when the HR Manager selects a country', async () => {
  const api = stubApi({ '/api/meta': META, '/api/employees': pageOf([employee(1)]) })
  renderScreen(<EmployeesPage />)
  await screen.findByText('Employee 1')

  await userEvent.click(screen.getByRole('combobox', { name: 'Country' }))
  await userEvent.click(await screen.findByRole('option', { name: 'India' }))

  await waitFor(() => expect(lastQuery(api).get('country')).toBe('IN'))
})

test('sends the sort to the API when the HR Manager selects a sort', async () => {
  const api = stubApi({ '/api/meta': META, '/api/employees': pageOf([employee(1)]) })
  renderScreen(<EmployeesPage />)
  await screen.findByText('Employee 1')

  await userEvent.click(screen.getByRole('combobox', { name: 'Sort by' }))
  await userEvent.click(await screen.findByRole('option', { name: 'Name' }))

  await waitFor(() => expect(lastQuery(api).get('sort')).toBe('name'))
})

test('clears the search box when the address loses the search text', async () => {
  const api = stubApi({ '/api/meta': META, '/api/employees': pageOf([employee(1)]) })
  renderScreen(
    <>
      <Link to="/">Employees link</Link>
      <EmployeesPage />
    </>,
    { at: '/?search=asha' },
  )
  await screen.findByText('Employee 1')
  expect(screen.getByRole('textbox', { name: 'Search' })).toHaveValue('asha')

  await userEvent.click(screen.getByRole('link', { name: 'Employees link' }))

  await waitFor(() => expect(screen.getByRole('textbox', { name: 'Search' })).toHaveValue(''))
  await waitFor(() => expect(lastQuery(api).get('search')).toBeNull())
})

test('uses the first page for a page number in the address that is not valid', async () => {
  const api = stubApi({ '/api/meta': META, '/api/employees': pageOf([employee(1)]) })

  renderScreen(<EmployeesPage />, { at: '/?page=-3' })
  await screen.findByText('Employee 1')

  expect(lastQuery(api).get('page')).toBe('1')
})

test('tells the HR Manager when the filter values did not load', async () => {
  stubApi({ '/api/employees': pageOf([employee(1)]) })

  renderScreen(<EmployeesPage />)

  expect(await screen.findByText('The filter values did not load')).toBeInTheDocument()
  expect(screen.getByText('Employee 1')).toBeInTheDocument()
})

test('loads the data again when the HR Manager selects Try again', async () => {
  let isUp = false
  stubApi({
    '/api/meta': META,
    '/api/employees': () => (isUp ? pageOf([employee(1)]) : refuse(500, 'The server failed.')),
  })
  renderScreen(<EmployeesPage />)
  await screen.findByText('The data did not load')

  isUp = true
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

  expect(await screen.findByText('Employee 1')).toBeInTheDocument()
  expect(screen.queryByText('The data did not load')).not.toBeInTheDocument()
})
