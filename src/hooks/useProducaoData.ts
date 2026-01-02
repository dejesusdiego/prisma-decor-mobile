import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Pedido {
  id: string;
  orcamento_id: string;
  numero_pedido: string;
  status_producao: 'aguardando_materiais' | 'em_producao' | 'qualidade' | 'pronto' | 'entregue' | 'cancelado';
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  data_entrada: string;
  previsao_entrega: string | null;
  data_pronto: string | null;
  observacoes_producao: string | null;
  created_at: string;
  created_by_user_id: string;
  // Joined data
  orcamento?: {
    codigo: string;
    cliente_nome: string;
    cliente_telefone: string;
    endereco: string;
    cidade: string;
    total_com_desconto: number | null;
    total_geral: number | null;
  };
  itens_pedido?: ItemPedido[];
  instalacoes?: Instalacao[];
}

export interface ItemPedido {
  id: string;
  pedido_id: string;
  cortina_item_id: string;
  status_item: 'fila' | 'corte' | 'costura' | 'acabamento' | 'qualidade' | 'pronto';
  responsavel: string | null;
  data_inicio_corte: string | null;
  data_fim_corte: string | null;
  data_inicio_costura: string | null;
  data_fim_costura: string | null;
  data_finalizacao: string | null;
  observacoes: string | null;
  created_at: string;
  // Joined data
  cortina_item?: {
    nome_identificacao: string;
    tipo_cortina: string;
    tipo_produto: string;
    largura: number;
    altura: number;
    quantidade: number;
    ambiente: string | null;
    preco_venda: number | null;
  };
}

export interface HistoricoProducao {
  id: string;
  pedido_id: string;
  item_pedido_id: string | null;
  tipo_evento: string;
  status_anterior: string | null;
  status_novo: string | null;
  descricao: string;
  data_evento: string;
  usuario_id: string;
  usuario_nome: string;
}

export interface InstalacaoPedidoInfo {
  numero_pedido: string;
  orcamento?: {
    codigo: string;
    cliente_nome: string;
    cliente_telefone: string;
  };
}

export interface Instalacao {
  id: string;
  pedido_id: string;
  data_agendada: string;
  turno: 'manha' | 'tarde' | 'dia_todo';
  instalador: string | null;
  status: 'agendada' | 'confirmada' | 'em_andamento' | 'concluida' | 'reagendada' | 'cancelada';
  endereco: string;
  cidade: string | null;
  observacoes: string | null;
  data_realizada: string | null;
  created_at: string;
  created_by_user_id: string;
  // Joined - partial pedido info
  pedido?: InstalacaoPedidoInfo;
}

export const STATUS_PRODUCAO_LABELS: Record<string, { label: string; color: string }> = {
  aguardando_materiais: { label: 'Aguardando Materiais', color: 'bg-yellow-500' },
  em_producao: { label: 'Em Produção', color: 'bg-blue-500' },
  qualidade: { label: 'Controle de Qualidade', color: 'bg-purple-500' },
  pronto: { label: 'Pronto', color: 'bg-green-500' },
  entregue: { label: 'Entregue', color: 'bg-emerald-600' },
  cancelado: { label: 'Cancelado', color: 'bg-destructive' },
};

export const STATUS_ITEM_LABELS: Record<string, { label: string; color: string }> = {
  fila: { label: 'Na Fila', color: 'bg-gray-500' },
  corte: { label: 'Corte', color: 'bg-orange-500' },
  costura: { label: 'Costura', color: 'bg-blue-500' },
  acabamento: { label: 'Acabamento', color: 'bg-indigo-500' },
  qualidade: { label: 'Qualidade', color: 'bg-purple-500' },
  pronto: { label: 'Pronto', color: 'bg-green-500' },
};

export const PRIORIDADE_LABELS: Record<string, { label: string; color: string }> = {
  baixa: { label: 'Baixa', color: 'bg-gray-400' },
  normal: { label: 'Normal', color: 'bg-blue-400' },
  alta: { label: 'Alta', color: 'bg-orange-500' },
  urgente: { label: 'Urgente', color: 'bg-red-500' },
};

export const TURNO_LABELS: Record<string, string> = {
  manha: 'Manhã (8h-12h)',
  tarde: 'Tarde (13h-17h)',
  dia_todo: 'Dia Todo',
};

export const STATUS_INSTALACAO_LABELS: Record<string, { label: string; color: string }> = {
  agendada: { label: 'Agendada', color: 'bg-blue-500' },
  confirmada: { label: 'Confirmada', color: 'bg-indigo-500' },
  em_andamento: { label: 'Em Andamento', color: 'bg-yellow-500' },
  concluida: { label: 'Concluída', color: 'bg-green-500' },
  reagendada: { label: 'Reagendada', color: 'bg-orange-500' },
  cancelada: { label: 'Cancelada', color: 'bg-destructive' },
};

export function useProducaoData() {
  const queryClient = useQueryClient();

  // Buscar todos os pedidos com dados do orçamento
  const { data: pedidos = [], isLoading: isLoadingPedidos, error: errorPedidos, refetch: refetchPedidos } = useQuery({
    queryKey: ['pedidos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          orcamento:orcamentos (
            codigo,
            cliente_nome,
            cliente_telefone,
            endereco,
            cidade,
            total_com_desconto,
            total_geral
          ),
          itens_pedido (
            *,
            cortina_item:cortina_items (
              nome_identificacao,
              tipo_cortina,
              tipo_produto,
              largura,
              altura,
              quantidade,
              ambiente,
              preco_venda
            )
          ),
          instalacoes (*)
        `)
        .order('data_entrada', { ascending: false });

      if (error) throw error;
      return data as Pedido[];
    },
  });

  // Buscar instalações
  const { data: instalacoes = [], isLoading: isLoadingInstalacoes, refetch: refetchInstalacoes } = useQuery({
    queryKey: ['instalacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instalacoes')
        .select(`
          *,
          pedido:pedidos (
            numero_pedido,
            orcamento:orcamentos (
              codigo,
              cliente_nome,
              cliente_telefone
            )
          )
        `)
        .order('data_agendada', { ascending: true });

      if (error) throw error;
      return data as Instalacao[];
    },
  });

  // Buscar histórico de um pedido específico
  const fetchHistorico = async (pedidoId: string): Promise<HistoricoProducao[]> => {
    const { data, error } = await supabase
      .from('historico_producao')
      .select('*')
      .eq('pedido_id', pedidoId)
      .order('data_evento', { ascending: false });

    if (error) throw error;
    return data as HistoricoProducao[];
  };

  // Mutation para atualizar status do item
  const atualizarStatusItemMutation = useMutation({
    mutationFn: async ({ itemId, novoStatus }: { itemId: string; novoStatus: string }) => {
      const { error } = await supabase
        .from('itens_pedido')
        .update({ status_item: novoStatus })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast.success('Status do item atualizado');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });

  // Mutation para atualizar responsável do item
  const atualizarResponsavelItemMutation = useMutation({
    mutationFn: async ({ itemId, responsavel }: { itemId: string; responsavel: string | null }) => {
      const { error } = await supabase
        .from('itens_pedido')
        .update({ responsavel })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast.success('Responsável atualizado');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar responsável: ' + error.message);
    },
  });

  // Mutation para atualizar status do pedido
  const atualizarStatusPedidoMutation = useMutation({
    mutationFn: async ({ pedidoId, novoStatus }: { pedidoId: string; novoStatus: string }) => {
      const { error } = await supabase
        .from('pedidos')
        .update({ status_producao: novoStatus })
        .eq('id', pedidoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast.success('Status do pedido atualizado');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });

  // Mutation para atualizar prioridade
  const atualizarPrioridadeMutation = useMutation({
    mutationFn: async ({ pedidoId, novaPrioridade }: { pedidoId: string; novaPrioridade: string }) => {
      const { error } = await supabase
        .from('pedidos')
        .update({ prioridade: novaPrioridade })
        .eq('id', pedidoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast.success('Prioridade atualizada');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar prioridade: ' + error.message);
    },
  });

  // Mutation para criar instalação
  const criarInstalacaoMutation = useMutation({
    mutationFn: async (instalacao: Omit<Instalacao, 'id' | 'created_at' | 'pedido'>) => {
      const { error } = await supabase
        .from('instalacoes')
        .insert([instalacao]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instalacoes'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast.success('Instalação agendada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao agendar instalação: ' + error.message);
    },
  });

  // Mutation para atualizar instalação
  const atualizarInstalacaoMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Instalacao> & { id: string }) => {
      const { error } = await supabase
        .from('instalacoes')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instalacoes'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast.success('Instalação atualizada');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar instalação: ' + error.message);
    },
  });

  // Métricas
  const metricas = {
    totalPedidos: pedidos.length,
    aguardandoMateriais: pedidos.filter(p => p.status_producao === 'aguardando_materiais').length,
    emProducao: pedidos.filter(p => p.status_producao === 'em_producao').length,
    qualidade: pedidos.filter(p => p.status_producao === 'qualidade').length,
    prontos: pedidos.filter(p => p.status_producao === 'pronto').length,
    entregues: pedidos.filter(p => p.status_producao === 'entregue').length,
    urgentes: pedidos.filter(p => p.prioridade === 'urgente' && p.status_producao !== 'entregue').length,
    instalacoesPendentes: instalacoes.filter(i => ['agendada', 'confirmada'].includes(i.status)).length,
  };

  return {
    pedidos,
    instalacoes,
    metricas,
    isLoading: isLoadingPedidos || isLoadingInstalacoes,
    error: errorPedidos,
    refetch: () => {
      refetchPedidos();
      refetchInstalacoes();
    },
    fetchHistorico,
    atualizarStatusItem: atualizarStatusItemMutation.mutate,
    atualizarResponsavelItem: atualizarResponsavelItemMutation.mutate,
    atualizarStatusPedido: atualizarStatusPedidoMutation.mutate,
    atualizarPrioridade: atualizarPrioridadeMutation.mutate,
    criarInstalacao: criarInstalacaoMutation.mutate,
    atualizarInstalacao: atualizarInstalacaoMutation.mutate,
    isUpdating: atualizarStatusItemMutation.isPending || atualizarStatusPedidoMutation.isPending || atualizarResponsavelItemMutation.isPending,
  };
}
