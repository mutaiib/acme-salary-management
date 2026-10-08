import { SideNavItem } from '@astryxdesign/core/SideNav'
import { Moon, Sun } from 'lucide-react'
import type { ColorModeState } from '../hooks/useColorMode'

/**
 * The item at the bottom of the navigation that changes the color mode. It is an item with
 * a name, as the other items are, so it is not an icon alone, and it is in the navigation
 * of a narrow screen. The name and the icon tell the mode that the item gives.
 */
export function ColorModeItem({ colorMode }: { colorMode: ColorModeState }) {
  return (
    <SideNavItem
      label={colorMode.isDark ? 'Use the light mode' : 'Use the dark mode'}
      icon={colorMode.isDark ? Sun : Moon}
      onClick={colorMode.toggle}
    />
  )
}
