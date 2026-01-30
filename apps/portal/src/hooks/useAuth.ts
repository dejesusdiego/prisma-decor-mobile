import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  supplier: any | null
  isLoading: boolean
  error: string | null
  isSupplier: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    supplier: null,
    isLoading: true,
    error: null,
    isSupplier: false,
  })

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setState(prev => ({ ...prev, isLoading: false }))
        return
      }

      // Check if user is a supplier
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'approved')
        .single()

      setState({
        user: session.user,
        supplier,
        isLoading: false,
        error: null,
        isSupplier: !!supplier,
      })
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session) {
          setState({ user: null, supplier: null, isLoading: false, error: null, isSupplier: false })
          return
        }

        const { data: supplier } = await supabase
          .from('suppliers')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('status', 'approved')
          .single()

        setState({
          user: session.user,
          supplier,
          isLoading: false,
          error: null,
          isSupplier: !!supplier,
        })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setState(prev => ({ ...prev, isLoading: false, error: error.message }))
      return { error: error.message }
    }

    // Check if is supplier
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', data.user.id)
      .eq('status', 'approved')
      .single()

    if (!supplier) {
      await supabase.auth.signOut()
      setState(prev => ({ ...prev, isLoading: false, error: 'Acesso restrito a fornecedores aprovados' }))
      return { error: 'Acesso restrito a fornecedores aprovados' }
    }

    setState({
      user: data.user,
      supplier,
      isLoading: false,
      error: null,
      isSupplier: true,
    })
    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setState({ user: null, supplier: null, isLoading: false, error: null, isSupplier: false })
  }, [])

  return {
    ...state,
    signIn,
    signOut,
  }
}
