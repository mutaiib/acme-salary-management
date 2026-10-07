import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { type ApiError, toApiError } from '../api/client'

// The number of loads that run now, for all screens. The bar at the top of the
// application reads it, so each load shows in one place.
let activeLoads = 0
const listeners = new Set<() => void>()

function changeActiveLoads(change: 1 | -1) {
  activeLoads += change
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** True while one or more loads of `useApi` run. */
export function useIsLoading(): boolean {
  return useSyncExternalStore(subscribe, () => activeLoads > 0)
}

export interface ApiState<T> {
  data: T | undefined
  error: ApiError | undefined
  isLoading: boolean
  reload: () => void
}

/**
 * Loads data when the screen opens and when a dependency changes.
 * The old data stays on the screen while the new data loads.
 * A reply for an old request is ignored, so two replies that cross cannot show old data.
 */
export function useApi<T>(load: () => Promise<T>, deps: unknown[]): ApiState<T> {
  const [data, setData] = useState<T>()
  const [error, setError] = useState<ApiError>()
  const [isLoading, setIsLoading] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let isCurrent = true
    setIsLoading(true)
    // A new attempt removes the old error, so the screen shows that it tries again.
    setError(undefined)
    changeActiveLoads(1)
    load()
      .then((result) => {
        if (isCurrent) {
          setData(result)
        }
      })
      .catch((cause: unknown) => {
        if (isCurrent) {
          setError(toApiError(cause))
        }
      })
      .finally(() => {
        changeActiveLoads(-1)
        if (isCurrent) {
          setIsLoading(false)
        }
      })
    return () => {
      isCurrent = false
    }
    // The caller gives the dependencies of `load`, so `load` itself is not a dependency.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  const reload = useCallback(() => setVersion((current) => current + 1), [])
  return { data, error, isLoading, reload }
}
