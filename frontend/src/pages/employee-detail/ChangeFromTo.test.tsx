// FR-04: the line that shows the current salary and the new salary.
import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderScreen } from '../../test/render'
import { ChangeFromTo } from './ChangeFromTo'

test('shows only the current salary when there is no new salary', () => {
  renderScreen(<ChangeFromTo oldMinor={6_500_000} newMinor={null} currency="USD" />)

  expect(screen.getByText('Current salary: $65,000.')).toBeInTheDocument()
})
