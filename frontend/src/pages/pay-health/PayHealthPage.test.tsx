import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import type { Outlier, PayHealthSummary } from '../../api/types'
import { requestsTo, stubApi } from '../../test/api'
import { META, pageOf } from '../../test/data'
import { renderScreen } from '../../test/render'
import { PayHealthPage } from './PayHealthPage'

const SUMMARY: PayHealthSummary = {
  below_count: 290,
  above_count: 193,
  correction_cost_minor: 158_000_000,
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
    band_limit_minor: 5_000_000,
    difference_minor: 500_000,
    ...overrides,
  }
}

const OUTLIERS_PATH = '/api/insights/pay-health/employees'

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

  expect(await screen.findByTestId('below-count')).toHaveTextContent('290')
  expect(screen.getByTestId('above-count')).toHaveTextContent('193')
})

test('shows the correction cost in the reporting currency', async () => {
  stubPayHealth()

  renderScreen(<PayHealthPage />)

  expect(await screen.findByTestId('correction-cost')).toHaveTextContent('$1,580,000')
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

  renderScreen(<PayHealthPage />)

  const row = (await screen.findByText('Asha Rao')).closest('tr')!
  expect(within(row).getByText('$45,000')).toBeInTheDocument()
  expect(within(row).getByText('$50,000')).toBeInTheDocument()
  expect(within(row).getByText('$5,000')).toBeInTheDocument()
  expect(screen.getByRole('columnheader', { name: 'Band minimum' })).toBeInTheDocument()
})

test('asks for the below-range employees first', async () => {
  const api = stubPayHealth()

  renderScreen(<PayHealthPage />)
  await screen.findByText('Employee 1')

  expect(requestsTo(api, OUTLIERS_PATH).at(-1)!.searchParams.get('status')).toBe('below')
})

test('lists the above-range employees when the HR Manager selects the above range tab', async () => {
  const api = stubPayHealth({
    [OUTLIERS_PATH]: (url: URL) =>
      url.searchParams.get('status') === 'above'
        ? pageOf([outlier(9, { full_name: 'Over Paid', band_limit_minor: 7_000_000 })])
        : pageOf([outlier(1)]),
  })
  renderScreen(<PayHealthPage />)
  await screen.findByText('Employee 1')

  await userEvent.click(screen.getByRole('tab', { name: /Above range/ }))

  expect(await screen.findByText('Over Paid')).toBeInTheDocument()
  expect(screen.getByRole('columnheader', { name: 'Band maximum' })).toBeInTheDocument()
  expect(requestsTo(api, OUTLIERS_PATH).at(-1)!.searchParams.get('status')).toBe('above')
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

test('links each row to the Employee detail screen', async () => {
  stubPayHealth({ [OUTLIERS_PATH]: pageOf([outlier(7, { full_name: 'Asha Rao' })]) })

  renderScreen(<PayHealthPage />)

  expect(await screen.findByRole('link', { name: 'Asha Rao' })).toHaveAttribute(
    'href',
    '/employees/7',
  )
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

  expect(await screen.findByText('No employee is below range')).toBeInTheDocument()
})

test('shows an error message when the API does not respond', async () => {
  stubApi({})

  renderScreen(<PayHealthPage />)

  expect((await screen.findAllByText('The data did not load')).length).toBeGreaterThan(0)
})
