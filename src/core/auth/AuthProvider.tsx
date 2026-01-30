import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthContextType, AuthState, UserRole } from './types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    role: null,
    organizationId: null,
    supplierId: null,
    isApprovedSupplier: false,
  })

  const determineRole = useCallback(async (user: User): Promise<Partial<AuthState>> => {
    // Check if super_admin
    const { data: adminData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .eq('role', 'super_admin')
      .single()

    if (adminData) {
      return { role: 'super_admin' as UserRole }
    }

    // Check if supplier
    const { data: supplierData } = await supabase
      .from('suppliers')
      .select('id, status')
      .eq('user_id', user.id)
      .single()

    if (supplierData) {
      return {
        role: 'supplier' as UserRole,
        supplierId: supplierData.id,
        isApprovedSupplier: supplierData.status === 'approved',
      }
    }

    // Check organization membership
    const { data: memberData } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single()

    if (memberData) {
      return {
        role: memberData.role as UserRole,
        organizationId: memberData.organization_id,
      }
    }

    return { role: null }
  }, [])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        determineRole(session.user).then((roleData) => {
          setState({
            user: session.user,
            session,
            loading: false,
            role: roleData.role || null,
            organizationId: roleData.organizationId || null,
            supplierId: roleData.supplierId || null,
            isApprovedSupplier: roleData.isApprovedSupplier || false,
          })
        })
      } else {
        setState((prev) => ({ ...prev, loading: false }))
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const roleData = await determineRole(session.user)
          setState({
            user: session.user,
            session,
            loading: false,
            role: roleData.role || null,
            organizationId: roleData.organizationId || null,
            supplierId: roleData.supplierId || null,
            isApprovedSupplier: roleData.isApprovedSupplier || false,
          })
        } else {
          setState({
            user: null,
            session: null,
            loading: false,
            role: null,
            organizationId: null,
            supplierId: null,
            isApprovedSupplier: false,
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [determineRole])

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }, [])

  const signOut = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut()
  }, [])

  const refreshRole = useCallback(async (): Promise<void> => {
    if (state.user) {
      const roleData = await determineRole(state.user)
      setState((prev) => ({ ...prev, ...roleData }))
    }
  }, [state.user, determineRole])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signOut,
        refreshRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
