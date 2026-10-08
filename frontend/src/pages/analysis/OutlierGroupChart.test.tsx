// FR-18, FR-20: the marks of the outliers chart.
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import type { OutlierGroup, OutlierStatus } from '../../api/types'
import { renderScreen } from '../../test/render'
import { OutlierGroupBars } from './OutlierGroupChart'

const GROUPS: OutlierGroup[] = [
  { key: 'US', label: 'United States', headcount: 50, below_count: 7, above_count: 3 },
  { key: 'DE', label: 'Germany', headcount: 20, below_count: 2, above_count: 0 },
]

function drawBars(onSelect?: (group: OutlierGroup, status: OutlierStatus) => void) {
  return renderScreen(
    <OutlierGroupBars
      groups={GROUPS}
      width={600}
      height={200}
      isAnimated={false}
      onSelect={onSelect}
    />,
  )
}

test('draws one bar part for each count that is more than zero', () => {
  const { container } = drawBars()

  expect(container.querySelectorAll('.recharts-bar-rectangle')).toHaveLength(3)
})

test('names the 2 parts of a bar in the legend', () => {
  drawBars()

  expect(screen.getByText('Below range')).toBeInTheDocument()
  expect(screen.getByText('Above range')).toBeInTheDocument()
})

test('writes the signed count in each part of a bar, and no label for a zero', () => {
  const { container } = drawBars()

  const labels = [...container.querySelectorAll('.recharts-label')].map((label) => label.textContent)
  expect(labels.filter(Boolean).sort()).toEqual(['+3', '-2', '-7'])
})

test('gives the group and the status of a part to onSelect when the HR Manager clicks the part', async () => {
  const onSelect = vi.fn()
  const { container } = drawBars(onSelect)

  // The parts, in the order of the DOM: the 2 below-range parts, then the above-range part.
  const parts = container.querySelectorAll('.recharts-bar-rectangle')
  await userEvent.click(parts[1])
  await userEvent.click(parts[2])

  expect(onSelect).toHaveBeenNthCalledWith(1, GROUPS[1], 'below')
  expect(onSelect).toHaveBeenNthCalledWith(2, GROUPS[0], 'above')
})
