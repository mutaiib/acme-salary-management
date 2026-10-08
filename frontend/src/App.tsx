import { AppShell } from '@astryxdesign/core/AppShell'
import { InternationalizationProvider } from '@astryxdesign/core/i18n'
import { LinkProvider } from '@astryxdesign/core/Link'
import type { IconType } from '@astryxdesign/core/Icon'
import {
  SideNav,
  SideNavCollapseButton,
  SideNavHeading,
  SideNavItem,
  SideNavSection,
} from '@astryxdesign/core/SideNav'
import { Theme } from '@astryxdesign/core/theme'
import { ChartColumn, HeartPulse, LayoutDashboard, Rows3, Users } from 'lucide-react'
import { type ReactElement, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ColorModeItem } from './components/ColorModeItem'
import { LoadingBar } from './components/LoadingBar'
import { RouterLink } from './components/RouterLink'
import { BandsPage } from './pages/bands/BandsPage'
import { EmployeeDetailPage } from './pages/employee-detail/EmployeeDetailPage'
import { EmployeesPage } from './pages/employees/EmployeesPage'
import { ExchangeRatesPage } from './pages/exchange-rates/ExchangeRatesPage'
import { PayAnalysisPage } from './pages/analysis/PayAnalysisPage'
import { OverviewPage } from './pages/overview/OverviewPage'
import { PayHealthPage } from './pages/pay-health/PayHealthPage'
import { WelcomePage } from './pages/welcome/WelcomePage'
import { useColorMode } from './hooks/useColorMode'
import { acmeTheme } from './theme'

interface Screen {
  path: string
  label: string
  /** The icon of the navigation item. The icons come from the icon set of the theme. */
  icon: IconType
  element: ReactElement
}

// The one list of the screens. The navigation and the routes come from it.
// The order follows the work of the HR Manager: see the pay, find the problems, change a salary.
const SECTIONS: { title: string; screens: Screen[] }[] = [
  {
    title: 'Insights',
    screens: [
      { path: '/overview', label: 'Pay overview', icon: LayoutDashboard, element: <OverviewPage /> },
      { path: '/pay-health', label: 'Pay health', icon: HeartPulse, element: <PayHealthPage /> },
      { path: '/analysis', label: 'Pay analysis', icon: ChartColumn, element: <PayAnalysisPage /> },
    ],
  },
  {
    title: 'Manage',
    screens: [
      { path: '/employees', label: 'Employees', icon: Users, element: <EmployeesPage /> },
      { path: '/bands', label: 'Salary bands', icon: Rows3, element: <BandsPage /> },
    ],
  },
]

// A required input shows a star. `index.css` gives the star the error color.
const TEXT_OVERRIDES = { en: { '@astryx.field.required': '*' } }

const SCREENS = SECTIONS.flatMap((section) => section.screens)
const HOME = SCREENS[0].path

export function App() {
  const { pathname } = useLocation()
  // The collapse button is at the top right of the heading, not in the footer. A collapsed
  // navigation hides the heading row, so the expand button then shows below the heading.
  const [isNavCollapsed, setNavCollapsed] = useState(false)
  const navCollapse = { isCollapsed: isNavCollapsed, onCollapsedChange: setNavCollapsed }

  // The Welcome screen has no item for the color mode. It uses the mode that the browser kept.
  const colorMode = useColorMode()

  return (
    <Theme theme={acmeTheme} mode={colorMode.mode}>
      <InternationalizationProvider locale="en" overrides={TEXT_OVERRIDES}>
        <LinkProvider component={RouterLink}>
          {pathname === '/' ? (
            // The introduction fills the window. It has no navigation.
            <WelcomePage />
          ) : (
            <AppShell
              height="fill"
              banner={<LoadingBar />}
              sideNav={
                <SideNav
                  aria-label="Main"
                  collapsible={{ ...navCollapse, hasButton: false }}
                  header={
                    <SideNavHeading
                      heading="Salary Management"
                      superheading="ACME"
                      headerEndContent={<SideNavCollapseButton collapsible={navCollapse} />}
                    />
                  }
                  topContent={isNavCollapsed && <SideNavCollapseButton collapsible={navCollapse} />}
                  footer={<ColorModeItem colorMode={colorMode} />}
                >
                  {SECTIONS.map((section) => (
                    <SideNavSection key={section.title} title={section.title}>
                      {section.screens.map((screen) => (
                        <SideNavItem
                          key={screen.path}
                          label={screen.label}
                          icon={screen.icon}
                          href={screen.path}
                          isSelected={pathname.startsWith(screen.path)}
                        />
                      ))}
                    </SideNavSection>
                  ))}
                </SideNav>
              }
            >
              <Routes>
                {SCREENS.map((screen) => (
                  <Route key={screen.path} path={screen.path} element={screen.element} />
                ))}
                <Route path="/employees/:id" element={<EmployeeDetailPage />} />
                {/* The Pay overview links to this screen. It is not in the navigation. */}
                <Route path="/exchange-rates" element={<ExchangeRatesPage />} />
                <Route path="*" element={<Navigate to={HOME} replace />} />
              </Routes>
            </AppShell>
          )}
        </LinkProvider>
      </InternationalizationProvider>
    </Theme>
  )
}
