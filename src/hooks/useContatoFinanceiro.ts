import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ContaReceberContato {
  id: string;
  orcamento_id: string | null;
  valor_total: number;
  valor_pago: number;
  status: string;
  numero_parcelas: number;
  data_vencimento: string;
  orcamento?: {
    codigo: string;
    total_geral: number;
  };
  parcelas: Array<{
    id: string;
    numero_parcela: number;
    valor: number;
    data_vencimento: string;
    data_pagamento: string | null;
    status: string;
  }>;
}

export interface PedidoContato {
  id: string;
  numero_pedido: string;
  status_producao: string;
  prioridade: string;
  previsao_entrega: string | null;
  data_entrada: string;
  orcamento?: {
    codigo: string;
    cliente_nome: string;
    total_geral: number;
  };
  instalacoes?: Array<{
    id: string;
    data_agendada: string;
    turno: string;
    status: string;
  }>;
}

export function useContatoFinanceiro(contatoId: string | null, telefone: string | null) {
  return useQuery({
    queryKey: ['contato-financeiro', contatoId, telefone],
    queryFn: async () => {
      if (!contatoId && !telefone) return { contasReceber: [], totalAReceber: 0, totalRecebido: 0 };

      // Buscar orçamentos do contato
      let query = supabase
        .from('orcamentos')
        .select('id');
      
      if (contatoId) {
        query = query.or(`contato_id.eq.${contatoId}${telefone ? `,cliente_telefone.eq.${telefone}` : ''}`);
      } else if (telefone) {
        query = query.eq('cliente_telefone', telefone);
      }

      const { data: orcamentos } = await query;
      const orcamentoIds = orcamentos?.map(o => o.id) || [];

      if (orcamentoIds.length === 0) {
        return { contasReceber: [], totalAReceber: 0, totalRecebido: 0 };
      }

      // Buscar contas a receber
      const { data: contasReceber, error } = await supabase
        .from('contas_receber')
        .select(`
          *,
          orcamento:orcamentos(codigo, total_geral),
          parcelas:parcelas_receber(id, numero_parcela, valor, data_vencimento, data_pagamento, status)
        `)
        .in('orcamento_id', orcamentoIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalAReceber = contasReceber?.reduce((sum, c) => sum + (c.valor_total - c.valor_pago), 0) || 0;
      const totalRecebido = contasReceber?.reduce((sum, c) => sum + c.valor_pago, 0) || 0;

      return {
        contasReceber: (contasReceber || []) as ContaReceberContato[],
        totalAReceber,
        totalRecebido
      };
    },
    enabled: !!(contatoId || telefone)
  });
}

export function useContatoPedidos(contatoId: string | null, telefone: string | null) {
  return useQuery({
    queryKey: ['contato-pedidos', contatoId, telefone],
    queryFn: async () => {
      if (!contatoId && !telefone) return [];

      // Buscar orçamentos do contato
      let query = supabase
        .from('orcamentos')
        .select('id');
      
      if (contatoId) {
        query = query.or(`contato_id.eq.${contatoId}${telefone ? `,cliente_telefone.eq.${telefone}` : ''}`);
      } else if (telefone) {
        query = query.eq('cliente_telefone', telefone);
      }

      const { data: orcamentos } = await query;
      const orcamentoIds = orcamentos?.map(o => o.id) || [];

      if (orcamentoIds.length === 0) return [];

      // Buscar pedidos
      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          orcamento:orcamentos(codigo, cliente_nome, total_geral),
          instalacoes(id, data_agendada, turno, status)
        `)
        .in('orcamento_id', orcamentoIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (pedidos || []) as PedidoContato[];
    },
    enabled: !!(contatoId || telefone)
  });
}
