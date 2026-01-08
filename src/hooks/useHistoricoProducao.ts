import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';

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
    orcamento?: {
      organization_id: string | null;
    };
  };
}

export function useHistoricoProducaoByContato(pedidoIds: string[]) {
  const { organizationId } = useOrganization();
  
  return useQuery({
    queryKey: ['historico-producao-contato', pedidoIds, organizationId],
    queryFn: async () => {
      if (!pedidoIds || pedidoIds.length === 0) return [];

      const { data, error } = await supabase
        .from('historico_producao')
        .select(`
          *,
          pedido:pedidos(
            numero_pedido,
            orcamento:orcamentos(organization_id)
          )
        `)
        .in('pedido_id', pedidoIds)
        .order('data_evento', { ascending: false });

      if (error) throw error;

      // Filtrar por organization_id para garantir isolamento multi-tenant
      const filtered = (data || []).filter(h => {
        const orgId = (h.pedido as any)?.orcamento?.organization_id;
        return !organizationId || orgId === organizationId;
      });

      return filtered as HistoricoProducaoItem[];
    },
    enabled: pedidoIds.length > 0
  });
}
