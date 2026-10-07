import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { band } from '../test/data'
import { renderScreen } from '../test/render'
import { RangeBar } from './RangeBar'

const BAND = band(1, { min_minor: 3_500_000, mid_minor: 5_000_000, max_minor: 6_500_000 })

function bar() {
  return screen.getByRole('progressbar')
}

test('shows the minimum, the midpoint and the maximum of the band', () => {
  renderScreen(<RangeBar band={BAND} salaryMinor={4_500_000} />)

  expect(screen.getByText('$35,000')).toBeInTheDocument()
  expect(screen.getByText('$50,000')).toBeInTheDocument()
  expect(screen.getByText('$65,000')).toBeInTheDocument()
})

test('puts the marker at the position of the salary in the band', () => {
  renderScreen(<RangeBar band={BAND} salaryMinor={5_000_000} />)

  expect(bar()).toHaveAttribute('aria-valuenow', '50')
})

test('keeps the marker at the start of the bar for a salary below the band', () => {
  renderScreen(<RangeBar band={BAND} salaryMinor={3_000_000} />)

  expect(bar()).toHaveAttribute('aria-valuenow', '0')
})

test('keeps the marker at the end of the bar for a salary above the band', () => {
  renderScreen(<RangeBar band={BAND} salaryMinor={9_000_000} />)

  expect(bar()).toHaveAttribute('aria-valuenow', '100')
})
