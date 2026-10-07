import { Heading } from '@astryxdesign/core/Heading'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import type { EmployeeDetail } from '../../api/types'
import { RangeBar, RangeStatusBadge } from '../../components'

/** The salary of the employee against the salary band of the job level and the country. */
export function PositionInRange({ employee }: { employee: EmployeeDetail }) {
  const { band, compa_ratio, range_penetration } = employee

  return (
    <Stack gap={3} maxWidth={720} data-testid="position-in-range">
      <Stack direction="horizontal" gap={3} vAlign="center">
        <Heading level={2}>Position in range</Heading>
        <RangeStatusBadge status={employee.range_status} />
      </Stack>
      {band && compa_ratio !== null && range_penetration !== null && (
        <>
          <Stack direction="horizontal" gap={8}>
            <Metric
              name="Compa-ratio"
              value={compa_ratio.toFixed(2)}
              note="Salary divided by the band midpoint"
              testId="compa-ratio"
            />
            <Metric
              name="Range penetration"
              value={`${range_penetration.toFixed(1)}%`}
              note="0% is the band minimum, 100% is the band maximum"
              testId="range-penetration"
            />
          </Stack>
          <RangeBar band={band} salaryMinor={employee.salary_minor} />
        </>
      )}
    </Stack>
  )
}

function Metric(props: { name: string; value: string; note: string; testId: string }) {
  return (
    <Stack gap={0}>
      <Text type="label" color="secondary">
        {props.name}
      </Text>
      <Text type="large" weight="semibold" hasTabularNumbers data-testid={props.testId}>
        {props.value}
      </Text>
      <Text type="supporting">{props.note}</Text>
    </Stack>
  )
}
