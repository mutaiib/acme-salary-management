// FR-17, FR-18: the shared frame of a chart.
import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderScreen } from '../test/render'
import { ChartFigure } from './ChartFigure'

function renderFigure() {
  renderScreen(
    <ChartFigure
      label="Headcount by bracket"
      height={200}
      table={
        <table>
          <caption>Headcount by bracket</caption>
          <tbody>
            <tr>
              <th scope="row">Low</th>
              <td>4</td>
            </tr>
          </tbody>
        </table>
      }
    >
      <svg />
    </ChartFigure>,
  )
}

test('shows the table view to a screen reader', () => {
  renderFigure()

  const table = screen.getByRole('table', { name: 'Headcount by bracket' })
  expect(within(table).getByText('Low')).toBeInTheDocument()
})

test('hides the chart marks from a screen reader', () => {
  renderFigure()

  expect(screen.getByTestId('chart-figure')).toHaveAttribute('aria-hidden', 'true')
  expect(screen.getByRole('table').closest('[aria-hidden="true"]')).toBeNull()
})

test('gives the chart region the height that the screen asks for', () => {
  renderFigure()

  expect(screen.getByTestId('chart-figure')).toHaveStyle({
    height: '200px',
  })
})
