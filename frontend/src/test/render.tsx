import { Theme } from '@astryxdesign/core/theme'
import { neutralTheme } from '@astryxdesign/theme-neutral/built'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

interface Options {
  /** The URL that the screen opens at. */
  at?: string
  /** The route pattern of the screen, when it reads a URL parameter. */
  path?: string
}

/** Renders a screen with the theme and the router that the application gives it. */
export function renderScreen(screen: ReactElement, { at = '/', path = '*' }: Options = {}) {
  return render(
    <Theme theme={neutralTheme}>
      <MemoryRouter initialEntries={[at]}>
        <Routes>
          <Route path={path} element={screen} />
          <Route path="*" element={<p>Other screen</p>} />
        </Routes>
      </MemoryRouter>
    </Theme>,
  )
}
