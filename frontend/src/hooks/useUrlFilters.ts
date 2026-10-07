import { useSearchParams } from 'react-router-dom'

/** The page number in the address. A value that is not a whole number above 0 gives page 1. */
function pageFrom(text: string | null): number {
  const page = Number(text)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

/**
 * Keeps the filters and the page number of a list in the address.
 * The HR Manager can then open an employee and come back to the same list.
 */
export function useUrlFilters() {
  const [params, setParams] = useSearchParams()

  /** The value of one filter. An empty string means that the filter is not set. */
  function filter(name: string): string {
    return params.get(name) ?? ''
  }

  function setFilter(name: string, value: string) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) {
          next.set(name, value)
        } else {
          next.delete(name)
        }
        // A new filter changes the result, so the old page number has no meaning.
        next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  function setPage(page: number) {
    setParams((current) => {
      const next = new URLSearchParams(current)
      next.set('page', String(page))
      return next
    })
  }

  return { filter, setFilter, page: pageFrom(params.get('page')), setPage }
}
