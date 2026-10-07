import { useSearchParams } from 'react-router-dom'
import type { EmployeeListQuery } from '../../api/employees'

export type FilterName = 'search' | 'country' | 'department' | 'job_level' | 'status' | 'sort'

const FILTER_NAMES: FilterName[] = ['search', 'country', 'department', 'job_level', 'status', 'sort']

/**
 * Keeps the search, the filters and the page number in the address.
 * The HR Manager can then go to an employee and come back to the same list.
 */
export function useEmployeeFilters() {
  const [params, setParams] = useSearchParams()

  const query: EmployeeListQuery = { page: Number(params.get('page')) || 1 }
  for (const name of FILTER_NAMES) {
    query[name] = params.get(name) ?? undefined
  }

  function setFilter(name: FilterName, value: string) {
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

  return { query, setFilter, setPage }
}
