// FR-14: the first screen states the purpose of the system and what it can do.
import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderScreen } from '../../test/render'
import { WelcomePage } from './WelcomePage'

test('states the problem of the HR Manager and the purpose of the system', () => {
  renderScreen(<WelcomePage />)

  expect(screen.getByRole('heading', { level: 1, name: 'ACME Salary Management' })).toBeInTheDocument()
  expect(screen.getByText(/the HR team keeps the salaries in Excel/)).toBeInTheDocument()
  expect(
    screen.getByText('Salary management that helps the HR Manager make a pay decision, and keeps the proof.'),
  ).toBeInTheDocument()
})

test('shows a card for each of the 6 capabilities', () => {
  renderScreen(<WelcomePage />)

  expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
    'Know the payroll cost',
    'See where the money goes',
    'Find the pay problems',
    'Know the cost of a correction',
    'Change a salary, with rules',
    'Keep the proof',
  ])
})

test('opens the Pay overview from the Enter link', () => {
  renderScreen(<WelcomePage />)

  expect(screen.getByRole('link', { name: 'Enter' })).toHaveAttribute('href', '/overview')
})
