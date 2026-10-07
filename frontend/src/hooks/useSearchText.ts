import { useEffect, useRef, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'

export const SEARCH_DELAY_MS = 300

/**
 * The text in a search box. The address holds the search that is applied.
 * The box follows the address when the address changes from outside (a link, or Back).
 * The address follows the box after the HR Manager stops typing.
 */
export function useSearchText(applied: string, apply: (text: string) => void) {
  const [text, setText] = useState(applied)
  const debounced = useDebouncedValue(text, SEARCH_DELAY_MS)
  const lastApplied = useRef(applied)

  useEffect(() => {
    if (applied !== lastApplied.current) {
      lastApplied.current = applied
      setText(applied)
    }
  }, [applied])

  useEffect(() => {
    if (debounced !== lastApplied.current) {
      lastApplied.current = debounced
      apply(debounced)
    }
    // Only a change of the typed text starts a search, so `apply` is not a dependency.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  return [text, setText] as const
}
