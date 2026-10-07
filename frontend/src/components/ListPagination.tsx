import { Pagination } from '@astryxdesign/core/Pagination'
import type { Page } from '../api/types'
import { PAGE_SIZES } from '../hooks/useUrlFilters'

interface Props {
  page: Page<unknown>
  onChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  /** The accessible name, for example "Employee pages". */
  label: string
}

/**
 * The page controls below a list, with the number of rows on a page. They do not show when all rows are on
 * one page of the smallest size.
 */
export function ListPagination({ page, onChange, onPageSizeChange, label }: Props) {
  if (page.total <= PAGE_SIZES[0]) {
    return null
  }
  return (
    <Pagination
      page={page.page}
      onChange={onChange}
      totalItems={page.total}
      pageSize={page.page_size}
      pageSizeOptions={PAGE_SIZES}
      onPageSizeChange={onPageSizeChange}
      label={label}
    />
  )
}
