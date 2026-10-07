// FR-01: the Exchange rates screen.
import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { stubApi } from '../../test/api'
import { META } from '../../test/data'
import { renderScreen } from '../../test/render'
import { ExchangeRatesPage } from './ExchangeRatesPage'

const RATES = [
  { currency: 'EUR', rate_micro: 1_080_000, as_of_date: '2026-01-01' },
  { currency: 'INR', rate_micro: 12_000, as_of_date: '2026-01-01' },
]

test('shows the value of one unit of each currency in the reporting currency, with the date of the rate', async () => {
  // The currency of the test is not the default, so a fixed text in the screen fails the test.
  stubApi({ '/api/meta': { ...META, reporting_currency: 'EUR' }, '/api/meta/exchange-rates': RATES })

  renderScreen(<ExchangeRatesPage />)

  expect(
    await screen.findByRole('columnheader', { name: 'Value of 1 unit, in EUR' }),
  ).toBeInTheDocument()
  const euro = (await screen.findByText('EUR')).closest('tr')!
  expect(within(euro).getByText('1.08')).toBeInTheDocument()
  expect(within(euro).getByText('1 Jan 2026')).toBeInTheDocument()
  const rupee = screen.getByText('INR').closest('tr')!
  expect(within(rupee).getByText('0.012')).toBeInTheDocument()
})

test('shows an empty state when the system has no exchange rate', async () => {
  stubApi({ '/api/meta/exchange-rates': [] })

  renderScreen(<ExchangeRatesPage />)

  expect(await screen.findByText('No exchange rates')).toBeInTheDocument()
})

test('shows an error message when the API does not respond', async () => {
  stubApi({})

  renderScreen(<ExchangeRatesPage />)

  expect(await screen.findByText('The data did not load')).toBeInTheDocument()
})
