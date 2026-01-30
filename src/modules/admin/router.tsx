import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute, RoleGuard } from '@core/auth'
import { AdminLayout } from './components/AdminLayout'
import {
  AdminDashboardPage,
  AdminLoginPage,
  OrganizationsPage,
  UsersPage,
  SuppliersPage,
  PlansPage,
} from './pages'

export default function AdminRouter() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['super_admin']}>
              <AdminLayout />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="organizations" element={<OrganizationsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="plans" element={<PlansPage />} />
      </Route>
    </Routes>
  )
}
