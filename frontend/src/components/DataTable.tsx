import { Table, type TableColumn } from '@astryxdesign/core/Table'
import type { TableRow } from './tableColumns'

interface Props<T> {
  rows: T[]
  columns: TableColumn<TableRow<T>>[]
  /** The property that identifies a row. */
  idKey: keyof T & string
  /** Highlights the row under the pointer. Use it when a row has a link or an action. */
  hasHover?: boolean
  /** For a list with pages: the position of the first row in the full list. */
  rowIndexStart?: number
  /** For a list with pages: the number of rows in the full list. */
  rowCount?: number
}

/** The table of each screen. All tables have the same density. */
export function DataTable<T>({ rows, columns, idKey, ...rest }: Props<T>) {
  return (
    <Table
      data={rows as TableRow<T>[]}
      columns={columns}
      idKey={idKey}
      density="compact"
      {...rest}
    />
  )
}
