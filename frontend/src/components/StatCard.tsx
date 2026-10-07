import { Card } from '@astryxdesign/core/Card'
import { Stat } from './Stat'

interface Props {
  label: string
  value: string
  /** A short note below the value, for example the unit or the date. */
  hint?: string
  /** A test finds the value with this id. */
  testId?: string
}

/** One headline figure in a card. The insight screens show a row of these at the top. */
export function StatCard({ label, value, hint, testId }: Props) {
  return (
    <Card>
      <Stat label={label} value={value} note={hint} testId={testId} />
    </Card>
  )
}
