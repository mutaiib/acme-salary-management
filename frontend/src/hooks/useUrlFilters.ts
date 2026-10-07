import { useSearchParams } from 'react-router-dom'

/** The page number in the address. A value that is not a whole number above 0 gives page 1. */
function pageFrom(text: string | null): number {
  const page = Number(text)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

/** The numbers of rows that a list can show on one page. The first one is the default. */
export const PAGE_SIZES = [10, 25, 50, 100]

/** The page size in the address. A value that is not in the list gives the default. */
function pageSizeFrom(text: string | null): number {
  const size = Number(text)
  return PAGE_SIZES.includes(size) ? size : PAGE_SIZES[0]
}

/**
 * Keeps the filters, the page number and the page size of a list in the address.
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

  function setPageSize(pageSize: number) {
    // A new page size moves the rows to other pages, so the list starts at page 1 again.
    setFilter('page_size', pageSize === PAGE_SIZES[0] ? '' : String(pageSize))
  }

  return {
    filter,
    setFilter,
    page: pageFrom(params.get('page')),
    setPage,
    pageSize: pageSizeFrom(params.get('page_size')),
    setPageSize,
  }
}
