// FR-16: the load indicator of a figure that is not in a list.
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import { SHOW_LOAD_AFTER_MS } from '../hooks/useIsLate'
import { renderScreen } from '../test/render'
import { LoadingMark } from './LoadingMark'

afterEach(() => vi.useRealTimers())

test('shows a load indicator when the load is slow', async () => {
  renderScreen(<LoadingMark isLoading />)

  expect(await screen.findByRole('status', { name: 'Loading' })).toBeInTheDocument()
})

test('does not show a load indicator at the start of a load', () => {
  renderScreen(<LoadingMark isLoading />)

  expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument()
})

/** A load that the test ends with a click. */
function EndableLoad() {
  const [isLoading, setIsLoading] = useState(true)
  return (
    <>
      <LoadingMark isLoading={isLoading} />
      <button onClick={() => setIsLoading(false)}>End the load</button>
    </>
  )
}

test('shows no load indicator later when the load ends before the delay', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  renderScreen(<EndableLoad />)

  await user.click(screen.getByRole('button', { name: 'End the load' }))
  await act(() => vi.advanceTimersByTimeAsync(SHOW_LOAD_AFTER_MS * 2))

  expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument()
})
