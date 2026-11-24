import { Badge } from '@astryxdesign/core/Badge'
import { Banner } from '@astryxdesign/core/Banner'
import { Button } from '@astryxdesign/core/Button'
import { ClickableCard } from '@astryxdesign/core/ClickableCard'
import { Divider } from '@astryxdesign/core/Divider'
import { Grid } from '@astryxdesign/core/Grid'
import { Heading } from '@astryxdesign/core/Heading'
import { Icon, type IconType } from '@astryxdesign/core/Icon'
import { Link } from '@astryxdesign/core/Link'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { FileCheck, HeartPulse, LayoutDashboard, PencilLine } from 'lucide-react'
import { getOverview, getPayHealth } from '../../api/insights'
import type { Overview, PayHealthSummary } from '../../api/types'
import { BrandMark, DataState, Panel, Stat } from '../../components'
import { useApi } from '../../hooks/useApi'
import { formatCount, formatMoney, formatMoneyShort } from '../../lib/format'

// The work of the HR Manager, in order. Each step opens the screen that does it.
const STEPS: { title: string; text: string; href: string; icon: IconType }[] = [
  {
    title: 'See the pay',
    text: 'Payroll cost, headcount and median salary, by country, department and job level.',
    href: '/overview',
    icon: LayoutDashboard,
  },
  {
    title: 'Find the problems',
    text: 'Each salary outside its band, worst first, with the cost to correct it.',
    href: '/pay-health',
    icon: HeartPulse,
  },
  {
    title: 'Change a salary',
    text: 'A new salary or an increase, with a reason, a date and the band in view.',
    href: '/employees',
    icon: PencilLine,
  },
  {
    title: 'Keep the proof',
    text: 'A salary history for each employee that no person can edit.',
    href: '/employees',
    icon: FileCheck,
  },
]

const loadFigures = () => Promise.all([getOverview('country'), getPayHealth()])

/**
 * The first screen of the application. It says what the system does in one line, and
 * proves it with the live figures of ACME. The steps open the screens of the work.
 */
export function WelcomePage() {
  const figures = useApi(loadFigures, [])

  return (
    <Stack minHeight="100dvh" hAlign="center" vAlign="center" padding={6}>
      <Stack gap={10} maxWidth={1120} width="100%">
        <Stack direction="horizontal" gap={2} vAlign="center">
          <BrandMark />
          <Text weight="semibold">ACME Salary Management</Text>
        </Stack>

        <Grid columns={{ minWidth: 340, max: 2 }} gap={10} align="center">
          <Stack gap={5}>
            <Text type="label" color="accent">
              10,000 employees · 8 countries · 7 currencies
            </Text>
            <Heading level={1} type="display-2" textWrap="balance">
              Know what ACME pays. Fix what is wrong. Prove each change.
            </Heading>
            <Text type="large" weight="normal" color="secondary" as="p" textWrap="pretty">
              The salaries of ACME were in Excel files, which cannot answer a pay question. This
              system gives the HR Manager the answer, and a record of each change.
            </Text>
            <Stack direction="horizontal" gap={3} wrap="wrap">
              <Button
                label="Open the Pay overview"
                variant="primary"
                size="lg"
                href="/overview"
                endContent={<Icon icon="chevronRight" />}
              />
              <Button label="Find an employee" variant="secondary" size="lg" href="/employees" />
            </Stack>
          </Stack>

          <Panel title="ACME today" end={<Badge variant="green" label="Live data" />}>
            <DataState state={figures} loadingHeight={248}>
              {([overview, health]) => <TodayFigures overview={overview} health={health} />}
            </DataState>
          </Panel>
        </Grid>

        <Stack gap={4}>
          <Divider />
          <Grid
            columns={{ minWidth: 220, max: 4 }}
            gap={4}
            role="list"
            aria-label="What the system does"
          >
            {STEPS.map((step, index) => (
              <div role="listitem" key={step.title}>
                <ClickableCard label={step.title} href={step.href} padding={5} height="100%">
                  <Stack gap={2}>
                    <Stack direction="horizontal" gap={2} vAlign="center">
                      <Icon icon={step.icon} color="accent" />
                      <Text type="supporting">Step {index + 1}</Text>
                    </Stack>
                    <Heading level={2}>{step.title}</Heading>
                    <Text as="p" color="secondary">
                      {step.text}
                    </Text>
                  </Stack>
                </ClickableCard>
              </div>
            ))}
          </Grid>
        </Stack>
      </Stack>
    </Stack>
  )
}

/** The headline figures of ACME, and the salaries outside the band. */
function TodayFigures({ overview, health }: { overview: Overview; health: PayHealthSummary }) {
  const currency = overview.reporting_currency
  const outsideCount = health.below_count + health.above_count

  return (
    <Stack gap={5}>
      <Grid columns={{ minWidth: 140, max: 3 }} gap={4}>
        <Stat
          label="Payroll cost"
          value={formatMoneyShort(overview.payroll_cost_minor, currency)}
          fullValue={formatMoney(overview.payroll_cost_minor, currency)}
          note={`For one year, in ${currency}`}
        />
        <Stat label="Active employees" value={formatCount(overview.headcount)} note="Paid now" />
        <Stat
          label="Median salary"
          value={formatMoney(overview.median_salary_minor, currency)}
          note="For one year"
        />
      </Grid>
      {outsideCount > 0 && (
        <Banner
          status="warning"
          title={`${formatCount(outsideCount)} salaries are outside their band`}
          description={
            <Stack gap={1}>
              <Text type="inherit">
                {`${formatCount(health.below_count)} below range, ${formatCount(health.above_count)} above range`}
              </Text>
              <Text type="inherit">
                The correction cost is {formatMoney(health.correction_cost_minor, currency)} for one
                year.
              </Text>
            </Stack>
          }
        />
      )}
      <Link href="/pay-health" isStandalone>
        See the salaries outside the band
      </Link>
    </Stack>
  )
}
