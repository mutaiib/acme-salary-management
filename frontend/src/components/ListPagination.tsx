import { Pagination } from '@astryxdesign/core/Pagination'
import type { Page } from '../api/types'

interface Props {
  page: Page<unknown>
  onChange: (page: number) => void
  /** The accessible name, for example "Employee pages". */
  label: string
}

/** The page controls below a list. They do not show when all rows are on one page. */
export function ListPagination({ page, onChange, label }: Props) {
  if (page.total <= page.page_size) {
    return null
  }
  return (
    <Pagination
      page={page.page}
      onChange={onChange}
      totalItems={page.total}
      pageSize={page.page_size}
      label={label}
    />
  )
}
