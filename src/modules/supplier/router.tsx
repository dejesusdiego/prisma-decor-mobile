import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute, RoleGuard } from '@core/auth'
import { SupplierLayout } from './components/SupplierLayout'
import {
  SupplierDashboardPage,
  SupplierLoginPage,
  CatalogoPage,
  PedidosPage,
  PerfilPage,
} from './pages'

export default function SupplierRouter() {
  return (
    <Routes>
      <Route path="/login" element={<SupplierLoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['supplier']}>
              <SupplierLayout />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<SupplierDashboardPage />} />
        <Route path="dashboard" element={<SupplierDashboardPage />} />
        <Route path="catalogo" element={<CatalogoPage />} />
        <Route path="pedidos" element={<PedidosPage />} />
        <Route path="perfil" element={<PerfilPage />} />
      </Route>
    </Routes>
  )
}
