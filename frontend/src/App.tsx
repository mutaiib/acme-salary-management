import { AppShell } from '@astryxdesign/core/AppShell'
import { LinkProvider } from '@astryxdesign/core/Link'
import { SideNav, SideNavHeading, SideNavItem, SideNavSection } from '@astryxdesign/core/SideNav'
import { Theme } from '@astryxdesign/core/theme'
import { neutralTheme } from '@astryxdesign/theme-neutral/built'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { RouterLink } from './components/RouterLink'
import { BandsPage } from './pages/bands/BandsPage'
import { EmployeeDetailPage } from './pages/employee-detail/EmployeeDetailPage'
import { EmployeesPage } from './pages/employees/EmployeesPage'
import { OverviewPage } from './pages/overview/OverviewPage'
import { PayHealthPage } from './pages/pay-health/PayHealthPage'

const SCREENS = [
  { path: '/overview', label: 'Overview' },
  { path: '/employees', label: 'Employees' },
  { path: '/bands', label: 'Salary bands' },
  { path: '/pay-health', label: 'Pay health' },
]

export function App() {
  const { pathname } = useLocation()

  return (
    <Theme theme={neutralTheme}>
      <LinkProvider component={RouterLink}>
        <AppShell
          height="fill"
          sideNav={
            <SideNav
              aria-label="Main"
              header={<SideNavHeading heading="Salary Management" superheading="ACME" />}
            >
              <SideNavSection title="Pay" isHeaderHidden>
                {SCREENS.map((screen) => (
                  <SideNavItem
                    key={screen.path}
                    label={screen.label}
                    href={screen.path}
                    isSelected={pathname.startsWith(screen.path)}
                  />
                ))}
              </SideNavSection>
            </SideNav>
          }
        >
          <Routes>
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/bands" element={<BandsPage />} />
            <Route path="/pay-health" element={<PayHealthPage />} />
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </AppShell>
      </LinkProvider>
    </Theme>
  )
}
