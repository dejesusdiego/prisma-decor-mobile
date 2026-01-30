import { useQuery } from '@tanstack/react-query'
import { supabase } from '@core/lib/supabase'

export interface Orcamento {
  id: string
  codigo: string
  cliente_nome: string
  cliente_telefone: string
  endereco: string
  cidade: string
  status: 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado'
  total_geral: number
  total_com_desconto: number
  created_at: string
  updated_at: string
}

interface UseOrcamentosOptions {
  status?: string
  enabled?: boolean
}

export function useOrcamentos(options: UseOrcamentosOptions = {}) {
  const { status, enabled = true } = options

  return useQuery({
    queryKey: ['orcamentos', status],
    queryFn: async (): Promise<Orcamento[]> => {
      let query = supabase
        .from('orcamentos')
        .select('id, codigo, cliente_nome, cliente_telefone, endereco, cidade, status, total_geral, total_com_desconto, created_at, updated_at')
        .order('created_at', { ascending: false })

      if (status && status !== 'todos') {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled,
    staleTime: 1 * 60 * 1000,
  })
}
