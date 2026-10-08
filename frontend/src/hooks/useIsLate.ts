import { useEffect, useState } from 'react'

/** The time that a load must run before the screen shows it. A quick reply shows no load state. */
export const SHOW_LOAD_AFTER_MS = 150

/** True when `isLoading` has been true for `SHOW_LOAD_AFTER_MS`. It prevents a flash for a quick reply. */
export function useIsLate(isLoading: boolean): boolean {
  const [isLate, setIsLate] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      return
    }
    const timer = setTimeout(() => setIsLate(true), SHOW_LOAD_AFTER_MS)
    return () => {
      clearTimeout(timer)
      setIsLate(false)
    }
  }, [isLoading])

  return isLoading && isLate
}
