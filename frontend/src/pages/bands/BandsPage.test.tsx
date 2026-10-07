// FR-07: the Salary bands screen.
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import type { Band } from '../../api/types'
import { refuse, requestsTo, stubApi } from '../../test/api'
import { band, META } from '../../test/data'
import { renderScreen } from '../../test/render'
import { BandsPage } from './BandsPage'

const US_LEVEL_2 = band(1, { country: 'US', job_level: 2 })
const IN_LEVEL_3 = band(2, {
  country: 'IN',
  job_level: 3,
  currency: 'INR',
  min_minor: 180_000_000,
  mid_minor: 225_000_000,
  max_minor: 270_000_000,
})

async function openEditDialog() {
  const row = (await screen.findByRole('cell', { name: 'United States' })).closest('tr')!
  await userEvent.click(within(row).getByRole('button', { name: /Edit/ }))
  return screen.findByRole('dialog')
}

async function typeAmount(dialog: HTMLElement, label: RegExp, amount: string) {
  const input = within(dialog).getByLabelText(label)
  await userEvent.clear(input)
  await userEvent.type(input, amount)
  await userEvent.tab()
}

test('shows the minimum, the midpoint and the maximum of each band', async () => {
  stubApi({ '/api/meta': META, '/api/bands': [US_LEVEL_2, IN_LEVEL_3] })

  renderScreen(<BandsPage />)

  const row = (await screen.findByRole('cell', { name: 'India' })).closest('tr')!
  expect(within(row).getByText('Level 3')).toBeInTheDocument()
  expect(within(row).getByText('₹1,800,000')).toBeInTheDocument()
  expect(within(row).getByText('₹2,250,000')).toBeInTheDocument()
  expect(within(row).getByText('₹2,700,000')).toBeInTheDocument()
})

test('sends the country filter in the address to the API', async () => {
  const api = stubApi({ '/api/meta': META, '/api/bands': [IN_LEVEL_3] })

  renderScreen(<BandsPage />, { at: '/?country=IN' })
  await screen.findByRole('cell', { name: 'India' })

  expect(requestsTo(api, '/api/bands').at(-1)!.searchParams.get('country')).toBe('IN')
})

test('sends the new minimum, midpoint and maximum in minor units', async () => {
  let sent: unknown
  stubApi({
    '/api/meta': META,
    '/api/bands': [US_LEVEL_2],
    'PUT /api/bands/1': (_url: URL, body: unknown) => {
      sent = body
      return US_LEVEL_2
    },
  })
  renderScreen(<BandsPage />)

  const dialog = await openEditDialog()
  await typeAmount(dialog, /Minimum/, '50000')
  await typeAmount(dialog, /Midpoint/, '60000')
  await typeAmount(dialog, /Maximum/, '70000')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

  await waitFor(() =>
    expect(sent).toEqual({ min_minor: 5_000_000, mid_minor: 6_000_000, max_minor: 7_000_000 }),
  )
})

test('shows the new band after the change', async () => {
  let bands: Band[] = [US_LEVEL_2]
  stubApi({
    '/api/meta': META,
    '/api/bands': () => bands,
    'PUT /api/bands/1': () => {
      bands = [{ ...US_LEVEL_2, mid_minor: 6_600_000 }]
      return bands[0]
    },
  })
  renderScreen(<BandsPage />)

  const dialog = await openEditDialog()
  await typeAmount(dialog, /Midpoint/, '66000')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

  expect(await screen.findByText('$66,000')).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('shows the cause when the API refuses the band', async () => {
  stubApi({
    '/api/meta': META,
    '/api/bands': [US_LEVEL_2],
    'PUT /api/bands/1': refuse(422, [
      { field: 'min_minor', cause: 'The minimum must be less than the midpoint.' },
    ]),
  })
  renderScreen(<BandsPage />)

  const dialog = await openEditDialog()
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

  expect(
    await within(dialog).findByText('The minimum must be less than the midpoint.'),
  ).toBeInTheDocument()
})

test('shows an empty state when there are no bands', async () => {
  stubApi({ '/api/meta': META, '/api/bands': [] })

  renderScreen(<BandsPage />)

  expect(await screen.findByText('No salary bands')).toBeInTheDocument()
})
