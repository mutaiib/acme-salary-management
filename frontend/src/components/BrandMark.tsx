import { Icon } from '@astryxdesign/core/Icon'
import type { SVGProps } from 'react'

// The glyph on the tile takes the color for content on the accent, from the theme.
const ON_ACCENT = { fill: 'var(--color-on-accent)' }

/**
 * The logo: 3 salary bands that step up, like the job levels, on a tile of the accent color.
 * The dot on the top band is the position of one salary in its band.
 * The tile is `currentColor`, so the `Icon` gives it the accent of the light or the dark mode.
 */
function BandsLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" {...props}>
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <rect x="6" y="20.5" width="13" height="4.5" rx="2.25" style={ON_ACCENT} opacity={0.5} />
      <rect x="9.5" y="13.75" width="13" height="4.5" rx="2.25" style={ON_ACCENT} opacity={0.75} />
      <rect x="13" y="7" width="13" height="4.5" rx="2.25" style={ON_ACCENT} />
      <circle cx="22.75" cy="9.25" r="1.6" fill="currentColor" />
    </svg>
  )
}

/** The mark of the product. It is decoration, so a screen reader skips it; the name is next to it. */
export function BrandMark() {
  return (
    <span aria-hidden="true">
      <Icon icon={BandsLogo} color="accent" size="lg" />
    </span>
  )
}
