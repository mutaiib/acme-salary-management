import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../api/client'

export interface ApiState<T> {
  data: T | undefined
  error: ApiError | undefined
  isLoading: boolean
  reload: () => void
}

/**
 * Loads data when the screen opens and when a dependency changes.
 * The old data stays on the screen while the new data loads.
 */
export function useApi<T>(load: () => Promise<T>, deps: unknown[]): ApiState<T> {
  const [data, setData] = useState<T>()
  const [error, setError] = useState<ApiError>()
  const [isLoading, setIsLoading] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let isCurrent = true
    setIsLoading(true)
    load()
      .then((result) => {
        if (isCurrent) {
          setData(result)
          setError(undefined)
        }
      })
      .catch((cause: unknown) => {
        if (isCurrent) {
          setError(cause instanceof ApiError ? cause : new ApiError(0, String(cause)))
        }
      })
      .finally(() => {
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
