// FR-01, FR-03, FR-06, FR-07, FR-09, FR-20: the loading, empty and error states of each screen.
import { act, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { ApiError } from '../api/client'
import type { ApiState } from '../hooks/useApi'
import { SHOW_LOAD_AFTER_MS } from '../hooks/useIsLate'
import { renderScreen } from '../test/render'
import { DataState } from './DataState'

function stateOf(overrides: Partial<ApiState<string[]>>): ApiState<string[]> {
  return { data: undefined, error: undefined, isLoading: false, reload: () => {}, ...overrides }
}

function show(state: ApiState<string[]>) {
  renderScreen(
    <DataState state={state} isEmpty={(data) => data.length === 0} emptyTitle="No rows">
      {(data) => <p>{data.join(', ')}</p>}
    </DataState>,
  )
}

test('shows a loading indicator while the data loads', () => {
  show(stateOf({ isLoading: true }))

  expect(screen.getByLabelText('Loading')).toHaveAttribute('aria-busy', 'true')
})

test('shows the data when it is loaded', () => {
  show(stateOf({ data: ['Asha', 'Liam'] }))

  expect(screen.getByText('Asha, Liam')).toBeInTheDocument()
  expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument()
})

test('shows the empty state when the data has nothing to show', () => {
  show(stateOf({ data: [] }))

  expect(screen.getByText('No rows')).toBeInTheDocument()
})

test('shows the error and a button to try again', () => {
  show(stateOf({ error: new ApiError(0, 'The server did not respond.') }))

  expect(screen.getByText('The data did not load')).toBeInTheDocument()
  expect(screen.getByText('The server did not respond.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
})

test('keeps the data on the screen and adds the error when a later load fails', () => {
  show(stateOf({ data: ['Asha'], error: new ApiError(0, 'The server did not respond.') }))

  expect(screen.getByText('Asha')).toBeInTheDocument()
  expect(screen.getByText('The data did not load')).toBeInTheDocument()
})

test('keeps the old data on the screen while new data loads', () => {
  show(stateOf({ data: ['Asha'], isLoading: true }))

  expect(screen.getByText('Asha')).toBeInTheDocument()
})

test('shows rows with a shimmer in place of the old rows when a later load of a list is slow', async () => {
  renderScreen(
    <DataState state={stateOf({ data: ['Asha', 'Ben'], isLoading: true })} rowsOf={(data) => data.length}>
      {(data) => <p>{data.join(', ')}</p>}
    </DataState>,
  )

  expect(await screen.findByRole('status', { name: 'Loading' })).toBeInTheDocument()
  expect(screen.queryByText('Asha, Ben')).not.toBeInTheDocument()
})

test('keeps the old rows of a list for a later load that ends at once', () => {
  renderScreen(
    <DataState state={stateOf({ data: ['Asha'], isLoading: true })} rowsOf={(data) => data.length}>
      {(data) => <p>{data.join(', ')}</p>}
    </DataState>,
  )

  expect(screen.getByText('Asha')).toBeInTheDocument()
})

function showWithHeight(state: ApiState<string[]>, extra: { rowsOf?: (data: string[]) => number } = {}) {
  return renderScreen(
    <DataState state={state} loadingHeight={280} {...extra}>
      {(data) => <p>{data.join(', ')}</p>}
    </DataState>,
  )
}

const shimmersIn = (container: HTMLElement) => container.querySelectorAll('.astryx-skeleton')

test('keeps an empty box of the given height while the first load is quick', () => {
  const { container } = showWithHeight(stateOf({ isLoading: true }))

  expect(screen.getByRole('status', { name: 'Loading' })).toHaveStyle({ height: '280px' })
  expect(shimmersIn(container)).toHaveLength(0)
})

test('shows one shimmer of the given height when the first load is slow', async () => {
  const { container } = showWithHeight(stateOf({ isLoading: true }))

  await waitFor(() => expect(shimmersIn(container)).toHaveLength(1))
  expect(shimmersIn(container)[0].getAttribute('style')).toContain('--x-height: 280px')
})

afterEach(() => {
  vi.useRealTimers()
})

test('keeps the old data for a later load that is slow, with a given height', async () => {
  vi.useFakeTimers()
  const { container } = showWithHeight(stateOf({ data: ['Asha'], isLoading: true }))

  await act(() => vi.advanceTimersByTimeAsync(SHOW_LOAD_AFTER_MS * 2))

  expect(screen.getByText('Asha')).toBeInTheDocument()
  expect(shimmersIn(container)).toHaveLength(0)
})

test('keeps the old data for a later load that ends at once, with a given height', () => {
  showWithHeight(stateOf({ data: ['Asha'], isLoading: true }))

  expect(screen.getByText('Asha')).toBeInTheDocument()
})

test('shows rows with a shimmer for a later slow load of a list that has rowsOf and a given height', async () => {
  const { container } = showWithHeight(stateOf({ data: ['Asha', 'Ben'], isLoading: true }), {
    rowsOf: (data) => data.length,
  })

  await waitFor(() => expect(shimmersIn(container)).toHaveLength(2))
})

test('shows 5 rows with a shimmer for a first load with no given height', () => {
  const { container } = renderScreen(
    <DataState state={stateOf({ isLoading: true })}>{(data) => <p>{data.join(', ')}</p>}</DataState>,
  )

  expect(shimmersIn(container)).toHaveLength(5)
})
