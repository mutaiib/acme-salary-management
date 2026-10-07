// FR-01, FR-03, FR-06, FR-07, FR-09, all screens: how a screen loads data, and what it shows when two replies cross.
import { act, renderHook, waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ApiError } from '../api/client'
import { useApi, useIsLoading } from './useApi'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (cause: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

test('ignores a reply that arrives after a newer request started', async () => {
  const first = deferred<string>()
  const second = deferred<string>()
  const replies = { a: first.promise, b: second.promise }
  const { result, rerender } = renderHook(({ key }: { key: 'a' | 'b' }) => useApi(() => replies[key], [key]), {
    initialProps: { key: 'a' },
  })

  rerender({ key: 'b' })
  await act(async () => second.resolve('new'))
  await act(async () => first.resolve('old'))

  expect(result.current.data).toBe('new')
})

test('removes the error while it tries again', async () => {
  let attempt = deferred<string>()
  const { result } = renderHook(() => useApi(() => attempt.promise, []))
  await act(async () => attempt.reject(new ApiError(0, 'The server did not respond.')))
  expect(result.current.error?.message).toBe('The server did not respond.')

  attempt = deferred<string>()
  act(() => result.current.reload())

  expect(result.current.error).toBeUndefined()
  expect(result.current.isLoading).toBe(true)
  await act(async () => attempt.resolve('data'))
  await waitFor(() => expect(result.current.data).toBe('data'))
})

test('tells the application that a load runs, until the reply arrives', async () => {
  const reply = deferred<string>()
  const { result } = renderHook(() => {
    useApi(() => reply.promise, [])
    return useIsLoading()
  })
  expect(result.current).toBe(true)

  await act(async () => reply.resolve('data'))

  await waitFor(() => expect(result.current).toBe(false))
})
