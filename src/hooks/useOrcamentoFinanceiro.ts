import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  calcularRentabilidade, 
  gerarContaReceberOrcamento,
  gerarContasPagarOrcamento,
  verificarPendenciasFinanceiras,
  buscarDadosFinanceirosOrcamento,
  type OrcamentoBase,
  type RentabilidadeOrcamento,
  type PendenciasFinanceiras
} from '@/lib/integracaoOrcamentoFinanceiro';
import { getValorEfetivo } from '@/lib/calculosStatus';
import { toast } from '@/hooks/use-toast';

interface OrcamentoCompleto extends OrcamentoBase {
  endereco: string;
  cidade: string | null;
  observacoes: string | null;
  margem_percent: number;
  margem_tipo: string;
  created_at: string;
  updated_at: string;
  desconto_tipo: string | null;
  desconto_valor: number | null;
  subtotal_materiais: number | null;
  subtotal_mao_obra_costura: number | null;
  subtotal_instalacao: number | null;
}

interface ContaReceberComParcelas {
  id: string;
  orcamento_id: string | null;
  cliente_nome: string;
  valor_total: number;
  valor_pago: number;
  numero_parcelas: number;
  data_vencimento: string;
  status: string;
  parcelas_receber: Array<{
    id: string;
    numero_parcela: number;
    valor: number;
    data_vencimento: string;
    data_pagamento: string | null;
    status: string;
  }>;
}

export function useOrcamentoFinanceiro(orcamentoId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query principal: dados do orçamento
  const { 
    data: orcamento, 
    isLoading: isLoadingOrcamento,
    error: errorOrcamento 
  } = useQuery({
    queryKey: ['orcamento-financeiro', orcamentoId],
    queryFn: async () => {
      if (!orcamentoId) return null;

      const { data, error } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('id', orcamentoId)
        .single();

      if (error) throw error;
      return data as OrcamentoCompleto;
    },
    enabled: !!orcamentoId
  });

  // Query: dados financeiros do orçamento
  const { 
    data: dadosFinanceiros, 
    isLoading: isLoadingFinanceiro,
    refetch: refetchFinanceiro
  } = useQuery({
    queryKey: ['orcamento-dados-financeiros', orcamentoId],
    queryFn: async () => {
      if (!orcamentoId) return null;
      return buscarDadosFinanceirosOrcamento(orcamentoId);
    },
    enabled: !!orcamentoId
  });

  // Query: pendências financeiras
  const { 
    data: pendencias, 
    isLoading: isLoadingPendencias 
  } = useQuery({
    queryKey: ['orcamento-pendencias', orcamentoId],
    queryFn: async () => {
      if (!orcamentoId) return null;
      return verificarPendenciasFinanceiras(orcamentoId);
    },
    enabled: !!orcamentoId
  });

  // Mutation: gerar conta a receber
  const gerarContaReceberMutation = useMutation({
    mutationFn: async ({ 
      numeroParcelas, 
      dataPrimeiraParcela,
      formaPagamentoId,
      observacoes
    }: { 
      numeroParcelas: number; 
      dataPrimeiraParcela: Date;
      formaPagamentoId?: string;
      observacoes?: string;
    }) => {
      if (!orcamento || !user?.id) throw new Error('Dados insuficientes');

      return gerarContaReceberOrcamento(
        orcamento,
        numeroParcelas,
        dataPrimeiraParcela,
        user.id,
        formaPagamentoId,
        observacoes
      );
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({ title: 'Conta a receber criada', description: 'Parcelas geradas com sucesso!' });
        queryClient.invalidateQueries({ queryKey: ['orcamento-dados-financeiros', orcamentoId] });
        queryClient.invalidateQueries({ queryKey: ['orcamento-pendencias', orcamentoId] });
        queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      } else {
        toast({ title: 'Erro', description: result.error, variant: 'destructive' });
      }
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  // Mutation: gerar contas a pagar
  const gerarContasPagarMutation = useMutation({
    mutationFn: async ({ 
      custos, 
      dataVencimento 
    }: { 
      custos: { descricao: string; valor: number; categoriaId?: string; fornecedor?: string }[]; 
      dataVencimento: Date;
    }) => {
      if (!orcamentoId || !user?.id) throw new Error('Dados insuficientes');

      return gerarContasPagarOrcamento(orcamentoId, custos, dataVencimento, user.id);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({ title: 'Custos registrados', description: 'Contas a pagar criadas com sucesso!' });
        queryClient.invalidateQueries({ queryKey: ['orcamento-dados-financeiros', orcamentoId] });
        queryClient.invalidateQueries({ queryKey: ['orcamento-pendencias', orcamentoId] });
        queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      } else {
        toast({ title: 'Erro', description: result.error, variant: 'destructive' });
      }
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  // Calcular rentabilidade
  const rentabilidade: RentabilidadeOrcamento | null = orcamento && dadosFinanceiros 
    ? calcularRentabilidade(
        orcamento,
        dadosFinanceiros.contasReceber || [],
        dadosFinanceiros.contasPagar || [],
        dadosFinanceiros.comissoes || []
      )
    : null;

  // Valores calculados
  const valorEfetivo = orcamento 
    ? getValorEfetivo({ 
        total_geral: orcamento.total_geral || 0, 
        total_com_desconto: orcamento.total_com_desconto 
      }) 
    : 0;

  const valorRecebido = rentabilidade?.valorRecebido || 0;
  const valorPendente = rentabilidade?.valorPendente || 0;
  const custoTotal = rentabilidade?.custoTotal || 0;
  const lucroProjetado = rentabilidade?.lucroProjetado || 0;
  const margemLucro = rentabilidade?.margemLucro || 0;

  // Verificar se já tem conta a receber
  const temContaReceber = (dadosFinanceiros?.contasReceber?.length || 0) > 0;
  const temContasPagar = (dadosFinanceiros?.contasPagar?.length || 0) > 0;

  return {
    // Dados
    orcamento,
    contasReceber: dadosFinanceiros?.contasReceber || [],
    contasPagar: dadosFinanceiros?.contasPagar || [],
    comissoes: dadosFinanceiros?.comissoes || [],
    pendencias,
    rentabilidade,

    // Valores calculados
    valorEfetivo,
    valorRecebido,
    valorPendente,
    custoTotal,
    lucroProjetado,
    margemLucro,

    // Status
    temContaReceber,
    temContasPagar,
    isLoading: isLoadingOrcamento || isLoadingFinanceiro || isLoadingPendencias,
    error: errorOrcamento,

    // Ações
    gerarContaReceber: gerarContaReceberMutation.mutate,
    gerarContasPagar: gerarContasPagarMutation.mutate,
    isGerandoContaReceber: gerarContaReceberMutation.isPending,
    isGerandoContasPagar: gerarContasPagarMutation.isPending,
    refetch: refetchFinanceiro
  };
}
