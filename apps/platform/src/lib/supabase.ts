import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://tjwpqrlfhngibuwqodcn.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Validação para evitar crash
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ ERRO: Variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidas!')
  console.error('URL:', SUPABASE_URL ? '✓ Definida' : '✗ Não definida')
  console.error('ANON_KEY:', SUPABASE_ANON_KEY ? '✓ Definida' : '✗ Não definida')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
})

export type User = Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user']
export type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']
