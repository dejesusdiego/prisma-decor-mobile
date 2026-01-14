/**
 * Hook para buscar orçamentos com paginação
 * Otimizado para performance com carregamento sob demanda
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

const PAGE_SIZE = 50; // Tamanho da página

interface UseOrcamentosPaginadosOptions {
  /** Filtro por status */
  status?: string;
  /** Filtro por nome do cliente */
  nomeCliente?: string;
  /** Habilitar query */
  enabled?: boolean;
}

export function useOrcamentosPaginados(options: UseOrcamentosPaginadosOptions = {}) {
  const { organizationId } = useOrganizationContext();
  const { status, nomeCliente, enabled = true } = options;

  return useInfiniteQuery({
    queryKey: ['orcamentos-paginados', organizationId, status, nomeCliente],
    queryFn: async ({ pageParam = 0 }) => {
      if (!organizationId) return { data: [], nextPage: null };

      // Campos otimizados - apenas o necessário
      let query = supabase
        .from('orcamentos')
        .select('id, codigo, cliente_nome, cliente_telefone, endereco, cidade, status, total_geral, total_com_desconto, created_at, updated_at, validade_dias, custo_total, margem_percent', { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      // Aplicar filtros
      if (status && status !== 'todos') {
        query = query.eq('status', status);
      }

      if (nomeCliente) {
        query = query.ilike('cliente_nome', `%${nomeCliente}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const hasMore = count ? (pageParam + 1) * PAGE_SIZE < count : false;

      return {
        data: data || [],
        nextPage: hasMore ? pageParam + 1 : null,
        total: count || 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: enabled && !!organizationId,
    staleTime: 1 * 60 * 1000, // Cache por 1 minuto
    gcTime: 5 * 60 * 1000, // Manter em cache por 5 minutos
  });
}
