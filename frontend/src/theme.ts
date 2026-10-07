import { defineTheme } from '@astryxdesign/core/theme'
import { neutralPalettes } from './themes/neutral/neutralPalettes'
import { neutralTheme } from './themes/neutral/neutralTheme'

const { blue } = neutralPalettes

/**
 * The neutral theme of Astryx with a blue accent. The accent of the neutral theme
 * is almost black, so a link and a primary button did not stand out.
 * Each value is a [light, dark] pair from the palette of the theme.
 */
export const acmeTheme = defineTheme({
  name: 'acme',
  extends: neutralTheme,
  tokens: {
    '--color-accent': [blue.light[40], blue.dark[80]],
    '--color-accent-muted': [blue.light[95], blue.dark[15]],
    '--color-text-accent': [blue.light[40], blue.dark[80]],
    '--color-icon-accent': [blue.light[40], blue.dark[80]],
  },
})
