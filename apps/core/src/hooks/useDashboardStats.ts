import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface DashboardStats {
  totalOrcamentos: number
  orcamentosPendentes: number
  orcamentosAprovados: number
  orcamentosConvertidos: number
  totalValor: number
  recentOrcamentos: Array<{
    id: string
    codigo: string
    cliente_nome: string
    status: string
    total_com_desconto: number
    created_at: string
  }>
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Get total count

      const { count: totalOrcamentos } = await supabase
        .from('orcamentos')
        .select('*', { count: 'exact', head: true })

      const { count: pendentes } = await supabase
        .from('orcamentos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'enviado')

      const { count: aprovados } = await supabase
        .from('orcamentos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'aprovado')

      const { count: convertidos } = await supabase
        .from('orcamentos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'convertido')

      // Get total value
      const { data: totals, error: totalsError } = await supabase
        .from('orcamentos')
        .select('total_com_desconto')

      if (totalsError) throw totalsError

      const totalValor = totals?.reduce((sum, orc) => sum + (orc.total_com_desconto || 0), 0) || 0

      // Get recent orçamentos
      const { data: recent, error: recentError } = await supabase
        .from('orcamentos')
        .select('id, codigo, cliente_nome, status, total_com_desconto, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentError) throw recentError

      return {
        totalOrcamentos: totalOrcamentos || 0,
        orcamentosPendentes: pendentes || 0,
        orcamentosAprovados: aprovados || 0,
        orcamentosConvertidos: convertidos || 0,
        totalValor,
        recentOrcamentos: recent || [],
      }
    },
    staleTime: 1 * 60 * 1000,
  })
}
