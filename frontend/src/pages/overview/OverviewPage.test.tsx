// FR-01, FR-02: the Pay overview screen.
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import type { GroupBy, Overview } from '../../api/types'
import { META } from '../../test/data'
import { requestsTo, stubApi } from '../../test/api'
import { renderScreen } from '../../test/render'
import { OverviewPage } from './OverviewPage'

function overviewOf(group_by: GroupBy, groups: Overview['groups']): Overview {
  return {
    reporting_currency: 'USD',
    payroll_cost_minor: 35_800_000,
    headcount: 6,
    median_salary_minor: 6_300_000,
    rates_as_of: '2026-01-01',
    group_by,
    groups,
  }
}

const BY_COUNTRY = overviewOf('country', [
  {
    key: 'US',
    label: 'United States',
    headcount: 3,
    payroll_cost_minor: 22_000_000,
    currency: 'USD',
    min_minor: 6_000_000,
    median_minor: 7_000_000,
    max_minor: 9_000_000,
  },
  {
    key: 'DE',
    label: 'Germany',
    headcount: 2,
    payroll_cost_minor: 12_000_000,
    currency: 'EUR',
    min_minor: 5_000_000,
    median_minor: 5_555_600,
    max_minor: 6_111_100,
  },
])

const BY_DEPARTMENT = overviewOf('department', [
  {
    key: 'Engineering',
    label: 'Engineering',
    headcount: 4,
    payroll_cost_minor: 20_200_000,
    currency: 'USD',
    min_minor: 1_800_000,
    median_minor: 5_700_000,
    max_minor: 7_000_000,
  },
])

const META_WITH_GERMANY = {
  ...META,
  countries: [...META.countries, { code: 'DE', name: 'Germany', currency: 'EUR' }],
}

function stubOverview() {
  return stubApi({
    '/api/meta': META_WITH_GERMANY,
    '/api/insights/overview': (url: URL) =>
      url.searchParams.get('group_by') === 'department' ? BY_DEPARTMENT : BY_COUNTRY,
  })
}

const PAY_HEALTH = {
  below_count: 290,
  above_count: 193,
  correction_cost_minor: 108_590_700,
  payroll_cost_minor: 57_528_236_720,
  reporting_currency: 'USD',
}

test('tells how many salaries are outside the salary band, with a link to Pay health', async () => {
  stubApi({
    '/api/insights/overview': BY_COUNTRY,
    '/api/insights/pay-health': PAY_HEALTH,
    '/api/meta': META_WITH_GERMANY,
  })

  renderScreen(<OverviewPage />)

  const notice = await screen.findByRole('alert')
  expect(within(notice).getByText('483 salaries are outside the salary band')).toBeInTheDocument()
  expect(
    within(notice).getByText(/290 are below range and 193 are above range/),
  ).toBeInTheDocument()
  expect(within(notice).getByRole('link', { name: 'Go to Pay health' })).toHaveAttribute(
    'href',
    '/pay-health',
  )
})

test('shows no notice when all salaries are in the salary band', async () => {
  stubApi({
    '/api/insights/overview': BY_COUNTRY,
    '/api/insights/pay-health': { ...PAY_HEALTH, below_count: 0, above_count: 0 },
    '/api/meta': META_WITH_GERMANY,
  })

  renderScreen(<OverviewPage />)

  await screen.findByTestId('payroll-cost')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('shows the total payroll cost in the reporting currency', async () => {
  stubOverview()

  renderScreen(<OverviewPage />)

  expect(await screen.findByTestId('payroll-cost')).toHaveTextContent(/^\$358K$/)
})

test('shows the headcount', async () => {
  stubOverview()

  renderScreen(<OverviewPage />)

  expect(await screen.findByTestId('headcount')).toHaveTextContent(/^6$/)
})

test('shows the date of the exchange rates', async () => {
  stubOverview()

  renderScreen(<OverviewPage />)

  const link = await screen.findByRole('link', { name: 'Exchange rates of 1 Jan 2026' })
  expect(link).toHaveAttribute('href', '/exchange-rates')
})

test('shows the figures of each country, with the salaries in the local currency', async () => {
  stubOverview()

  renderScreen(<OverviewPage />)

  const row = (await screen.findByText('Germany')).closest('tr')!
  expect(within(row).getByText('2')).toBeInTheDocument()
  expect(within(row).getByText('$120K')).toBeInTheDocument()
  expect(within(row).getByText('€50,000')).toBeInTheDocument()
  expect(within(row).getByText('€55,556')).toBeInTheDocument()
  expect(within(row).getByText('€61,111')).toBeInTheDocument()
})

test('shows the share of the payroll cost of each group', async () => {
  stubOverview()

  renderScreen(<OverviewPage />)

  const row = (await screen.findByText('United States')).closest('tr')!
  expect(within(row).getByText('61.5%')).toBeInTheDocument()
})

test('shows the figures by department when the HR Manager groups by department', async () => {
  const api = stubOverview()
  renderScreen(<OverviewPage />)
  await screen.findByText('Germany')

  await userEvent.click(screen.getByRole('radio', { name: 'Department' }))

  const row = (await screen.findByText('Engineering')).closest('tr')!
  expect(within(row).getByText('$57,000')).toBeInTheDocument()
  expect(requestsTo(api, '/api/insights/overview').at(-1)!.searchParams.get('group_by')).toBe(
    'department',
  )
})

test('shows an empty state when there are no active employees', async () => {
  stubApi({ '/api/insights/overview': { ...overviewOf('country', []), headcount: 0 } })

  renderScreen(<OverviewPage />)

  expect(await screen.findByText('No active employees')).toBeInTheDocument()
})

test('shows an error message when the API does not respond', async () => {
  stubApi({})

  renderScreen(<OverviewPage />)

  expect(await screen.findByText('The data did not load')).toBeInTheDocument()
})

test('keeps the note of the old grouping while the new grouping loads', async () => {
  let release!: () => void
  const slow = new Promise<void>((resolve) => (release = resolve))
  stubApi({
    '/api/insights/overview': async (url: URL) => {
      if (url.searchParams.get('group_by') === 'department') {
        await slow
        return BY_DEPARTMENT
      }
      return BY_COUNTRY
    },
  })
  renderScreen(<OverviewPage />)
  await screen.findByText('Germany')

  await userEvent.click(screen.getByRole('radio', { name: 'Department' }))

  expect(screen.getByText(/The salaries of a country are in the local currency/)).toBeInTheDocument()
  release()
  expect(await screen.findByText(/A department has many currencies/)).toBeInTheDocument()
})

test('shows the figures by job level when the HR Manager groups by job level', async () => {
  const api = stubOverview()
  renderScreen(<OverviewPage />)
  await screen.findByText('Germany')

  await userEvent.click(screen.getByRole('radio', { name: 'Job level' }))

  await waitFor(() =>
    expect(requestsTo(api, '/api/insights/overview').at(-1)!.searchParams.get('group_by')).toBe(
      'job_level',
    ),
  )
})

test('shows the payroll cost with its label', async () => {
  stubOverview()

  renderScreen(<OverviewPage />)

  const figure = await screen.findByRole('group', { name: 'Payroll cost' })
  expect(within(figure).getByText('$358K')).toBeInTheDocument()
})

test('shows the median salary of the organization with its period and currency', async () => {
  stubOverview()

  renderScreen(<OverviewPage />)

  const figure = await screen.findByRole('group', { name: 'Median salary' })
  expect(within(figure).getByText('$63,000')).toBeInTheDocument()
  expect(within(figure).getByText(/For one year, in USD/)).toBeInTheDocument()
})

test('does not request the salary distribution or the highest salaries', async () => {
  const api = stubOverview()

  renderScreen(<OverviewPage />)

  await screen.findByTestId('payroll-cost')
  expect(requestsTo(api, '/api/insights/salary-distribution')).toHaveLength(0)
  expect(requestsTo(api, '/api/insights/highest-salaries')).toHaveLength(0)
})
