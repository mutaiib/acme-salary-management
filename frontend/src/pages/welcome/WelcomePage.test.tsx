// FR-14: the first screen states the purpose of the system and what it can do.
// FR-01, FR-10: it shows the live pay figures and the outliers as the proof.
import { screen, within } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import type { Overview, PayHealthSummary } from '../../api/types'
import { stubApi } from '../../test/api'
import { renderScreen } from '../../test/render'
import { WelcomePage } from './WelcomePage'

const OVERVIEW: Overview = {
  reporting_currency: 'USD',
  payroll_cost_minor: 57_528_236_720,
  headcount: 9_699,
  median_salary_minor: 5_207_400,
  rates_as_of: '2026-01-01',
  group_by: 'country',
  groups: [],
}

const PAY_HEALTH: PayHealthSummary = {
  below_count: 290,
  above_count: 193,
  correction_cost_minor: 108_590_700,
  payroll_cost_minor: 57_528_236_720,
  reporting_currency: 'USD',
}

function stubFigures() {
  return stubApi({
    '/api/insights/overview': OVERVIEW,
    '/api/insights/pay-health': PAY_HEALTH,
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

test('states what the system does in one headline', () => {
  stubFigures()

  renderScreen(<WelcomePage />)

  expect(
    screen.getByRole('heading', {
      level: 1,
      name: 'Know what ACME pays. Fix what is wrong. Prove each change.',
    }),
  ).toBeInTheDocument()
})

test('shows the live payroll cost, headcount and median salary', async () => {
  stubFigures()

  renderScreen(<WelcomePage />)

  const figures = await screen.findByRole('region', { name: 'ACME today' })
  expect(within(figures).getByRole('group', { name: 'Payroll cost' })).toHaveTextContent('$575.28M')
  expect(within(figures).getByRole('group', { name: 'Active employees' })).toHaveTextContent(
    '9,699',
  )
  expect(within(figures).getByRole('group', { name: 'Median salary' })).toHaveTextContent('$52,074')
})

test('shows the salaries outside the band and the correction cost, with a link to them', async () => {
  stubFigures()

  renderScreen(<WelcomePage />)

  const figures = await screen.findByRole('region', { name: 'ACME today' })
  expect(
    await within(figures).findByText('483 salaries are outside their band'),
  ).toBeInTheDocument()
  expect(within(figures).getByText('290 below range, 193 above range')).toBeInTheDocument()
  expect(within(figures).getByText(/\$1,085,907 for one year/)).toBeInTheDocument()
  expect(
    within(figures).getByRole('link', {
      name: 'See the salaries outside the band',
    }),
  ).toHaveAttribute('href', '/pay-health')
})

test('gives the 4 steps of the work, each as a link to its screen', () => {
  stubFigures()

  renderScreen(<WelcomePage />)

  const steps = screen.getByRole('list', { name: 'What the system does' })
  const links = within(steps).getAllByRole('link')
  expect(
    links.map((link) => [
      link.getAttribute('aria-label') ?? link.textContent,
      link.getAttribute('href'),
    ]),
  ).toEqual([
    ['See the pay', '/overview'],
    ['Find the problems', '/pay-health'],
    ['Change a salary', '/employees'],
    ['Keep the proof', '/employees'],
  ])
})

test('opens the Pay overview from the primary button', () => {
  stubFigures()

  renderScreen(<WelcomePage />)

  expect(screen.getByRole('link', { name: 'Open the Pay overview' })).toHaveAttribute(
    'href',
    '/overview',
  )
})

test('keeps the headline and the steps when the figures do not load', async () => {
  stubApi({})

  renderScreen(<WelcomePage />)

  expect(await screen.findByText('The data did not load')).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  expect(screen.getByRole('list', { name: 'What the system does' })).toBeInTheDocument()
})
