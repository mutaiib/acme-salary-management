// FR-01, FR-10: a figure with its label, and the info button of a term.
import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderScreen } from '../test/render'
import { Stat } from './Stat'

const labelRowOf = (label: string) => screen.getByText(label).parentElement!

test('gives a label with no info button the height of a label with an info button', () => {
  renderScreen(
    <>
      <Stat label="Below range" value="290" />
      <Stat label="Correction cost" value="$1.09M" help="The cost to move each low salary to the band minimum." />
    </>,
  )

  expect(labelRowOf('Below range').style.minHeight).toBe('var(--size-element-sm)')
  expect(labelRowOf('Correction cost').style.minHeight).toBe('var(--size-element-sm)')
})

test('names the group of a figure with its label', () => {
  renderScreen(<Stat label="Headcount" value="9,699" note="Active employees" />)

  expect(screen.getByRole('group', { name: 'Headcount' })).toHaveTextContent('9,699')
})
