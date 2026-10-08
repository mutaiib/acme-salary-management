// FR-07, FR-15, FR-16: the Salary bands screen and the preview of a band change.
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test, vi } from 'vitest'
import type { BandChangePreview } from '../../api/types'
import type { BandFigures } from '../../api/types'
import { refuse, requestsTo, stubApi } from '../../test/api'
import { bandFigures, META } from '../../test/data'
import { renderScreen } from '../../test/render'
import { BandsPage } from './BandsPage'

const US_LEVEL_2 = bandFigures(1, { country: 'US', job_level: 2 })
const IN_LEVEL_3 = bandFigures(2, {
  country: 'IN',
  job_level: 3,
  currency: 'INR',
  min_minor: 180_000_000,
  mid_minor: 225_000_000,
  max_minor: 270_000_000,
})

async function openEditDialog() {
  const country = await screen.findByRole('region', { name: 'United States' })
  await userEvent.click(within(country).getByRole('button', { name: /Edit/ }))
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

  const country = await screen.findByRole('region', { name: 'India' })
  const row = within(country).getByText('Level 3').closest('tr')!
  expect(within(country).getByText('INR, 1 job level')).toBeInTheDocument()
  expect(within(row).getByText('Level 3')).toBeInTheDocument()
  expect(within(row).getByText('₹1,800,000')).toBeInTheDocument()
  expect(within(row).getByText('₹2,250,000')).toBeInTheDocument()
  expect(within(row).getByText('₹2,700,000')).toBeInTheDocument()
})

test('sends the country filter in the address to the API', async () => {
  const api = stubApi({ '/api/meta': META, '/api/bands': [IN_LEVEL_3] })

  renderScreen(<BandsPage />, { at: '/?country=IN' })
  await screen.findByRole('region', { name: 'India' })

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
    expect(sent).toEqual({
      min_minor: 5_000_000,
      mid_minor: 6_000_000,
      max_minor: 7_000_000,
    }),
  )
})

test('shows the new band after the change', async () => {
  let bands: BandFigures[] = [US_LEVEL_2]
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
      {
        field: 'min_minor',
        cause: 'The minimum must be less than the midpoint.',
      },
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

test('shows an error message when the API does not respond', async () => {
  stubApi({})

  renderScreen(<BandsPage />)

  expect(await screen.findByText('The data did not load')).toBeInTheDocument()
})

test('shows an error for an input that the dialog does not have', async () => {
  stubApi({
    '/api/meta': META,
    '/api/bands': [US_LEVEL_2],
    'PUT /api/bands/1': refuse(422, [{ field: 'body', cause: 'The request is not valid.' }]),
  })
  renderScreen(<BandsPage />)

  const dialog = await openEditDialog()
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

  expect(await within(dialog).findByText('The request is not valid.')).toBeInTheDocument()
})

test('shows the headcount of each band', async () => {
  stubApi({
    '/api/meta': META,
    '/api/bands': [{ ...IN_LEVEL_3, headcount: 12 }],
  })

  renderScreen(<BandsPage />)

  const country = await screen.findByRole('region', { name: 'India' })
  const row = within(country).getByText('Level 3').closest('tr')!
  expect(within(row).getByText('12')).toBeInTheDocument()
})

test('shows a zero and no link for a band with no employee outside it', async () => {
  stubApi({ '/api/meta': META, '/api/bands': [US_LEVEL_2] })

  renderScreen(<BandsPage />)

  const country = await screen.findByRole('region', { name: 'United States' })
  const row = within(country).getByText('Level 2').closest('tr')!
  expect(within(row).getAllByText('0')).toHaveLength(2)
  expect(within(row).queryByRole('link')).not.toBeInTheDocument()
})

test('shows the count below range and the count above range of a band, each in its column and linked to its list', async () => {
  stubApi({
    '/api/meta': META,
    '/api/bands': [{ ...US_LEVEL_2, below_count: 3, above_count: 2 }],
  })

  renderScreen(<BandsPage />)

  const country = await screen.findByRole('region', { name: 'United States' })
  const columnOf = (element: HTMLElement) =>
    Array.from(element.closest('tr')!.children).indexOf(element.closest('td, th')!)
  const belowColumn = columnOf(within(country).getByRole('columnheader', { name: 'Below range' }))
  const aboveColumn = columnOf(within(country).getByRole('columnheader', { name: 'Above range' }))
  expect(belowColumn).not.toBe(aboveColumn)
  const row = within(country).getByText('Level 2').closest('tr')!
  const below = within(row).getByRole('link', {
    name: '3 employees below range: United States, Level 2',
  })
  const above = within(row).getByRole('link', {
    name: '2 employees above range: United States, Level 2',
  })
  expect(columnOf(below)).toBe(belowColumn)
  expect(columnOf(above)).toBe(aboveColumn)
  expect(below).toHaveTextContent('3')
  expect(above).toHaveTextContent('2')
  expect(below).toHaveAttribute('href', '/pay-health?status=below&country=US&job_level=2')
  expect(above).toHaveAttribute('href', '/pay-health?status=above&country=US&job_level=2')
})

test('links only the count that is more than zero', async () => {
  stubApi({
    '/api/meta': META,
    '/api/bands': [{ ...US_LEVEL_2, below_count: 1 }],
  })

  renderScreen(<BandsPage />)

  const country = await screen.findByRole('region', { name: 'United States' })
  const row = within(country).getByText('Level 2').closest('tr')!
  expect(within(row).getAllByRole('link')).toHaveLength(1)
  expect(
    within(row).getByRole('link', { name: '1 employee below range: United States, Level 2' }),
  ).toBeInTheDocument()
})

afterEach(() => {
  vi.useRealTimers()
})

const NO_CHANGE = {
  headcount: 5,
  below_count: 0,
  above_count: 1,
  correction_cost_minor: 0,
}
const PREVIEW: BandChangePreview = {
  current: NO_CHANGE,
  proposed: { ...NO_CHANGE, below_count: 2, correction_cost_minor: 500_000 },
  reporting_currency: 'USD',
}

/**
 * Types with fake timers, so that a test controls the pause before the preview. Call it after the
 * dialog is open and before the first key. The clock does not advance by itself, so a slow
 * machine cannot fire the pause early.
 */
function fakeClock() {
  vi.useFakeTimers()
  // Testing Library waits with a timer. It moves the fake clock only when it finds a `jest` global.
  vi.stubGlobal('jest', { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) })
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
}

async function typeMinimum(
  user: ReturnType<typeof userEvent.setup>,
  dialog: HTMLElement,
  text: string,
) {
  const input = within(dialog).getByLabelText(/Minimum/)
  await user.clear(input)
  await user.type(input, text)
  await user.tab()
}

test('shows the current amount of the band next to each input', async () => {
  stubApi({ '/api/meta': META, '/api/bands': [US_LEVEL_2] })
  renderScreen(<BandsPage />)

  const dialog = await openEditDialog()

  expect(within(dialog).getByText('Now: $52,000')).toBeInTheDocument()
  expect(within(dialog).getByText('Now: $65,000')).toBeInTheDocument()
  expect(within(dialog).getByText('Now: $78,000')).toBeInTheDocument()
})

test('says that the midpoint changes the compa-ratio only', async () => {
  stubApi({ '/api/meta': META, '/api/bands': [US_LEVEL_2] })
  renderScreen(<BandsPage />)

  const dialog = await openEditDialog()

  expect(within(dialog).getByText(/midpoint changes the compa-ratio only/i)).toBeInTheDocument()
})

test('sends no preview request while the amounts equal the band', async () => {
  const api = stubApi({ '/api/meta': META, '/api/bands': [US_LEVEL_2] })
  renderScreen(<BandsPage />)

  await openEditDialog()

  expect(requestsTo(api, '/api/bands/1/preview')).toHaveLength(0)
})

test('shows the effect of the new minimum after the HR Manager stops typing', async () => {
  let sent: unknown[] = []
  stubApi({
    '/api/meta': META,
    '/api/bands': [US_LEVEL_2],
    'POST /api/bands/1/preview': (_url: URL, body: unknown) => {
      sent = [...sent, body]
      return PREVIEW
    },
  })
  renderScreen(<BandsPage />)
  const dialog = await openEditDialog()
  const user = fakeClock()

  await typeMinimum(user, dialog, '55000')
  expect(sent).toHaveLength(0)
  await act(() => vi.advanceTimersByTimeAsync(300))

  expect(await within(dialog).findByText('0 to 2')).toBeInTheDocument()
  expect(within(dialog).getByText('$0 to $5,000')).toBeInTheDocument()
  expect(sent).toEqual([{ min_minor: 5_500_000, mid_minor: 6_500_000, max_minor: 7_800_000 }])
})

test('shows one value for a figure that the change does not move', async () => {
  stubApi({
    '/api/meta': META,
    '/api/bands': [US_LEVEL_2],
    'POST /api/bands/1/preview': PREVIEW,
  })
  renderScreen(<BandsPage />)
  const dialog = await openEditDialog()
  const user = fakeClock()

  await typeMinimum(user, dialog, '55000')
  await act(() => vi.advanceTimersByTimeAsync(300))

  await within(dialog).findByText('0 to 2')
  const aboveRow = within(dialog).getByText('Above range').parentElement!
  expect(within(aboveRow).getByText('1')).toBeInTheDocument()
  expect(within(aboveRow).queryByText(/to/)).not.toBeInTheDocument()
})

test('shows no effect and no error banner while the band is not valid', async () => {
  stubApi({
    '/api/meta': META,
    '/api/bands': [US_LEVEL_2],
    'POST /api/bands/1/preview': refuse(422, [
      {
        field: 'min_minor',
        cause: 'The minimum must be less than the midpoint.',
      },
    ]),
  })
  renderScreen(<BandsPage />)
  const dialog = await openEditDialog()
  const user = fakeClock()

  await typeMinimum(user, dialog, '99000')
  await act(() => vi.advanceTimersByTimeAsync(300))

  expect(
    await within(dialog).findByText('Give a valid band to see the effect.'),
  ).toBeInTheDocument()
  expect(
    within(dialog).queryByText('The minimum must be less than the midpoint.'),
  ).not.toBeInTheDocument()
  expect(within(dialog).queryByText('Effect on the employees of this band')).not.toBeInTheDocument()
})

test('removes the effect when the HR Manager types the amounts of the band again', async () => {
  stubApi({
    '/api/meta': META,
    '/api/bands': [US_LEVEL_2],
    'POST /api/bands/1/preview': PREVIEW,
  })
  renderScreen(<BandsPage />)
  const dialog = await openEditDialog()
  const user = fakeClock()
  await typeMinimum(user, dialog, '55000')
  await act(() => vi.advanceTimersByTimeAsync(300))
  await within(dialog).findByText('Effect on the employees of this band')

  await typeMinimum(user, dialog, '52000')
  await act(() => vi.advanceTimersByTimeAsync(300))

  await waitFor(() =>
    expect(within(dialog).queryByText('Effect on the employees of this band')).not.toBeInTheDocument(),
  )
})

test('says that the effect did not load when the preview fails for another cause', async () => {
  stubApi({
    '/api/meta': META,
    '/api/bands': [US_LEVEL_2],
    'POST /api/bands/1/preview': refuse(500, 'Server error'),
  })
  renderScreen(<BandsPage />)
  const dialog = await openEditDialog()
  const user = fakeClock()

  await typeMinimum(user, dialog, '55000')
  await act(() => vi.advanceTimersByTimeAsync(300))

  expect(await within(dialog).findByText('The effect did not load.')).toBeInTheDocument()
  expect(within(dialog).queryByText('Give a valid band to see the effect.')).not.toBeInTheDocument()
})
