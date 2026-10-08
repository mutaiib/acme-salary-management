// FR-21: the light and the dark color mode.
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test, vi } from 'vitest'
import { COLOR_MODE_KEY, useColorMode } from '../hooks/useColorMode'
import { renderScreen } from '../test/render'
import { ColorModeItem } from './ColorModeItem'

afterEach(() => {
  localStorage.clear()
})

/** The item with the hook, as the application uses them, and the mode in words. */
function Shell() {
  const colorMode = useColorMode()
  return (
    <>
      <p>Mode: {colorMode.mode}</p>
      <ColorModeItem colorMode={colorMode} />
    </>
  )
}

function deviceUsesDark(isDark: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: isDark && query === '(prefers-color-scheme: dark)',
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

test('follows the color mode of the device when the HR Manager made no selection', () => {
  deviceUsesDark(true)

  renderScreen(<Shell />)

  expect(screen.getByText('Mode: system')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Use the light mode' })).toBeInTheDocument()
})

test('changes to the dark color mode and keeps the selection', async () => {
  deviceUsesDark(false)
  renderScreen(<Shell />)

  await userEvent.click(screen.getByRole('button', { name: 'Use the dark mode' }))

  expect(screen.getByText('Mode: dark')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Use the light mode' })).toBeInTheDocument()
  expect(localStorage.getItem(COLOR_MODE_KEY)).toBe('dark')
})

test('changes back to the light color mode', async () => {
  deviceUsesDark(false)
  renderScreen(<Shell />)

  await userEvent.click(screen.getByRole('button', { name: 'Use the dark mode' }))
  await userEvent.click(screen.getByRole('button', { name: 'Use the light mode' }))

  expect(screen.getByText('Mode: light')).toBeInTheDocument()
  expect(localStorage.getItem(COLOR_MODE_KEY)).toBe('light')
})

test('starts with the selection that the browser kept', () => {
  deviceUsesDark(false)
  localStorage.setItem(COLOR_MODE_KEY, 'dark')

  renderScreen(<Shell />)

  expect(screen.getByText('Mode: dark')).toBeInTheDocument()
})

test('follows the device when the kept value is not a color mode', () => {
  deviceUsesDark(false)
  localStorage.setItem(COLOR_MODE_KEY, 'purple')

  renderScreen(<Shell />)

  expect(screen.getByText('Mode: system')).toBeInTheDocument()
})
