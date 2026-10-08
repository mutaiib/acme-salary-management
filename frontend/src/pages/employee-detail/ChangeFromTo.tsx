import { Text } from '@astryxdesign/core/Text'
import { formatMoney, formatSignedMoney } from '../../lib/format'
import { changePct } from '../../lib/money'

interface Props {
  /** The current salary, in minor units. */
  oldMinor: number
  /** The new salary, in minor units. Null is an empty input. */
  newMinor: number | null
  currency: string
}

/** A change in percent with its sign, for example `+7.7%`. */
function signedPct(pct: number): string {
  return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`
}

/** The sentence of a salary change, for example `From $65,000 to $70,000. Change: +$5,000 (+7.7%).` */
function changeSentence(oldMinor: number, newMinor: number | null, currency: string): string {
  const current = formatMoney(oldMinor, currency)
  if (newMinor === null) {
    return `Current salary: ${current}.`
  }
  if (newMinor === oldMinor) {
    return `Current salary: ${current}. No change.`
  }
  const difference = formatSignedMoney(newMinor - oldMinor, currency)
  const pct = signedPct(changePct(oldMinor, newMinor))
  return `From ${current} to ${formatMoney(newMinor, currency)}. Change: ${difference} (${pct}).`
}

/** Shows the current salary and the new salary in one line, with the change. */
export function ChangeFromTo({ oldMinor, newMinor, currency }: Props) {
  return <Text hasTabularNumbers>{changeSentence(oldMinor, newMinor, currency)}</Text>
}
