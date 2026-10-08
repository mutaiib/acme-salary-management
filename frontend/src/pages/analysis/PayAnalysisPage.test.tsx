// FR-17, FR-18, FR-19, FR-20: the Pay analysis screen.
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router-dom'
import { afterEach, expect, test, vi } from 'vitest'
import type { HighSalary, OutlierGroup, SalaryDistribution } from '../../api/types'
import { refuse, requestsTo, stubApi } from '../../test/api'
import { SHOW_LOAD_AFTER_MS } from '../../hooks/useIsLate'
import { META } from '../../test/data'
import { renderScreen } from '../../test/render'
import { PayAnalysisPage } from './PayAnalysisPage'

// jsdom gives a chart no size, so a test cannot click a bar. These two doubles keep the real
// chart and add one button that makes the call that a click on a bar makes.
vi.mock('./SalaryDistributionChart', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./SalaryDistributionChart')>()
  return {
    ...actual,
    SalaryDistributionChart: (props: Parameters<typeof actual.SalaryDistributionChart>[0]) => (
      <>
        <actual.SalaryDistributionChart {...props} />
        <button onClick={() => props.onSelect(props.distribution.brackets[2])}>
          Click the last bar
        </button>
      </>
    ),
  }
})
vi.mock('./OutlierGroupChart', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./OutlierGroupChart')>()
  return {
    ...actual,
    OutlierGroupChart: (props: Parameters<typeof actual.OutlierGroupChart>[0]) => (
      <>
        <actual.OutlierGroupChart {...props} />
        <button onClick={() => props.onSelect(props.groups[0], 'below')}>
          Click the below part of the first bar
        </button>
      </>
    ),
  }
})

afterEach(() => {
  vi.useRealTimers()
})

const DISTRIBUTION_PATH = '/api/insights/salary-distribution'
const GROUPS_PATH = '/api/insights/pay-health/groups'
const HIGHEST_PATH = '/api/insights/highest-salaries'

const DISTRIBUTION: SalaryDistribution = {
  reporting_currency: 'USD',
  bracket_width_minor: 2_000_000,
  brackets: [
    { from_minor: 0, to_minor: 2_000_000, headcount: 1 },
    { from_minor: 2_000_000, to_minor: 4_000_000, headcount: 0 },
    { from_minor: 4_000_000, to_minor: 6_000_000, headcount: 3 },
  ],
}

const COUNTRY_GROUPS: OutlierGroup[] = [
  { key: 'US', label: 'United States', headcount: 50, below_count: 7, above_count: 3 },
  { key: 'DE', label: 'Germany', headcount: 20, below_count: 2, above_count: 1 },
]

function highSalary(number: number, overrides: Partial<HighSalary> = {}): HighSalary {
  return {
    id: number,
    employee_code: `E${number}`,
    full_name: `Employee ${number}`,
    job_title: 'Director',
    job_level: 5,
    department: 'Engineering',
    country: 'US',
    currency: 'USD',
    salary_minor: 30_000_000,
    salary_reporting_minor: 30_000_000,
    compa_ratio: 1.25,
    ...overrides,
  }
}

const HIGHEST = [
  highSalary(1),
  highSalary(2, {
    country: 'DE',
    currency: 'EUR',
    salary_minor: 25_000_000,
    salary_reporting_minor: 27_500_000,
    compa_ratio: null,
  }),
]

const META_WITH_GERMANY = {
  ...META,
  countries: [...META.countries, { code: 'DE', name: 'Germany', currency: 'EUR' }],
}

function stubAnalysis(replies: Record<string, unknown> = {}) {
  return stubApi({
    '/api/meta': META_WITH_GERMANY,
    [DISTRIBUTION_PATH]: DISTRIBUTION,
    [GROUPS_PATH]: COUNTRY_GROUPS,
    [HIGHEST_PATH]: HIGHEST,
    ...replies,
  })
}

function AddressProbe() {
  const { pathname, search } = useLocation()
  return <output data-testid="address">{pathname + search}</output>
}

/** Renders the screen with a probe that shows the address, so a test can read where a click goes. */
function renderWithAddress(at: string) {
  renderScreen(
    <>
      <PayAnalysisPage />
      <AddressProbe />
    </>,
    { at },
  )
}

const address = () => screen.getByTestId('address').textContent

function tab(name: string) {
  return screen.getByRole('tab', { name })
}

test('shows the 3 tabs, with the salary distribution open at first', async () => {
  stubAnalysis()

  renderScreen(<PayAnalysisPage />)

  expect(screen.getByRole('heading', { level: 1, name: 'Pay analysis' })).toBeInTheDocument()
  expect(screen.getAllByRole('tab')).toHaveLength(3)
  expect(tab('Salary distribution')).toBeInTheDocument()
  expect(tab('Outliers by group')).toBeInTheDocument()
  expect(tab('Highest salaries')).toBeInTheDocument()
  expect(tab('Salary distribution')).toHaveAttribute('aria-selected', 'true')
  expect(await screen.findByRole('region', { name: 'Salary distribution' })).toBeInTheDocument()
})

test('opens a tab when the HR Manager clicks it', async () => {
  stubAnalysis()
  renderScreen(<PayAnalysisPage />)
  await screen.findByRole('region', { name: 'Salary distribution' })

  await userEvent.click(tab('Outliers by group'))

  expect(await screen.findByRole('region', { name: 'Outliers by country' })).toBeInTheDocument()
  expect(tab('Outliers by group')).toHaveAttribute('aria-selected', 'true')
  expect(screen.queryByRole('region', { name: 'Salary distribution' })).toBeNull()
})

test('opens the tab that the address names', async () => {
  stubAnalysis()

  renderScreen(<PayAnalysisPage />, { at: '/?tab=highest' })

  expect(await screen.findByRole('region', { name: 'Highest salaries' })).toBeInTheDocument()
  expect(tab('Highest salaries')).toHaveAttribute('aria-selected', 'true')
})

test('opens the first tab when the address names a tab that does not exist', async () => {
  stubAnalysis()

  renderScreen(<PayAnalysisPage />, { at: '/?tab=unknown' })

  expect(await screen.findByRole('region', { name: 'Salary distribution' })).toBeInTheDocument()
  expect(tab('Salary distribution')).toHaveAttribute('aria-selected', 'true')
})

test.each(['constructor', 'toString', '__proto__'])(
  'opens the first tab when the address names the tab %s, which is a name of every object',
  async (name) => {
    stubAnalysis()

    renderScreen(<PayAnalysisPage />, { at: `/?tab=${name}` })

    expect(await screen.findByRole('region', { name: 'Salary distribution' })).toBeInTheDocument()
    expect(tab('Salary distribution')).toHaveAttribute('aria-selected', 'true')
  },
)

test('sends no request for a tab that is closed', async () => {
  const api = stubAnalysis()
  renderScreen(<PayAnalysisPage />)
  await screen.findByRole('region', { name: 'Salary distribution' })

  expect(requestsTo(api, DISTRIBUTION_PATH)).toHaveLength(1)
  expect(requestsTo(api, GROUPS_PATH)).toHaveLength(0)
  expect(requestsTo(api, HIGHEST_PATH)).toHaveLength(0)
})

test('links the open tab to its panel, and the panel has the name of the tab', async () => {
  stubAnalysis()
  renderScreen(<PayAnalysisPage />, { at: '/?tab=outliers' })

  const panel = await screen.findByRole('tabpanel', { name: 'Outliers by group' })
  expect(tab('Outliers by group')).toHaveAttribute('aria-controls', panel.id)
})

test('opens the next tab with the keyboard', async () => {
  stubAnalysis()
  renderScreen(<PayAnalysisPage />)
  await screen.findByRole('region', { name: 'Salary distribution' })

  tab('Salary distribution').focus()
  await userEvent.keyboard('{ArrowRight}{Enter}')

  await waitFor(() => expect(tab('Outliers by group')).toHaveAttribute('aria-selected', 'true'))
})

// The salary distribution.

test('shows the table view of the salary distribution with a row for each salary bracket', async () => {
  stubAnalysis()

  renderScreen(<PayAnalysisPage />)

  const table = await screen.findByRole('table', { name: /Salary distribution/ })
  expect(within(table).getByText('From $0 to $20,000')).toBeInTheDocument()
  expect(within(table).getByText('From $20,000 to $40,000')).toBeInTheDocument()
  expect(within(table).getByText('From $40,000 to $60,000')).toBeInTheDocument()
  expect(within(table).getAllByRole('row')).toHaveLength(1 + DISTRIBUTION.brackets.length)
  const lastRow = within(table).getByText('From $40,000 to $60,000').closest('tr')!
  expect(within(lastRow).getByText('3')).toBeInTheDocument()
})

test('states the period and the currency of the salary distribution', async () => {
  stubAnalysis()

  renderScreen(<PayAnalysisPage />)

  const section = await screen.findByRole('region', { name: 'Salary distribution' })
  expect(
    await within(section).findByText(/bracket of \$20,000\. The salaries are for one year, in USD/),
  ).toBeInTheDocument()
})

test('shows an empty state in the salary distribution when there is no salary bracket', async () => {
  stubAnalysis({ [DISTRIBUTION_PATH]: { ...DISTRIBUTION, brackets: [] } })

  renderScreen(<PayAnalysisPage />)

  const section = await screen.findByRole('region', { name: 'Salary distribution' })
  expect(await within(section).findByText('No salaries to show')).toBeInTheDocument()
})

test('shows an error in the salary distribution when it does not load, and keeps the tabs', async () => {
  stubAnalysis({ [DISTRIBUTION_PATH]: refuse(500, 'Server error') })

  renderScreen(<PayAnalysisPage />)

  const section = await screen.findByRole('region', { name: 'Salary distribution' })
  expect(await within(section).findByText('The data did not load')).toBeInTheDocument()
  expect(tab('Highest salaries')).toBeInTheDocument()
})

// The outliers by group.

test('shows a table view with a row for each group of outliers', async () => {
  stubAnalysis()

  renderScreen(<PayAnalysisPage />, { at: '/?tab=outliers' })

  const section = await screen.findByRole('region', { name: 'Outliers by country' })
  const table = await within(section).findByRole('table')
  expect(within(table).getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
    'Group',
    'Below range',
    'Above range',
    'Outliers',
  ])
  expect(within(table).getAllByRole('row')).toHaveLength(1 + COUNTRY_GROUPS.length)
  const row = within(table).getByText('United States').closest('tr')!
  expect(within(row).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['7', '3', '10'])
})

test('groups the outliers by country at first, and sends no other grouping', async () => {
  const fetchStub = stubAnalysis()

  renderScreen(<PayAnalysisPage />, { at: '/?tab=outliers' })

  await screen.findByRole('region', { name: 'Outliers by country' })
  await waitFor(() => expect(requestsTo(fetchStub, GROUPS_PATH)).toHaveLength(1))
  expect(requestsTo(fetchStub, GROUPS_PATH).at(-1)?.searchParams.get('group_by')).toBe('country')
})

test('groups the outliers by job level when the user picks it, and the title follows', async () => {
  const user = userEvent.setup()
  const fetchStub = stubAnalysis({
    [GROUPS_PATH]: (url: URL) =>
      url.searchParams.get('group_by') === 'job_level'
        ? [{ key: '2', label: 'Level 2', headcount: 9, below_count: 1, above_count: 0 }]
        : COUNTRY_GROUPS,
  })

  renderScreen(<PayAnalysisPage />, { at: '/?tab=outliers' })

  await screen.findByRole('region', { name: 'Outliers by country' })
  await user.click(screen.getByRole('radio', { name: 'Job level' }))

  const section = await screen.findByRole('region', { name: 'Outliers by job level' })
  expect(await within(section).findByText('Level 2')).toBeInTheDocument()
  const sent = requestsTo(fetchStub, GROUPS_PATH).map((url) => url.searchParams.get('group_by'))
  expect(sent).toContain('job_level')
})

test('opens the grouping that the address names', async () => {
  const api = stubAnalysis()

  renderScreen(<PayAnalysisPage />, { at: '/?tab=outliers&group_by=department' })

  expect(await screen.findByRole('region', { name: 'Outliers by department' })).toBeInTheDocument()
  await waitFor(() =>
    expect(requestsTo(api, GROUPS_PATH).at(-1)?.searchParams.get('group_by')).toBe('department'),
  )
})

test.each(['planet', 'constructor'])(
  'groups the outliers by country when the address names the grouping %s',
  async (name) => {
    stubAnalysis()

    renderScreen(<PayAnalysisPage />, { at: `/?tab=outliers&group_by=${name}` })

    expect(await screen.findByRole('region', { name: 'Outliers by country' })).toBeInTheDocument()
  },
)

test('writes the grouping in the address, and writes no value for the first grouping', async () => {
  stubAnalysis()
  renderWithAddress('/analysis?tab=outliers')
  await screen.findByRole('region', { name: 'Outliers by country' })

  await userEvent.click(screen.getByRole('radio', { name: 'Department' }))
  expect(address()).toBe('/analysis?tab=outliers&group_by=department')

  await userEvent.click(screen.getByRole('radio', { name: 'Country' }))
  expect(address()).toBe('/analysis?tab=outliers')
})

test('drops the grouping and the country from the address when the HR Manager opens another tab', async () => {
  stubAnalysis()
  renderWithAddress('/analysis?tab=outliers&group_by=department&country=DE')
  await screen.findByRole('region', { name: 'Outliers by department' })

  await userEvent.click(tab('Highest salaries'))

  expect(address()).toBe('/analysis?tab=highest')
})

test('shows an empty state when no group has an outlier', async () => {
  stubAnalysis({ [GROUPS_PATH]: [] })

  renderScreen(<PayAnalysisPage />, { at: '/?tab=outliers' })

  const section = await screen.findByRole('region', { name: 'Outliers by country' })
  expect(await within(section).findByText('No groups to show')).toBeInTheDocument()
})

// The highest salaries.

async function findHighestSalaries() {
  return screen.findByRole('region', { name: 'Highest salaries' })
}

test('shows the highest salaries with a link to each employee that goes back to the same tab and country', async () => {
  stubAnalysis()

  renderScreen(<PayAnalysisPage />, { at: '/analysis?tab=highest&country=DE', path: '/analysis' })

  const section = await findHighestSalaries()
  const link = await within(section).findByRole('link', { name: 'Employee 1' })
  expect(link).toHaveAttribute(
    'href',
    '/employees/1?back=%2Fanalysis%3Ftab%3Dhighest%26country%3DDE',
  )
})

test('shows the salary in the local currency and in the reporting currency', async () => {
  stubAnalysis()

  renderScreen(<PayAnalysisPage />, { at: '/?tab=highest' })

  const section = await findHighestSalaries()
  const row = (await within(section).findByText('Employee 2')).closest('tr')!
  expect(within(row).getByText('€250,000')).toBeInTheDocument()
  expect(within(row).getByText('$275,000')).toBeInTheDocument()
  expect(within(row).getByText('Germany')).toBeInTheDocument()
})

test('shows the compa-ratio with 2 decimal places, or that the employee has no salary band', async () => {
  stubAnalysis()

  renderScreen(<PayAnalysisPage />, { at: '/?tab=highest' })

  const section = await findHighestSalaries()
  const first = (await within(section).findByText('Employee 1')).closest('tr')!
  const second = within(section).getByText('Employee 2').closest('tr')!
  expect(within(first).getByText('1.25')).toBeInTheDocument()
  expect(within(second).getByText('No salary band')).toBeInTheDocument()
})

test('shows one amount for a country that uses the reporting currency', async () => {
  stubAnalysis({ [HIGHEST_PATH]: [highSalary(1)] })

  renderScreen(<PayAnalysisPage />, { at: '/?tab=highest' })

  const section = await findHighestSalaries()
  await within(section).findByText('Employee 1')
  expect(within(section).getAllByText('$300,000')).toHaveLength(1)
  expect(within(section).queryByRole('columnheader', { name: /Salary in/ })).toBeNull()
})

test('says that the amounts are for one year and what the reporting currency and the compa-ratio show', async () => {
  stubAnalysis()

  renderScreen(<PayAnalysisPage />, { at: '/?tab=highest' })

  const section = await findHighestSalaries()
  expect(
    await within(section).findByText(
      /The amounts are for one year\. The amount in USD is the cost to ACME; the compa-ratio compares a salary with the salary band of its country\./,
    ),
  ).toBeInTheDocument()
})

test('sends the country to the API when the HR Manager selects a country for the highest salaries', async () => {
  const api = stubAnalysis()
  renderScreen(<PayAnalysisPage />, { at: '/?tab=highest' })
  const section = await findHighestSalaries()
  await within(section).findByText('Employee 1')

  await userEvent.click(within(section).getByRole('combobox', { name: 'Country' }))
  await userEvent.click(await screen.findByRole('option', { name: 'Germany' }))

  await waitFor(() =>
    expect(requestsTo(api, HIGHEST_PATH).at(-1)!.searchParams.get('country')).toBe('DE'),
  )
})

test('opens the highest salaries of the country that the address names', async () => {
  const api = stubAnalysis()

  renderScreen(<PayAnalysisPage />, { at: '/?tab=highest&country=DE' })

  await findHighestSalaries()
  await waitFor(() =>
    expect(requestsTo(api, HIGHEST_PATH).at(-1)!.searchParams.get('country')).toBe('DE'),
  )
})

test('writes the country of the highest salaries in the address', async () => {
  stubAnalysis()
  renderWithAddress('/analysis?tab=highest')
  const section = await findHighestSalaries()
  await within(section).findByText('Employee 1')

  await userEvent.click(within(section).getByRole('combobox', { name: 'Country' }))
  await userEvent.click(await screen.findByRole('option', { name: 'Germany' }))

  expect(address()).toBe('/analysis?tab=highest&country=DE')
})

test('hides the country column when the highest salaries are for one country', async () => {
  const api = stubAnalysis()
  renderScreen(<PayAnalysisPage />, { at: '/?tab=highest' })
  const section = await findHighestSalaries()
  await within(section).findByText('Employee 1')
  expect(within(section).getByRole('columnheader', { name: 'Country' })).toBeInTheDocument()

  await userEvent.click(within(section).getByRole('combobox', { name: 'Country' }))
  await userEvent.click(await screen.findByRole('option', { name: 'Germany' }))

  await waitFor(() => expect(requestsTo(api, HIGHEST_PATH)).toHaveLength(2))
  await waitFor(() =>
    expect(within(section).queryByRole('columnheader', { name: 'Country' })).toBeNull(),
  )
})

test('shows an empty state in the highest salaries when no active employee matches', async () => {
  stubAnalysis({ [HIGHEST_PATH]: [] })

  renderScreen(<PayAnalysisPage />, { at: '/?tab=highest' })

  const section = await findHighestSalaries()
  expect(await within(section).findByText('No active employees')).toBeInTheDocument()
})

test('shows an error in the highest salaries when they do not load, and keeps the tabs', async () => {
  stubAnalysis({ [HIGHEST_PATH]: refuse(500, 'Server error') })

  renderScreen(<PayAnalysisPage />, { at: '/?tab=highest' })

  const section = await findHighestSalaries()
  expect(await within(section).findByText('The data did not load')).toBeInTheDocument()
  expect(tab('Salary distribution')).toBeInTheDocument()
})

// FR-20: the way from a chart to its employees, and a stable height while a tab loads.

test('says that a bar of the salary distribution opens its employees', async () => {
  stubAnalysis()

  renderScreen(<PayAnalysisPage />)

  const section = await screen.findByRole('region', { name: 'Salary distribution' })
  expect(await within(section).findByText(/Select a bar to see its employees\./)).toBeInTheDocument()
})

test('says that a part of a bar of the outliers chart opens its employees', async () => {
  stubAnalysis()

  renderScreen(<PayAnalysisPage />, { at: '/?tab=outliers' })

  const section = await screen.findByRole('region', { name: 'Outliers by country' })
  expect(
    await within(section).findByText(/Select a part of a bar to see its employees\./),
  ).toBeInTheDocument()
})

const NEVER = () => new Promise(() => {})

test.each([
  ['the salary distribution', '/', DISTRIBUTION_PATH, 'Salary distribution'],
  ['the outliers by group', '/?tab=outliers', GROUPS_PATH, 'Outliers by country'],
  ['the highest salaries', '/?tab=highest', HIGHEST_PATH, 'Highest salaries'],
])('keeps an empty box for %s while the first load is quick', async (_name, at, path, title) => {
  stubAnalysis({ [path]: NEVER })

  renderScreen(<PayAnalysisPage />, { at })

  const section = await screen.findByRole('region', { name: title })
  const box = within(section).getByRole('status', { name: 'Loading' })
  expect(box.style.height).toMatch(/^\d+px$/)
  expect(box.querySelectorAll('.astryx-skeleton')).toHaveLength(0)
})

test('keeps the table view of the old grouping while a new grouping loads', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  stubAnalysis({
    [GROUPS_PATH]: (url: URL) =>
      url.searchParams.get('group_by') === 'department' ? NEVER() : COUNTRY_GROUPS,
  })
  renderScreen(<PayAnalysisPage />, { at: '/?tab=outliers' })
  const section = await screen.findByRole('region', { name: 'Outliers by country' })
  await within(section).findByText('United States')

  await user.click(screen.getByRole('radio', { name: 'Department' }))
  await act(() => vi.advanceTimersByTimeAsync(SHOW_LOAD_AFTER_MS * 2))

  const newSection = screen.getByRole('region', { name: 'Outliers by department' })
  expect(within(newSection).getByText('United States')).toBeInTheDocument()
  expect(within(newSection).queryByRole('status', { name: 'Loading' })).toBeNull()
})

// FR-20: a click on a bar. A double of the chart makes the call that the click makes.

test('opens the employees of a salary bracket with the way back to the distribution', async () => {
  stubAnalysis()
  renderWithAddress('/analysis')

  await userEvent.click(await screen.findByRole('button', { name: 'Click the last bar' }))

  expect(address()).toBe(
    '/employees?status=active&salary_from_minor=4000000&salary_to_minor=6000000&back=%2Fanalysis',
  )
})

test('opens the outliers of a department with the way back to the same grouping', async () => {
  stubAnalysis({
    [GROUPS_PATH]: [{ key: 'Sales', label: 'Sales', headcount: 9, below_count: 2, above_count: 1 }],
  })
  renderWithAddress('/analysis?tab=outliers&group_by=department')

  await userEvent.click(
    await screen.findByRole('button', { name: 'Click the below part of the first bar' }),
  )

  expect(address()).toBe(
    '/pay-health?status=below&department=Sales&back=%2Fanalysis%3Ftab%3Doutliers%26group_by%3Ddepartment',
  )
})

test('opens the outliers of the grouping on the screen when a click comes while a new grouping loads', async () => {
  stubAnalysis({
    [GROUPS_PATH]: (url: URL) =>
      url.searchParams.get('group_by') === 'department' ? NEVER() : COUNTRY_GROUPS,
  })
  renderWithAddress('/analysis?tab=outliers')
  const button = await screen.findByRole('button', { name: 'Click the below part of the first bar' })
  await userEvent.click(screen.getByRole('radio', { name: 'Department' }))

  await userEvent.click(button)

  // The list is for the country of the chart that is on the screen, not for a department.
  expect(address()).toBe(
    '/pay-health?status=below&country=US&back=%2Fanalysis%3Ftab%3Doutliers%26group_by%3Ddepartment',
  )
})
