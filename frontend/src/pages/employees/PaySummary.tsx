import { Badge } from '@astryxdesign/core/Badge'
import { Card } from '@astryxdesign/core/Card'
import { Divider } from '@astryxdesign/core/Divider'
import { Grid } from '@astryxdesign/core/Grid'
import { Icon } from '@astryxdesign/core/Icon'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Sparkles } from 'lucide-react'
import { getEmployeeSummary } from '../../api/employees'
import type { EmployeeListQuery } from '../../api/employees'
import { Stat } from '../../components'
import { useApi } from '../../hooks/useApi'
import { summaryFigures, summarySentences } from './summarySentences'

type Filters = Omit<EmployeeListQuery, 'page' | 'page_size' | 'sort'>

/**
 * The answer to "what do these employees get?", as figures and in words, for the search and the
 * filters of the list. It shows nothing when the list has no active employee.
 */
export function PaySummary({ filters }: { filters: Filters }) {
  const summary = useApi(() => getEmployeeSummary(filters), [JSON.stringify(filters)])

  if (summary.error) {
    // The list below is still correct, so a failure here must not hide it.
    return <Text type="supporting">The pay figures did not load.</Text>
  }
  const figures = summary.data ? summaryFigures(summary.data) : []
  if (!summary.data || figures.length === 0) {
    return null
  }
  const sentences = summarySentences(summary.data)

  return (
    <Card padding={5}>
      <Stack gap={4} role="region" aria-label="The pay of these employees">
        <Grid columns={{ minWidth: 200, max: 3 }} gap={6}>
          {figures.map((figure) => (
            <Stat
              key={figure.label}
              label={figure.label}
              value={figure.value}
              fullValue={figure.fullValue}
              note={figure.hint}
              help={figure.help}
            />
          ))}
        </Grid>
        <Divider />
        <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
          <Badge variant="purple" label="In words" icon={<Icon icon={Sparkles} size="xsm" />} />
          <Text type="supporting" as="p">
            {sentences.join(' ')}
          </Text>
        </Stack>
      </Stack>
    </Card>
  )
}
