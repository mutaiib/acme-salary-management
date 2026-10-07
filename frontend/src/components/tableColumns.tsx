import { proportional, type TableColumn } from '@astryxdesign/core/Table'
import { Money } from './Money'

/** The row type that an Astryx table accepts for the data type `T`. */
export type TableRow<T> = T & Record<string, unknown>

/** A table column that shows an amount of money, aligned at the end. */
export function moneyColumn<T extends { currency: string }>(
  key: keyof T & string,
  header: string,
  /** The currency of the amount. The default is the currency of the row. */
  currencyOf: (row: T) => string = (row) => row.currency,
): TableColumn<TableRow<T>> {
  return {
    key,
    header,
    width: proportional(1),
    align: 'end',
    renderCell: (row) => <Money amountMinor={Number(row[key])} currency={currencyOf(row)} />,
  }
}
