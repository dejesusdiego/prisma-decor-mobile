import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HistoricoProducaoItem {
  id: string;
  pedido_id: string;
  item_pedido_id: string | null;
  tipo_evento: string;
  status_anterior: string | null;
  status_novo: string | null;
  descricao: string;
  data_evento: string;
  usuario_nome: string;
  pedido?: {
    numero_pedido: string;
  };
}

export function useHistoricoProducaoByContato(pedidoIds: string[]) {
  return useQuery({
    queryKey: ['historico-producao-contato', pedidoIds],
    queryFn: async () => {
      if (!pedidoIds || pedidoIds.length === 0) return [];

      const { data, error } = await supabase
        .from('historico_producao')
        .select(`
          *,
          pedido:pedidos(numero_pedido)
        `)
        .in('pedido_id', pedidoIds)
        .order('data_evento', { ascending: false });

      if (error) throw error;

      return (data || []) as HistoricoProducaoItem[];
    },
    enabled: pedidoIds.length > 0
  });
}
