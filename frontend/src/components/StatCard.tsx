import { Card } from '@astryxdesign/core/Card'
import { Stat } from './Stat'

interface Props {
  label: string
  value: string
  /** The value with all its digits, when `value` is a short form. It shows on hover. */
  fullValue?: string
  /** A short note below the value, for example the unit or the date. */
  hint?: string
  /** The explanation of the figure. It opens from an info button beside the label. */
  help?: string
  /** A test finds the value with this id. */
  testId?: string
}

/** One headline figure in a card. The insight screens show a row of these at the top. */
export function StatCard({ label, value, fullValue, hint, help, testId }: Props) {
  return (
    <Card>
      <Stat
        label={label}
        value={value}
        fullValue={fullValue}
        note={hint}
        help={help}
        testId={testId}
      />
    </Card>
  )
}
