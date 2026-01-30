import { useEffect, useState, ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSupplier, setIsSupplier] = useState(false)

  useEffect(() => {
    async function checkSupplier() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setIsSupplier(false)
        setIsLoading(false)
        return
      }

      const { data: supplier } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('status', 'approved')
        .single()

      setIsSupplier(!!supplier)
      setIsLoading(false)
    }

    checkSupplier()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isSupplier) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
