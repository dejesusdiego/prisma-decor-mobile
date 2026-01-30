import { useEffect, useState, ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    async function checkRole() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setIsSuperAdmin(false)
        setIsLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role === 'super_admin') {
        setIsSuperAdmin(true)
      } else {
        // Redirecionar para app.studioos.pro se não for super_admin
        window.location.href = 'https://app.studioos.pro'
      }
      
      setIsLoading(false)
    }

    checkRole()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isSuperAdmin) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
