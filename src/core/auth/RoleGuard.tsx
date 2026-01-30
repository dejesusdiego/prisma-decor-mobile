import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import type { UserRole } from './types'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: UserRole[]
  fallback?: ReactNode
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { role, loading } = useAuth()

  if (loading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )
    )
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
