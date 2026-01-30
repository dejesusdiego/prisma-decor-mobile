import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute, RoleGuard } from '@core/auth'
import { OrgLayout } from './components/OrgLayout'
import {
  DashboardPage,
  LoginPage,
  OrcamentosPage,
  NovoOrcamentoPage,
} from './pages'

export default function OrgRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['org_admin', 'org_user']}>
              <OrgLayout />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="orcamentos" element={<OrcamentosPage />} />
        <Route path="orcamentos/novo" element={<NovoOrcamentoPage />} />
      </Route>
    </Routes>
  )
}
