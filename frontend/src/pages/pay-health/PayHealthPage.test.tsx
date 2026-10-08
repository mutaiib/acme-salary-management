// FR-09, FR-10, FR-20: the Pay health screen.
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test, vi } from 'vitest'
import type { Outlier, PayHealthSummary } from '../../api/types'
import { requestsTo, stubApi } from '../../test/api'
import { META, pageOf } from '../../test/data'
import { renderScreen } from '../../test/render'
import { PayHealthPage } from './PayHealthPage'

afterEach(() => {
  vi.useRealTimers()
})

const SUMMARY: PayHealthSummary = {
  below_count: 290,
  above_count: 193,
  correction_cost_minor: 158_000_000,
  payroll_cost_minor: 56_768_345_500,
  reporting_currency: 'USD',
}

function outlier(number: number, overrides: Partial<Outlier> = {}): Outlier {
  return {
    id: number,
    employee_code: `E${String(number).padStart(5, '0')}`,
    full_name: `Employee ${number}`,
    job_title: 'Software Engineer',
    job_level: 2,
    department: 'Engineering',
    country: 'US',
    currency: 'USD',
    salary_minor: 4_500_000,
    range_status: 'below',
    band_limit_minor: 5_000_000,
    difference_minor: 500_000,
    ...overrides,
  }
}

const OUTLIERS_PATH = '/api/insights/pay-health/employees'
const GROUPS_PATH = '/api/insights/pay-health/groups'

test('shows the difference to the band limit with its sign, and as a share of the limit', async () => {
  stubPayHealth({
    [OUTLIERS_PATH]: pageOf([
      outlier(1),
      outlier(2, { range_status: 'above', salary_minor: 7_500_000, band_limit_minor: 7_000_000 }),
    ]),
  })

  renderScreen(<PayHealthPage />)

  const below = (await screen.findByText('Employee 1')).closest('tr')!
  expect(within(below).getByText('-$5,000')).toBeInTheDocument()
  expect(within(below).getByText('10.0% below the band minimum')).toBeInTheDocument()
  const above = screen.getByText('Employee 2').closest('tr')!
  expect(within(above).getByText('+$5,000')).toBeInTheDocument()
  expect(within(above).getByText('7.1% above the band maximum')).toBeInTheDocument()
  expect(screen.queryByRole('columnheader', { name: 'Range status' })).not.toBeInTheDocument()
})

test('opens the record of an outlier with the way back to Pay health', async () => {
  stubPayHealth({ [OUTLIERS_PATH]: pageOf([outlier(7, { full_name: 'Asha Rao' })]) })

  renderScreen(<PayHealthPage />, { at: '/pay-health?status=below', path: '/pay-health' })

  // The record gets the address of this list, with its filters, as the way back.
  expect(await screen.findByRole('link', { name: 'Asha Rao' })).toHaveAttribute(
    'href',
    '/employees/7?back=%2Fpay-health%3Fstatus%3Dbelow',
  )
})

function stubPayHealth(replies: Record<string, unknown> = {}) {
  return stubApi({
    '/api/meta': META,
    '/api/insights/pay-health': SUMMARY,
    [OUTLIERS_PATH]: pageOf([outlier(1)]),
        ...replies,
  })
}

test('shows the number of employees below range and above range', async () => {
  stubPayHealth()

  renderScreen(<PayHealthPage />)

  expect(await screen.findByTestId('below-count')).toHaveTextContent(/^290$/)
  expect(screen.getByTestId('above-count')).toHaveTextContent(/^193$/)
})

test('shows the correction cost in the reporting currency', async () => {
  stubPayHealth()

  renderScreen(<PayHealthPage />)

  expect(await screen.findByTestId('correction-cost')).toHaveTextContent(/^\$1.58M$/)
})

test('lists a below-range employee with the salary, the band minimum and the difference', async () => {
  stubPayHealth({
    [OUTLIERS_PATH]: pageOf([
      outlier(7, {
        full_name: 'Asha Rao',
        salary_minor: 4_500_000,
        band_limit_minor: 5_000_000,
        difference_minor: 500_000,
      }),
    ]),
  })

  renderScreen(<PayHealthPage />, { at: '/?status=below' })

  const row = (await screen.findByText('Asha Rao')).closest('tr')!
  expect(within(row).getByText('$45,000')).toBeInTheDocument()
  expect(within(row).getByText('$50,000')).toBeInTheDocument()
  expect(within(row).getByText('-$5,000')).toBeInTheDocument()
  expect(screen.getByRole('columnheader', { name: 'Band minimum' })).toBeInTheDocument()
})

function listOption(name: string) {
  return within(screen.getByRole('radiogroup', { name: 'Range status' })).getByRole('radio', { name })
}

test('lists all outliers first, with the range status of each one', async () => {
  const api = stubPayHealth({
    [OUTLIERS_PATH]: pageOf([
      outlier(1),
      outlier(9, { full_name: 'Over Paid', range_status: 'above', band_limit_minor: 7_000_000 }),
    ]),
  })
  renderScreen(<PayHealthPage />)

  const row = (await screen.findByText('Over Paid')).closest('tr')!
  expect(within(row).getByText('+$5,000')).toBeInTheDocument()
  expect(within(row).getByText('7.1% above the band maximum')).toBeInTheDocument()
  expect(requestsTo(api, OUTLIERS_PATH).at(-1)!.searchParams.get('status')).toBeNull()
  expect(
    screen.getByRole('heading', { level: 2, name: 'Employees outside the salary band' }),
  ).toBeVisible()
  expect(screen.getByRole('columnheader', { name: 'Band limit' })).toBeInTheDocument()
})

test('lists the above-range employees when the HR Manager selects Above range', async () => {
  const api = stubPayHealth({
    [OUTLIERS_PATH]: (url: URL) =>
      url.searchParams.get('status') === 'above'
        ? pageOf([outlier(9, { full_name: 'Over Paid', band_limit_minor: 7_000_000 })])
        : pageOf([outlier(1)]),
  })
  renderScreen(<PayHealthPage />)
  await screen.findByText('Employee 1')

  await userEvent.click(listOption('Above range'))

  expect(await screen.findByText('Over Paid')).toBeInTheDocument()
  expect(screen.getByRole('columnheader', { name: 'Band maximum' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 2, name: 'Employees above range' })).toBeVisible()
  expect(requestsTo(api, OUTLIERS_PATH).at(-1)!.searchParams.get('status')).toBe('above')
})

test('goes back to all outliers when the HR Manager selects All', async () => {
  const api = stubPayHealth()
  renderScreen(<PayHealthPage />, { at: '/?status=below' })
  await screen.findByText('Employee 1')
  expect(screen.getByRole('columnheader', { name: 'Band minimum' })).toBeInTheDocument()

  await userEvent.click(listOption('All'))

  await waitFor(() =>
    expect(requestsTo(api, OUTLIERS_PATH).at(-1)!.searchParams.get('status')).toBeNull(),
  )
})

test('shows the correction cost as a share of the payroll cost', async () => {
  stubPayHealth()

  renderScreen(<PayHealthPage />)

  const figure = await screen.findByRole('group', { name: 'Correction cost' })
  expect(within(figure).getByText(/0\.28% of the payroll cost/)).toBeInTheDocument()
})

test('asks for the number of rows that the HR Manager selects', async () => {
  const api = stubPayHealth({ [OUTLIERS_PATH]: pageOf([outlier(1)], 1, 290) })
  renderScreen(<PayHealthPage />, { at: '/?page_size=50' })
  await screen.findByText('Employee 1')

  expect(requestsTo(api, OUTLIERS_PATH).at(-1)!.searchParams.get('page_size')).toBe('50')
})

test('sends the filters in the address to the API', async () => {
  const api = stubPayHealth()

  renderScreen(<PayHealthPage />, { at: '/?status=above&country=IN&job_level=3' })
  await screen.findByText('Employee 1')

  const query = requestsTo(api, OUTLIERS_PATH).at(-1)!.searchParams
  expect(query.get('status')).toBe('above')
  expect(query.get('country')).toBe('IN')
  expect(query.get('job_level')).toBe('3')
})


test('shows the next page of the list', async () => {
  const api = stubPayHealth({ [OUTLIERS_PATH]: pageOf([outlier(1)], 1, 60) })
  renderScreen(<PayHealthPage />)
  await screen.findByText('Employee 1')

  await userEvent.click(screen.getByRole('button', { name: /next/i }))

  await waitFor(() =>
    expect(requestsTo(api, OUTLIERS_PATH).at(-1)!.searchParams.get('page')).toBe('2'),
  )
})

test('shows an empty state when no employee is outside the salary band', async () => {
  stubPayHealth({
    '/api/insights/pay-health': { ...SUMMARY, below_count: 0, above_count: 0 },
    [OUTLIERS_PATH]: pageOf([]),
  })

  renderScreen(<PayHealthPage />)

  expect(await screen.findByText('No employee is outside the salary band')).toBeInTheDocument()
})

test('shows an error message when the API does not respond', async () => {
  stubApi({})

  renderScreen(<PayHealthPage />)

  expect((await screen.findAllByText('The data did not load')).length).toBeGreaterThan(0)
})

/** Types with fake timers, so that a test controls the delay of the search. */
function fakeClock() {
  // The clock also moves with real time, so that `findBy` and `waitFor` can poll.
  // The test moves it past the delay of the search itself.
  vi.useFakeTimers({ shouldAdvanceTime: true })
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
}

function searchRequests(fetchStub: ReturnType<typeof stubApi>) {
  return requestsTo(fetchStub, OUTLIERS_PATH).filter((url) => url.searchParams.has('search'))
}

test('sends one search to the API after the HR Manager stops typing, from the first page', async () => {
  const api = stubPayHealth({ [OUTLIERS_PATH]: pageOf([outlier(1)], 3, 100) })
  const user = fakeClock()
  renderScreen(<PayHealthPage />, { at: '/?page=3' })
  await screen.findByText('Employee 1')

  await user.type(screen.getByRole('textbox', { name: 'Search' }), 'asha')
  expect(searchRequests(api)).toHaveLength(0)
  await act(() => vi.advanceTimersByTimeAsync(300))

  expect(searchRequests(api)).toHaveLength(1)
  const query = requestsTo(api, OUTLIERS_PATH).at(-1)!.searchParams
  expect(query.get('search')).toBe('asha')
  expect(query.get('page')).toBe('1')
})

test('sends the search in the address to the API and shows it in the box', async () => {
  const api = stubPayHealth()

  renderScreen(<PayHealthPage />, { at: '/?status=above&search=rao' })
  await screen.findByText('Employee 1')

  expect(requestsTo(api, OUTLIERS_PATH).at(-1)!.searchParams.get('search')).toBe('rao')
  expect(screen.getByRole('textbox', { name: 'Search' })).toHaveValue('rao')
})

test('does not request the outlier groups', async () => {
  const api = stubPayHealth()

  renderScreen(<PayHealthPage />)

  await screen.findByText('Employee 1')
  expect(requestsTo(api, GROUPS_PATH)).toHaveLength(0)
})

// FR-20: a list that a chart opened.

test('sends the department in the address to the API', async () => {
  const api = stubPayHealth()

  renderScreen(<PayHealthPage />, { at: '/?status=below&department=Sales' })
  await screen.findByText('Employee 1')

  expect(requestsTo(api, OUTLIERS_PATH).at(-1)?.searchParams.get('department')).toBe('Sales')
})

test('sends the department when the HR Manager selects a department', async () => {
  const api = stubPayHealth()
  renderScreen(<PayHealthPage />)
  await screen.findByText('Employee 1')

  await userEvent.click(screen.getByRole('combobox', { name: 'Department' }))
  await userEvent.click(await screen.findByRole('option', { name: 'Sales' }))

  await waitFor(() =>
    expect(requestsTo(api, OUTLIERS_PATH).at(-1)?.searchParams.get('department')).toBe('Sales'),
  )
})

test('shows a link back to the view of Pay analysis that the address names', async () => {
  stubPayHealth()
  const back = new URLSearchParams({ back: '/analysis?tab=outliers&group_by=job_level' })

  renderScreen(<PayHealthPage />, { at: `/?status=below&country=US&${back}` })

  expect(await screen.findByRole('link', { name: 'Back to Pay analysis' })).toHaveAttribute(
    'href',
    '/analysis?tab=outliers&group_by=job_level',
  )
})

test('shows no link back to Pay analysis for a list that no chart opened', async () => {
  stubPayHealth()

  renderScreen(<PayHealthPage />)
  await screen.findByText('Employee 1')

  expect(screen.queryByRole('link', { name: 'Back to Pay analysis' })).toBeNull()
})
