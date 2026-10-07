// FR-01, FR-03, FR-06, FR-07, FR-09: the loading, empty and error states of each screen.
import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ApiError } from '../api/client'
import type { ApiState } from '../hooks/useApi'
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
