// FR-03: the Employees screen.
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link } from 'react-router-dom'
import { afterEach, expect, test, vi } from 'vitest'
import type { EmployeeSummary } from '../../api/types'
import { refuse, requestsTo, stubApi } from '../../test/api'
import { employee, META, pageOf } from '../../test/data'
import { renderScreen } from '../../test/render'
import { EmployeesPage } from './EmployeesPage'

afterEach(() => {
  vi.useRealTimers()
})

/** A summary of a list that has no active employee, so the summary block does not show. */
const NO_SUMMARY: EmployeeSummary = {
  headcount: 0,
  payroll_cost_minor: 0,
  reporting_currency: 'USD',
  has_one_currency: true,
  salary: null,
}

const GERMANY_ENGINEERING: EmployeeSummary = {
  headcount: 340,
  payroll_cost_minor: 2_142_655_200,
  reporting_currency: 'USD',
  has_one_currency: true,
  salary: { currency: 'EUR', min_minor: 2_400_000, median_minor: 5_170_000, max_minor: 17_040_000 },
}

function lastQuery(fetchStub: ReturnType<typeof stubApi>) {
  return requestsTo(fetchStub, '/api/employees').at(-1)!.searchParams
}

test('shows the pay data of each employee', async () => {
  stubApi({
    '/api/meta': META,
    '/api/employees/summary': NO_SUMMARY,
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
  expect(within(row).getByText('India')).toBeInTheDocument()
  expect(within(row).getByText('₹2,500,000')).toBeInTheDocument()
})

test('shows the total number of employees', async () => {
  stubApi({ '/api/meta': META,
    '/api/employees/summary': NO_SUMMARY, '/api/employees': pageOf([employee(1)], 1, 10_000) })

  renderScreen(<EmployeesPage />)

  expect(await screen.findByText(/^10,000 employees\./)).toBeInTheDocument()
})

test('shows the next page when the HR Manager goes to the next page', async () => {
  stubApi({
    '/api/meta': META,
    '/api/employees/summary': NO_SUMMARY,
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
  // The clock also moves with real time, so that `findBy` and `waitFor` can poll.
  // The test moves it past the delay of the search itself.
  vi.useFakeTimers({ shouldAdvanceTime: true })
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
}

function searchRequests(fetchStub: ReturnType<typeof stubApi>) {
  return requestsTo(fetchStub, '/api/employees').filter((url) => url.searchParams.has('search'))
}

test('sends one search to the API after the HR Manager stops typing', async () => {
  const api = stubApi({ '/api/meta': META,
    '/api/employees/summary': NO_SUMMARY, '/api/employees': pageOf([employee(1)]) })
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
  const api = stubApi({ '/api/meta': META,
    '/api/employees/summary': NO_SUMMARY, '/api/employees': pageOf([employee(1)], 3, 100) })
  const user = fakeClock()
  renderScreen(<EmployeesPage />, { at: '/?page=3' })
  await screen.findByText('Employee 1')

  await user.type(screen.getByRole('textbox', { name: 'Search' }), 'asha')
  await act(() => vi.advanceTimersByTimeAsync(300))

  expect(lastQuery(api).get('search')).toBe('asha')
  expect(lastQuery(api).get('page')).toBe('1')
})

test('sends the filters in the address to the API', async () => {
  const api = stubApi({ '/api/meta': META,
    '/api/employees/summary': NO_SUMMARY, '/api/employees': pageOf([employee(1)]) })

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
  stubApi({ '/api/meta': META,
    '/api/employees/summary': NO_SUMMARY, '/api/employees': pageOf([]) })

  renderScreen(<EmployeesPage />, { at: '/?search=nobody' })

  expect(await screen.findByText('No employee matches')).toBeInTheDocument()
})

test('links each employee to the Employee detail screen', async () => {
  stubApi({ '/api/meta': META,
    '/api/employees/summary': NO_SUMMARY, '/api/employees': pageOf([employee(7, { full_name: 'Asha Rao' })]) })

  renderScreen(<EmployeesPage />)

  expect(await screen.findByRole('link', { name: 'Asha Rao' })).toHaveAttribute(
    'href',
    '/employees/7',
  )
})

test('shows a badge for an inactive employee', async () => {
  stubApi({
    '/api/meta': META,
    '/api/employees/summary': NO_SUMMARY,
    '/api/employees': pageOf([employee(1, { status: 'inactive' })]),
  })

  renderScreen(<EmployeesPage />)

  expect(await screen.findByText('Inactive')).toBeInTheDocument()
})

test('shows the previous page when the HR Manager goes back', async () => {
  const api = stubApi({
    '/api/meta': META,
    '/api/employees/summary': NO_SUMMARY,
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
  const api = stubApi({ '/api/meta': META,
    '/api/employees/summary': NO_SUMMARY, '/api/employees': pageOf([employee(1)]) })
  renderScreen(<EmployeesPage />)
  await screen.findByText('Employee 1')

  await userEvent.click(screen.getByRole('combobox', { name: 'Country' }))
  await userEvent.click(await screen.findByRole('option', { name: 'India' }))

  await waitFor(() => expect(lastQuery(api).get('country')).toBe('IN'))
})

test('sends the status to the API when the HR Manager selects a status', async () => {
  const api = stubApi({ '/api/meta': META,
    '/api/employees/summary': NO_SUMMARY, '/api/employees': pageOf([employee(1)]) })
  renderScreen(<EmployeesPage />)
  await screen.findByText('Employee 1')
  const status = screen.getByRole('radiogroup', { name: 'Status' })

  await userEvent.click(within(status).getByRole('radio', { name: 'Inactive' }))
  await waitFor(() => expect(lastQuery(api).get('status')).toBe('inactive'))

  await userEvent.click(within(status).getByRole('radio', { name: 'All' }))
  await waitFor(() => expect(lastQuery(api).get('status')).toBeNull())
})

test('sends the sort to the API when the HR Manager selects a sort', async () => {
  const api = stubApi({ '/api/meta': META,
    '/api/employees/summary': NO_SUMMARY, '/api/employees': pageOf([employee(1)]) })
  renderScreen(<EmployeesPage />)
  await screen.findByText('Employee 1')

  await userEvent.click(screen.getByRole('combobox', { name: 'Sort by' }))
  await userEvent.click(await screen.findByRole('option', { name: 'Name' }))

  await waitFor(() => expect(lastQuery(api).get('sort')).toBe('name'))
})

test('clears the search box when the address loses the search text', async () => {
  const api = stubApi({ '/api/meta': META,
    '/api/employees/summary': NO_SUMMARY, '/api/employees': pageOf([employee(1)]) })
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
  const api = stubApi({ '/api/meta': META,
    '/api/employees/summary': NO_SUMMARY, '/api/employees': pageOf([employee(1)]) })

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
    '/api/employees/summary': NO_SUMMARY,
    '/api/employees': () => (isUp ? pageOf([employee(1)]) : refuse(500, 'The server failed.')),
  })
  renderScreen(<EmployeesPage />)
  await screen.findByText('The data did not load')

  isUp = true
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

  expect(await screen.findByText('Employee 1')).toBeInTheDocument()
  expect(screen.queryByText('The data did not load')).not.toBeInTheDocument()
})

test('answers in words what the listed employees get', async () => {
  stubApi({
    '/api/meta': META,
    '/api/employees': pageOf([employee(1)]),
    '/api/employees/summary': GERMANY_ENGINEERING,
  })

  renderScreen(<EmployeesPage />, { at: '/?country=DE&department=Engineering' })

  const answer = await screen.findByRole('region', { name: 'The pay of these employees' })
  const figure = (label: string) => within(answer).getByRole('group', { name: label })
  expect(within(figure('Active employees')).getByText('340')).toBeInTheDocument()
  expect(within(figure('Payroll cost')).getByText('$21.43M')).toBeInTheDocument()
  expect(within(figure('Payroll cost')).getByText('For one year, in USD')).toBeInTheDocument()
  expect(within(figure('Median salary')).getByText('€51,700')).toBeInTheDocument()
  expect(within(figure('Median salary')).getByText('For one year, in EUR')).toBeInTheDocument()
  expect(
    within(figure('Median salary')).getByRole('button', { name: 'What is this: Median salary?' }),
  ).toBeInTheDocument()
  expect(
    within(answer).getByText('The lowest salary is €24,000, and the highest is €170,400.'),
  ).toBeInTheDocument()
})

test('asks for the pay figures with the search and the filters of the list', async () => {
  const api = stubApi({
    '/api/meta': META,
    '/api/employees': pageOf([employee(1)]),
    '/api/employees/summary': GERMANY_ENGINEERING,
  })

  renderScreen(<EmployeesPage />, {
    at: '/?search=asha&country=DE&department=Engineering&job_level=3&status=active&page=2',
  })
  await screen.findByRole('region', { name: 'The pay of these employees' })

  const query = requestsTo(api, '/api/employees/summary').at(-1)!.searchParams
  expect(Object.fromEntries(query)).toEqual({
    search: 'asha',
    country: 'DE',
    department: 'Engineering',
    job_level: '3',
    status: 'active',
  })
})

test('shows no pay figures when the list has no active employee', async () => {
  stubApi({
    '/api/meta': META,
    '/api/employees': pageOf([employee(1, { status: 'inactive' })]),
    '/api/employees/summary': NO_SUMMARY,
  })

  renderScreen(<EmployeesPage />, { at: '/?status=inactive' })
  await screen.findByText('Employee 1')

  expect(screen.queryByRole('region', { name: 'The pay of these employees' })).not.toBeInTheDocument()
})

test('keeps the list when the pay figures do not load', async () => {
  stubApi({ '/api/meta': META, '/api/employees': pageOf([employee(1)]) })

  renderScreen(<EmployeesPage />)

  expect(await screen.findByText('Employee 1')).toBeInTheDocument()
  expect(await screen.findByText('The pay figures did not load.')).toBeInTheDocument()
})

test('asks for the number of rows in the address', async () => {
  const api = stubApi({
    '/api/meta': META,
    '/api/employees/summary': NO_SUMMARY,
    '/api/employees': pageOf([employee(1)], 1, 10_000),
  })

  renderScreen(<EmployeesPage />, { at: '/?page_size=100' })
  await screen.findByText('Employee 1')

  expect(lastQuery(api).get('page_size')).toBe('100')
})

test('shows no badge in a list of inactive employees only', async () => {
  stubApi({
    '/api/meta': META,
    '/api/employees/summary': NO_SUMMARY,
    '/api/employees': pageOf([employee(1, { status: 'inactive' })]),
  })

  renderScreen(<EmployeesPage />, { at: '/?status=inactive' })

  const row = (await screen.findByText('Employee 1')).closest('tr')!
  expect(within(row).queryByText('Inactive')).not.toBeInTheDocument()
})
