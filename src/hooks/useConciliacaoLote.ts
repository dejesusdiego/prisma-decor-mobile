import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useFinanceiroInvalidation } from './useFinanceiroInvalidation';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

export interface MatchParaConciliar {
  movimentacaoId: string;
  movimentacaoDescricao: string;
  movimentacaoValor: number;
  movimentacaoData: string;
  parcelaId?: string;
  parcelaNumero?: number;
  parcelaValor?: number;
  contaReceberId?: string;
  clienteNome: string;
  orcamentoCodigo?: string;
  score: number;
  confianca: 'alta' | 'media' | 'baixa';
  selecionado?: boolean;
}

export interface ResultadoConciliacaoLote {
  processados: number;
  sucesso: number;
  erros: number;
  detalhes: { movimentacaoId: string; sucesso: boolean; erro?: string }[];
}

export function useConciliacaoLote() {
  const { user } = useAuth();
  const { organizationId } = useOrganizationContext();
  const queryClient = useQueryClient();
  const { invalidateAfterRecebimento } = useFinanceiroInvalidation();

  const conciliarLoteMutation = useMutation({
    mutationFn: async (matches: MatchParaConciliar[]): Promise<ResultadoConciliacaoLote> => {
      if (!user) throw new Error('Usuário não autenticado');
      if (!organizationId) throw new Error('Organização não identificada');
      
      const resultado: ResultadoConciliacaoLote = {
        processados: matches.length,
        sucesso: 0,
        erros: 0,
        detalhes: []
      };

      for (const match of matches) {
        try {
          // 1. Criar lançamento financeiro - com organization_id
          const { data: lancamento, error: lancamentoError } = await supabase
            .from('lancamentos_financeiros')
            .insert({
              descricao: `Recebimento: ${match.clienteNome}${match.parcelaNumero ? ` - Parcela ${match.parcelaNumero}` : ''}`,
              valor: match.movimentacaoValor,
              data_lancamento: match.movimentacaoData,
              tipo: 'entrada',
              parcela_receber_id: match.parcelaId,
              created_by_user_id: user.id,
              organization_id: organizationId
            })
            .select('id')
            .single();

          if (lancamentoError) throw lancamentoError;

          // 2. Vincular movimentação ao lançamento
          const { error: movError } = await supabase
            .from('movimentacoes_extrato')
            .update({ lancamento_id: lancamento.id, conciliado: true })
            .eq('id', match.movimentacaoId);

          if (movError) throw movError;

          // 3. Atualizar parcela como paga
          if (match.parcelaId) {
            const { error: parcelaError } = await supabase
              .from('parcelas_receber')
              .update({ 
                status: 'pago', 
                data_pagamento: match.movimentacaoData 
              })
              .eq('id', match.parcelaId);

            if (parcelaError) throw parcelaError;
          }

          // 4. Atualizar conta_receber
          if (match.contaReceberId) {
            const { data: contaAtual } = await supabase
              .from('contas_receber')
              .select('valor_pago, valor_total')
              .eq('id', match.contaReceberId)
              .single();

            if (contaAtual) {
              const novoValorPago = (contaAtual.valor_pago || 0) + match.movimentacaoValor;
              await supabase
                .from('contas_receber')
                .update({
                  valor_pago: novoValorPago,
                  status: novoValorPago >= contaAtual.valor_total ? 'pago' : 'parcial'
                })
                .eq('id', match.contaReceberId);
            }
          }

          resultado.sucesso++;
          resultado.detalhes.push({ movimentacaoId: match.movimentacaoId, sucesso: true });
        } catch (error: any) {
          resultado.erros++;
          resultado.detalhes.push({ 
            movimentacaoId: match.movimentacaoId, 
            sucesso: false, 
            erro: error.message 
          });
        }
      }

      return resultado;
    },
    onSuccess: (resultado) => {
      if (resultado.sucesso > 0) {
        toast.success(`${resultado.sucesso} conciliação(ões) realizada(s) com sucesso`);
      }
      if (resultado.erros > 0) {
        toast.error(`${resultado.erros} erro(s) durante a conciliação`);
      }
      
      // Invalidar todas as queries relevantes
      invalidateAfterRecebimento();
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-extrato'] });
      queryClient.invalidateQueries({ queryKey: ['parcelas-para-conciliacao'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao processar conciliação em lote: ' + error.message);
    }
  });

  return {
    conciliarLote: conciliarLoteMutation.mutate,
    isProcessando: conciliarLoteMutation.isPending,
    resultado: conciliarLoteMutation.data
  };
}
