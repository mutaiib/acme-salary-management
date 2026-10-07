import { NumberInput } from '@astryxdesign/core/NumberInput'
import { errorStatus } from '../hooks/useSubmit'
import { toMinor, toUnits } from '../lib/money'

interface Props {
  label: string
  description?: string
  /** The amount in minor units. Null is an empty input. */
  amountMinor: number | null
  onChange: (amountMinor: number) => void
  currency: string
  /** The step of the arrow keys, in currency units. */
  step?: number
  /** The cause of an error for this input. */
  error?: string
}

/**
 * An input for an amount of money. The HR Manager types currency units.
 * The component takes and gives minor units, so no screen converts an amount.
 */
export function MoneyInput({
  label,
  description,
  amountMinor,
  onChange,
  currency,
  step = 100,
  error,
}: Props) {
  return (
    <NumberInput
      label={label}
      description={description}
      value={amountMinor === null ? null : toUnits(amountMinor)}
      onChange={(units) => onChange(toMinor(units))}
      units={currency}
      step={step}
      isRequired
      status={errorStatus(error)}
      statusVariant="detached"
    />
  )
}
