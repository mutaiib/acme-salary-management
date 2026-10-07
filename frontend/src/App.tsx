import { AppShell } from '@astryxdesign/core/AppShell'
import { LinkProvider } from '@astryxdesign/core/Link'
import { SideNav, SideNavHeading, SideNavItem, SideNavSection } from '@astryxdesign/core/SideNav'
import { Theme } from '@astryxdesign/core/theme'
import { neutralTheme } from '@astryxdesign/theme-neutral/built'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { RouterLink } from './components/RouterLink'
import { EmployeeDetailPage } from './pages/employee-detail/EmployeeDetailPage'
import { EmployeesPage } from './pages/employees/EmployeesPage'

const SCREENS = [{ path: '/employees', label: 'Employees' }]

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
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="*" element={<Navigate to="/employees" replace />} />
          </Routes>
        </AppShell>
      </LinkProvider>
    </Theme>
  )
}
