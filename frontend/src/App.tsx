import { AppShell } from '@astryxdesign/core/AppShell'
import { InternationalizationProvider } from '@astryxdesign/core/i18n'
import { LinkProvider } from '@astryxdesign/core/Link'
import { SideNav, SideNavHeading, SideNavItem, SideNavSection } from '@astryxdesign/core/SideNav'
import { Theme } from '@astryxdesign/core/theme'
import type { ReactElement } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { LoadingBar } from './components/LoadingBar'
import { RouterLink } from './components/RouterLink'
import { BandsPage } from './pages/bands/BandsPage'
import { EmployeeDetailPage } from './pages/employee-detail/EmployeeDetailPage'
import { EmployeesPage } from './pages/employees/EmployeesPage'
import { OverviewPage } from './pages/overview/OverviewPage'
import { PayHealthPage } from './pages/pay-health/PayHealthPage'
import { acmeTheme } from './theme'

interface Screen {
  path: string
  label: string
  element: ReactElement
}

// The one list of the screens. The navigation and the routes come from it.
// The order follows the work of the HR Manager: see the pay, find the problems, change a salary.
const SECTIONS: { title: string; screens: Screen[] }[] = [
  {
    title: 'Insights',
    screens: [
      { path: '/overview', label: 'Pay overview', element: <OverviewPage /> },
      { path: '/pay-health', label: 'Pay health', element: <PayHealthPage /> },
    ],
  },
  {
    title: 'Manage',
    screens: [
      { path: '/employees', label: 'Employees', element: <EmployeesPage /> },
      { path: '/bands', label: 'Salary bands', element: <BandsPage /> },
    ],
  },
]

// A required input shows a star. `index.css` gives the star the error color.
const TEXT_OVERRIDES = { en: { '@astryx.field.required': '*' } }

const SCREENS = SECTIONS.flatMap((section) => section.screens)
const HOME = SCREENS[0].path

export function App() {
  const { pathname } = useLocation()

  return (
    <Theme theme={acmeTheme}>
      <InternationalizationProvider locale="en" overrides={TEXT_OVERRIDES}>
        <LinkProvider component={RouterLink}>
          <AppShell
            height="fill"
            banner={<LoadingBar />}
            sideNav={
              <SideNav
                aria-label="Main"
              collapsible
                header={<SideNavHeading heading="Salary Management" superheading="ACME" />}
              >
                {SECTIONS.map((section) => (
                  <SideNavSection key={section.title} title={section.title}>
                    {section.screens.map((screen) => (
                      <SideNavItem
                        key={screen.path}
                        label={screen.label}
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
              <Route path="*" element={<Navigate to={HOME} replace />} />
            </Routes>
          </AppShell>
        </LinkProvider>
      </InternationalizationProvider>
    </Theme>
  )
}
