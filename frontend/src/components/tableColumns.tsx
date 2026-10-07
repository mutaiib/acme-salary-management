import { pixel, proportional, type TableColumn } from '@astryxdesign/core/Table'
import { formatJobLevel } from '../lib/format'
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

/** A table column that shows the job level, for example "Level 3". */
export function jobLevelColumn<T extends { job_level: number }>(
  header = 'Level',
): TableColumn<TableRow<T>> {
  return {
    key: 'job_level',
    header,
    width: pixel(110),
    renderCell: (row) => formatJobLevel(row.job_level),
  }
}
