import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StatusFinanceiroPedido {
  orcamentoId: string | null;
  valorTotal: number;
  valorRecebido: number;
  valorPendente: number;
  percentualPago: number;
  statusLiberacao: 'bloqueado' | 'materiais_liberados' | 'instalacao_liberada' | 'totalmente_pago';
  podeLiberarMateriais: boolean;
  podeLiberarInstalacao: boolean;
  contasReceber: {
    id: string;
    status: string;
    valor_total: number;
    valor_pago: number;
  }[];
}

const LIMIAR_MATERIAIS = 40; // 40% libera materiais
const LIMIAR_INSTALACAO = 60; // 60% libera instalação

function calcularStatusLiberacao(percentual: number): StatusFinanceiroPedido['statusLiberacao'] {
  if (percentual >= 100) return 'totalmente_pago';
  if (percentual >= LIMIAR_INSTALACAO) return 'instalacao_liberada';
  if (percentual >= LIMIAR_MATERIAIS) return 'materiais_liberados';
  return 'bloqueado';
}

export function usePedidoFinanceiro(pedidoId: string | null) {
  return useQuery({
    queryKey: ['pedido-financeiro', pedidoId],
    queryFn: async (): Promise<StatusFinanceiroPedido | null> => {
      if (!pedidoId) return null;

      // Buscar pedido com orçamento
      const { data: pedido, error: errPedido } = await supabase
        .from('pedidos')
        .select('orcamento_id, orcamento:orcamentos(id, total_geral, total_com_desconto)')
        .eq('id', pedidoId)
        .single();

      if (errPedido || !pedido) return null;

      const orcamentoId = pedido.orcamento_id;
      const orcamento = pedido.orcamento as { id: string; total_geral: number | null; total_com_desconto: number | null } | null;
      const valorTotal = Number(orcamento?.total_com_desconto ?? orcamento?.total_geral ?? 0);

      // Buscar contas a receber vinculadas ao orçamento
      const { data: contas, error: errContas } = await supabase
        .from('contas_receber')
        .select('id, status, valor_total, valor_pago')
        .eq('orcamento_id', orcamentoId);

      if (errContas) {
        console.error('Erro ao buscar contas do pedido:', errContas);
        return null;
      }

      const valorRecebido = (contas || []).reduce((acc, c) => acc + Number(c.valor_pago || 0), 0);
      const valorPendente = valorTotal - valorRecebido;
      const percentualPago = valorTotal > 0 ? (valorRecebido / valorTotal) * 100 : 0;
      const statusLiberacao = calcularStatusLiberacao(percentualPago);

      return {
        orcamentoId,
        valorTotal,
        valorRecebido,
        valorPendente,
        percentualPago,
        statusLiberacao,
        podeLiberarMateriais: percentualPago >= LIMIAR_MATERIAIS,
        podeLiberarInstalacao: percentualPago >= LIMIAR_INSTALACAO,
        contasReceber: contas || [],
      };
    },
    enabled: !!pedidoId,
  });
}

/**
 * Hook para buscar status financeiro de múltiplos pedidos de uma vez
 */
export function usePedidosFinanceiros(pedidoIds: string[]) {
  return useQuery({
    queryKey: ['pedidos-financeiros', pedidoIds],
    queryFn: async (): Promise<Record<string, StatusFinanceiroPedido>> => {
      if (!pedidoIds.length) return {};

      // Buscar pedidos com orçamentos
      const { data: pedidos, error: errPedidos } = await supabase
        .from('pedidos')
        .select('id, orcamento_id, orcamento:orcamentos(id, total_geral, total_com_desconto)')
        .in('id', pedidoIds);

      if (errPedidos || !pedidos) return {};

      // Buscar todas as contas a receber dos orçamentos
      const orcamentoIds = pedidos
        .map(p => p.orcamento_id)
        .filter((id): id is string => !!id);

      const { data: contas, error: errContas } = await supabase
        .from('contas_receber')
        .select('id, orcamento_id, status, valor_total, valor_pago')
        .in('orcamento_id', orcamentoIds);

      if (errContas) {
        console.error('Erro ao buscar contas:', errContas);
      }

      // Mapear contas por orçamento
      const contasPorOrcamento: Record<string, typeof contas> = {};
      (contas || []).forEach(conta => {
        if (conta.orcamento_id) {
          if (!contasPorOrcamento[conta.orcamento_id]) {
            contasPorOrcamento[conta.orcamento_id] = [];
          }
          contasPorOrcamento[conta.orcamento_id]!.push(conta);
        }
      });

      // Calcular status para cada pedido
      const result: Record<string, StatusFinanceiroPedido> = {};

      pedidos.forEach(pedido => {
        const orcamento = pedido.orcamento as { id: string; total_geral: number | null; total_com_desconto: number | null } | null;
        const valorTotal = Number(orcamento?.total_com_desconto ?? orcamento?.total_geral ?? 0);
        const contasDoOrcamento = contasPorOrcamento[pedido.orcamento_id || ''] || [];
        const valorRecebido = contasDoOrcamento.reduce((acc, c) => acc + Number(c.valor_pago || 0), 0);
        const valorPendente = valorTotal - valorRecebido;
        const percentualPago = valorTotal > 0 ? (valorRecebido / valorTotal) * 100 : 0;
        const statusLiberacao = calcularStatusLiberacao(percentualPago);

        result[pedido.id] = {
          orcamentoId: pedido.orcamento_id,
          valorTotal,
          valorRecebido,
          valorPendente,
          percentualPago,
          statusLiberacao,
          podeLiberarMateriais: percentualPago >= LIMIAR_MATERIAIS,
          podeLiberarInstalacao: percentualPago >= LIMIAR_INSTALACAO,
          contasReceber: contasDoOrcamento,
        };
      });

      return result;
    },
    enabled: pedidoIds.length > 0,
    staleTime: 30000, // 30 segundos
  });
}

/**
 * Labels e cores para status de liberação
 */
export const STATUS_LIBERACAO_LABELS: Record<StatusFinanceiroPedido['statusLiberacao'], { label: string; color: string; bgColor: string }> = {
  bloqueado: { 
    label: 'Aguardando Pagamento', 
    color: 'text-red-600', 
    bgColor: 'bg-red-100 dark:bg-red-900/30' 
  },
  materiais_liberados: { 
    label: 'Materiais Liberados', 
    color: 'text-yellow-600', 
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' 
  },
  instalacao_liberada: { 
    label: 'Instalação Liberada', 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100 dark:bg-blue-900/30' 
  },
  totalmente_pago: { 
    label: 'Totalmente Pago', 
    color: 'text-green-600', 
    bgColor: 'bg-green-100 dark:bg-green-900/30' 
  },
};
