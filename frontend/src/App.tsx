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
import { PayEquityPage } from './pages/pay-equity/PayEquityPage'
import { PayHealthPage } from './pages/pay-health/PayHealthPage'

// The order follows the work of the HR Manager: see the pay, find the problems, correct a salary.
const SECTIONS = [
  {
    title: 'Insights',
    screens: [
      { path: '/overview', label: 'Pay overview' },
      { path: '/pay-health', label: 'Pay health' },
      { path: '/pay-equity', label: 'Pay equity' },
    ],
  },
  {
    title: 'Manage',
    screens: [
      { path: '/employees', label: 'Employees' },
      { path: '/bands', label: 'Salary bands' },
    ],
  },
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
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/pay-health" element={<PayHealthPage />} />
            <Route path="/pay-equity" element={<PayEquityPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/bands" element={<BandsPage />} />
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </AppShell>
      </LinkProvider>
    </Theme>
  )
}
