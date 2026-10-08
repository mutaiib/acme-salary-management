// FR-20: the back link with an arrow.
import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderScreen } from '../test/render'
import { BackLink } from './BackLink'

test('shows a link with its text and address', () => {
  renderScreen(<BackLink href="/employees" label="Back to Employees" />)

  expect(screen.getByRole('link', { name: 'Back to Employees' })).toHaveAttribute(
    'href',
    '/employees',
  )
})

test('shows an arrow before the text, and a screen reader does not read the arrow', () => {
  renderScreen(<BackLink href="/employees" label="Back to Employees" />)

  const link = screen.getByRole('link', { name: 'Back to Employees' })
  const arrow = link.querySelector('svg')
  expect(arrow).not.toBeNull()
  expect(arrow).toHaveAttribute('aria-hidden', 'true')
  expect(link.firstElementChild?.contains(arrow)).toBe(true)
})
