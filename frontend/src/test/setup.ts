import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// A query that waits for the screen has 3 seconds. The default of 1 second was too short
// when the computer was busy, and a test then failed with no error in the code.
configure({ asyncUtilTimeout: 3000 })

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

// jsdom does not implement the modal methods of <dialog>.
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute('open')
}

// jsdom does not implement scroll.
window.scrollTo = () => {}
Element.prototype.scrollTo ??= () => {}

// jsdom does not implement media queries. The tests run as a wide screen with a mouse.
window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList

// jsdom does not implement ResizeObserver. A Recharts chart needs it.
// A chart in a `ChartFigure` has no size in a test, so a chart test draws the bars at a fixed size.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
