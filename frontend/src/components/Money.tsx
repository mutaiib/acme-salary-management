import { Text } from '@astryxdesign/core/Text'
import { formatMoney } from '../lib/format'

interface Props {
  amountMinor: number
  currency: string
}

/** An amount of money. Tabular numbers keep the digits of a column aligned. */
export function Money({ amountMinor, currency }: Props) {
  return (
    <Text type="inherit" hasTabularNumbers>
      {formatMoney(amountMinor, currency)}
    </Text>
  )
}
