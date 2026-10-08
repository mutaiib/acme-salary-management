import { useState } from 'react'

/** `system` follows the color mode of the device. It is the mode with no selection. */
export type ColorMode = 'light' | 'dark' | 'system'

/** The name of the selection in the storage of the browser. */
export const COLOR_MODE_KEY = 'acme-color-mode'

export interface ColorModeState {
  /** The mode for the Astryx theme. */
  mode: ColorMode
  /** True when the screen is dark now, from the selection or from the device. */
  isDark: boolean
  /** Changes from light to dark, or from dark to light, and keeps the selection. */
  toggle: () => void
}

function keptMode(): ColorMode {
  const kept = localStorage.getItem(COLOR_MODE_KEY)
  return kept === 'light' || kept === 'dark' ? kept : 'system'
}

function deviceIsDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * The color mode of the application. The HR Manager selects light or dark, and the
 * browser keeps the selection. With no selection, the mode follows the device.
 */
export function useColorMode(): ColorModeState {
  const [mode, setMode] = useState<ColorMode>(keptMode)
  const isDark = mode === 'system' ? deviceIsDark() : mode === 'dark'

  function toggle() {
    const next = isDark ? 'light' : 'dark'
    localStorage.setItem(COLOR_MODE_KEY, next)
    setMode(next)
  }

  return { mode, isDark, toggle }
}
