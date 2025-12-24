import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Notificacao {
  id: string;
  user_id: string;
  tipo: 'follow_up' | 'conta_vencer' | 'pedido_pronto' | 'visita_nova' | 'orcamento_vencendo' | 'pagamento_atrasado';
  titulo: string;
  mensagem: string;
  lida: boolean;
  data_lembrete: string | null;
  link_acao: string | null;
  referencia_tipo: string | null;
  referencia_id: string | null;
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  created_at: string;
  expires_at: string | null;
}

export function useNotificacoes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notificacoes = [], isLoading, refetch } = useQuery({
    queryKey: ['notificacoes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return (data || []) as Notificacao[];
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Refetch a cada 1 minuto
  });

  const naoLidas = notificacoes.filter(n => !n.lida);
  const countNaoLidas = naoLidas.length;

  const marcarComoLida = useMutation({
    mutationFn: async (notificacaoId: string) => {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', notificacaoId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
    }
  });

  const marcarTodasComoLidas = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('user_id', user.id)
        .eq('lida', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
    }
  });

  const deletarNotificacao = useMutation({
    mutationFn: async (notificacaoId: string) => {
      const { error } = await supabase
        .from('notificacoes')
        .delete()
        .eq('id', notificacaoId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
    }
  });

  return {
    notificacoes,
    naoLidas,
    countNaoLidas,
    isLoading,
    refetch,
    marcarComoLida: marcarComoLida.mutate,
    marcarTodasComoLidas: marcarTodasComoLidas.mutate,
    deletarNotificacao: deletarNotificacao.mutate,
    isUpdating: marcarComoLida.isPending || marcarTodasComoLidas.isPending || deletarNotificacao.isPending
  };
}
