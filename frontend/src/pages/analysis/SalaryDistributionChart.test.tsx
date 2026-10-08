// FR-17, FR-20: the marks of the salary distribution chart.
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import type { SalaryDistribution } from '../../api/types'
import { renderScreen } from '../../test/render'
import { SalaryDistributionBars } from './SalaryDistributionChart'

const DISTRIBUTION: SalaryDistribution = {
  reporting_currency: 'USD',
  bracket_width_minor: 2_000_000,
  brackets: [
    { from_minor: 0, to_minor: 2_000_000, headcount: 1 },
    { from_minor: 2_000_000, to_minor: 4_000_000, headcount: 5 },
    { from_minor: 4_000_000, to_minor: 6_000_000, headcount: 3 },
  ],
}

test('draws one bar for each salary bracket', () => {
  const { container } = renderScreen(
    <SalaryDistributionBars distribution={DISTRIBUTION} width={600} height={280} isAnimated={false} />,
  )

  expect(container.querySelectorAll('.recharts-bar-rectangle')).toHaveLength(
    DISTRIBUTION.brackets.length,
  )
})

test('gives the salary bracket of a bar to onSelect when the HR Manager clicks the bar', async () => {
  const onSelect = vi.fn()
  const { container } = renderScreen(
    <SalaryDistributionBars
      distribution={DISTRIBUTION}
      width={600}
      height={280}
      isAnimated={false}
      onSelect={onSelect}
    />,
  )

  await userEvent.click(container.querySelectorAll('.recharts-bar-rectangle')[1])

  expect(onSelect).toHaveBeenCalledTimes(1)
  expect(onSelect).toHaveBeenCalledWith(DISTRIBUTION.brackets[1])
})
