import { Grid } from '@astryxdesign/core/Grid'
import { Heading } from '@astryxdesign/core/Heading'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import type { EmployeeDetail } from '../../api/types'
import { Stat } from '../../components'
import { formatJobLevel } from '../../lib/format'
import { RangeBar } from './RangeBar'

interface Props {
  employee: EmployeeDetail
  countryName: string
}

/** The salary of the employee against the salary band of the job level and the country. */
export function PositionInRange({ employee, countryName }: Props) {
  const { band, compa_ratio, range_penetration } = employee
  if (!band || compa_ratio === null || range_penetration === null) {
    return null
  }

  return (
    <Stack gap={4}>
      <Stack direction="horizontal" hAlign="between" vAlign="center" gap={3} wrap="wrap">
        <Heading level={2}>Position in the salary band</Heading>
        <Text type="supporting">
          {countryName}, {formatJobLevel(employee.job_level)}
        </Text>
      </Stack>
      <RangeBar band={band} salaryMinor={employee.salary_minor} />
      <Grid columns={{ minWidth: 200, max: 2 }} gap={6}>
        <Stat
          size="md"
          label="Compa-ratio"
          value={compa_ratio.toFixed(2)}
          help="The compa-ratio is the salary divided by the band midpoint. A ratio of 1.00 means that the salary is at the midpoint."
          testId="compa-ratio"
        />
        <Stat
          size="md"
          label="Range penetration"
          value={`${range_penetration.toFixed(1)}%`}
          help="Range penetration is the position of the salary in the salary band. 0% is the band minimum. 100% is the band maximum."
          testId="range-penetration"
        />
      </Grid>
    </Stack>
  )
}
