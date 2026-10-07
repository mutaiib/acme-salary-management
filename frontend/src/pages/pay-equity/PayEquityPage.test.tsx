// FR-11, FR-12, NFR-07: the Pay equity screen.
import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import type { Gap, PayEquity } from '../../api/types'
import { stubApi } from '../../test/api'
import { renderScreen } from '../../test/render'
import { PayEquityPage } from './PayEquityPage'

function gap(key: string, label: string, overrides: Partial<Gap> = {}): Gap {
  return {
    key,
    label,
    currency: 'USD',
    men: 500,
    women: 450,
    mean_gap_pct: 1.0,
    median_gap_pct: 1.0,
    is_flagged: false,
    has_enough_data: true,
    ...overrides,
  }
}

function equityOf(countries: Gap[], organization: Partial<Gap> = {}): PayEquity {
  return {
    organization: gap('organization', 'Organization', {
      men: 5258,
      women: 4441,
      mean_gap_pct: 2.8,
      median_gap_pct: 4.1,
      ...organization,
    }),
    countries,
    flag_threshold_pct: 5.0,
    min_group_size: 5,
  }
}

function show(equity: PayEquity) {
  stubApi({ '/api/insights/pay-equity': equity })
  renderScreen(<PayEquityPage />)
}

test('shows the mean gap and the median gap of the organization', async () => {
  show(equityOf([gap('US', 'United States')]))

  expect(await screen.findByTestId('organization-mean-gap')).toHaveTextContent(/^2\.8%$/)
  expect(screen.getByTestId('organization-median-gap')).toHaveTextContent(/^4\.1%$/)
})

test('shows the mean gap, the median gap and the headcount of each country', async () => {
  show(
    equityOf([
      gap('GB', 'United Kingdom', {
        men: 635,
        women: 532,
        mean_gap_pct: 9.9,
        median_gap_pct: 10.8,
        is_flagged: true,
      }),
    ]),
  )

  const row = (await screen.findByText('United Kingdom')).closest('tr')!
  expect(within(row).getByText('635')).toBeInTheDocument()
  expect(within(row).getByText('532')).toBeInTheDocument()
  expect(within(row).getByText('9.9%')).toBeInTheDocument()
  expect(within(row).getByText('10.8%')).toBeInTheDocument()
})

test('flags a country that has a gap of more than 5%', async () => {
  show(
    equityOf([
      gap('GB', 'United Kingdom', { mean_gap_pct: 9.9, is_flagged: true }),
      gap('US', 'United States', { mean_gap_pct: -0.1 }),
    ]),
  )

  const flagged = (await screen.findByText('United Kingdom')).closest('tr')!
  const normal = screen.getByText('United States').closest('tr')!
  expect(within(flagged).getByText('Above 5%')).toBeInTheDocument()
  expect(within(normal).queryByText('Above 5%')).not.toBeInTheDocument()
})

test('shows the number of flagged countries', async () => {
  show(
    equityOf([
      gap('GB', 'United Kingdom', { is_flagged: true }),
      gap('IN', 'India', { is_flagged: true }),
      gap('US', 'United States'),
    ]),
  )

  expect(await screen.findByTestId('flagged-countries')).toHaveTextContent(/^2 of 3$/)
})

test('shows not enough data for a group that is too small', async () => {
  show(
    equityOf([
      gap('SG', 'Singapore', {
        men: 4,
        women: 9,
        mean_gap_pct: null,
        median_gap_pct: null,
        has_enough_data: false,
      }),
    ]),
  )

  const row = (await screen.findByText('Singapore')).closest('tr')!
  expect(within(row).getByText('Not enough data')).toBeInTheDocument()
  expect(within(row).queryByText(/%/)).not.toBeInTheDocument()
})

test('a negative gap states that women have the higher pay', async () => {
  show(equityOf([gap('AU', 'Australia', { mean_gap_pct: -0.9, median_gap_pct: 0.7 })]))

  const row = (await screen.findByText('Australia')).closest('tr')!
  expect(within(row).getByText('-0.9%')).toBeInTheDocument()
  expect(within(row).getAllByText('Women higher')).toHaveLength(1)
})

test('shows a whole gap with 1 decimal place', async () => {
  show(equityOf([gap('FR', 'France', { mean_gap_pct: 2, median_gap_pct: 3 })]))

  const row = (await screen.findByText('France')).closest('tr')!
  expect(within(row).getByText('2.0%')).toBeInTheDocument()
  expect(within(row).getByText('3.0%')).toBeInTheDocument()
})

test('explains the sign of the gap', async () => {
  show(equityOf([gap('US', 'United States')]))

  expect(
    await screen.findByText(/A positive gap means that men have the higher pay/),
  ).toBeInTheDocument()
})

test('states that the gap is unadjusted, and what that means', async () => {
  show(equityOf([gap('US', 'United States')]))

  expect(await screen.findByText('These figures are unadjusted')).toBeInTheDocument()
  expect(screen.getByText(/does not correct for job level/)).toBeInTheDocument()
})

test('shows no gap for the organization when there is not enough data', async () => {
  show(
    equityOf(
      [gap('SG', 'Singapore', { has_enough_data: false, mean_gap_pct: null, median_gap_pct: null })],
      { men: 0, women: 0, mean_gap_pct: null, median_gap_pct: null, has_enough_data: false },
    ),
  )

  expect(await screen.findByTestId('organization-mean-gap')).toHaveTextContent('Not enough data')
})

test('shows an error message when the API does not respond', async () => {
  stubApi({})

  renderScreen(<PayEquityPage />)

  expect(await screen.findByText('The data did not load')).toBeInTheDocument()
  expect(screen.getByText('These figures are unadjusted')).toBeInTheDocument()
})

test('shows an empty state when there are no active employees', async () => {
  show(
    equityOf([], { men: 0, women: 0, mean_gap_pct: null, median_gap_pct: null, has_enough_data: false }),
  )

  expect(await screen.findByText('No active employees')).toBeInTheDocument()
})

test('states in words that women have the higher pay in the organization', async () => {
  show(equityOf([gap('US', 'United States')], { mean_gap_pct: -1.2, median_gap_pct: 0.4 }))

  const figure = await screen.findByRole('group', { name: 'Mean gap, organization' })
  expect(within(figure).getByText(/Women have the higher pay/)).toBeInTheDocument()
})
