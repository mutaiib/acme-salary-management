import { Card } from '@astryxdesign/core/Card'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'

interface Props {
  label: string
  value: string
  /** A short note below the value, for example the unit or the date. */
  hint?: string
  /** A test finds the value with this id. */
  testId?: string
}

/** One headline figure. The insight screens show a row of these at the top. */
export function StatCard({ label, value, hint, testId }: Props) {
  return (
    <Card>
      <Stack gap={1}>
        <Text type="label" color="secondary">
          {label}
        </Text>
        <Text type="display-3" hasTabularNumbers data-testid={testId}>
          {value}
        </Text>
        {hint && <Text type="supporting">{hint}</Text>}
      </Stack>
    </Card>
  )
}
