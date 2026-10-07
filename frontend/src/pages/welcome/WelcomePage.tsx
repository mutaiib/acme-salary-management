import { Button } from '@astryxdesign/core/Button'
import { Card } from '@astryxdesign/core/Card'
import { Grid } from '@astryxdesign/core/Grid'
import { Heading } from '@astryxdesign/core/Heading'
import { Icon, type IconType } from '@astryxdesign/core/Icon'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Calculator, FileCheck, HeartPulse, Layers, LayoutDashboard, PencilLine } from 'lucide-react'

// What the system can do, in the order of the work of the HR Manager.
const CAPABILITIES: { title: string; text: string; icon: IconType }[] = [
  {
    title: 'Know the payroll cost',
    text: 'The payroll cost, the headcount and the median salary of ACME, for one year, in one currency.',
    icon: LayoutDashboard,
  },
  {
    title: 'See where the money goes',
    text: 'The same figures for each country, each department and each job level.',
    icon: Layers,
  },
  {
    title: 'Find the pay problems',
    text: 'The employees who have a salary outside the salary band for their job.',
    icon: HeartPulse,
  },
  {
    title: 'Know the cost of a correction',
    text: 'The cost to move each low salary to the minimum of its band.',
    icon: Calculator,
  },
  {
    title: 'Change a salary, with rules',
    text: 'A new salary or an increase in percent, with a reason and an effective date.',
    icon: PencilLine,
  },
  {
    title: 'Keep the proof',
    text: 'A salary history for each employee: the old salary, the new salary, the reason and the date.',
    icon: FileCheck,
  },
]

/**
 * The first screen of the application: the introduction of the submission. It tells the
 * problem, the purpose of the system and what it can do. The button opens the Pay overview.
 */
export function WelcomePage() {
  return (
    <Stack minHeight="100dvh" hAlign="center" vAlign="center" padding={6}>
      <Stack gap={8} maxWidth={960}>
        <Stack gap={4}>
          <Text type="label" color="accent">
            Salary management assessment
          </Text>
          <Heading level={1}>ACME Salary Management</Heading>
          <Text type="large" weight="normal" as="p">
            Hello, I am Mutaib, and this is my submission for the salary management assessment.
          </Text>
          <Text as="p" color="secondary">
            ACME has 10,000 employees in 8 countries, and the HR team keeps the salaries in Excel.
            An Excel file cannot answer a pay question, and it does not record when a salary
            changed, or why.
          </Text>
          <Text as="p" color="secondary">
            So I did not build an employee list with a salary column. I built a system that helps
            the HR Manager make a pay decision. This is what it can do.
          </Text>
        </Stack>
        <Grid columns={{ minWidth: 240, max: 3 }} gap={4}>
          {CAPABILITIES.map((capability) => (
            <Card key={capability.title} padding={5}>
              <Stack gap={2}>
                <Icon icon={capability.icon} color="accent" size="lg" />
                <Heading level={2}>{capability.title}</Heading>
                <Text as="p" color="secondary">
                  {capability.text}
                </Text>
              </Stack>
            </Card>
          ))}
        </Grid>
        <Stack direction="horizontal">
          <Button
            label="Enter"
            variant="primary"
            size="lg"
            href="/overview"
            endContent={<Icon icon="chevronRight" />}
          />
        </Stack>
      </Stack>
    </Stack>
  )
}
