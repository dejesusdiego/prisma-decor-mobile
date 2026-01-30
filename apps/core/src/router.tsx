import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ProtectedRoute } from './components/ProtectedRoute'
import { DashboardPage } from './pages/DashboardPage'
import { OrcamentosPage } from './pages/OrcamentosPage'
import { NovoOrcamentoPage } from './pages/NovoOrcamentoPage'
import { LoginPage } from './pages/LoginPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'orcamentos', element: <OrcamentosPage /> },
      { path: 'orcamentos/novo', element: <NovoOrcamentoPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
