import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Hook centralizado para invalidação de queries financeiras.
 * Garante que todas as telas sejam atualizadas quando dados financeiros mudam.
 */
export function useFinanceiroInvalidation() {
  const queryClient = useQueryClient();

  /**
   * Invalida queries relacionadas a recebimentos
   */
  const invalidateRecebimentos = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
    queryClient.invalidateQueries({ queryKey: ['parcelas-receber'] });
    queryClient.invalidateQueries({ queryKey: ['parcelas-receber-previsao'] });
    queryClient.invalidateQueries({ queryKey: ['contas-receber-pendentes'] });
  }, [queryClient]);

  /**
   * Invalida queries relacionadas a pagamentos
   */
  const invalidatePagamentos = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
    queryClient.invalidateQueries({ queryKey: ['contas-pagar-pendentes'] });
    queryClient.invalidateQueries({ queryKey: ['contas-pagar-previsao'] });
    queryClient.invalidateQueries({ queryKey: ['contas-recorrentes-previsao'] });
  }, [queryClient]);

  /**
   * Invalida queries relacionadas a lançamentos
   */
  const invalidateLancamentos = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
    queryClient.invalidateQueries({ queryKey: ['lancamentos-financeiros'] });
    queryClient.invalidateQueries({ queryKey: ['lancamentos-relatorio'] });
  }, [queryClient]);

  /**
   * Invalida queries relacionadas a saldo e fluxo de caixa
   */
  const invalidateFluxoCaixa = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['saldo-atual-caixa'] });
    queryClient.invalidateQueries({ queryKey: ['fluxo-caixa'] });
  }, [queryClient]);

  /**
   * Invalida queries relacionadas a conciliação bancária
   */
  const invalidateConciliacao = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['movimentacoes-extrato'] });
    queryClient.invalidateQueries({ queryKey: ['extratos-bancarios'] });
  }, [queryClient]);

  /**
   * Invalida queries relacionadas a comissões
   */
  const invalidateComissoes = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['comissoes'] });
  }, [queryClient]);

  /**
   * Invalidação completa após registrar um recebimento
   * Atualiza: Contas a Receber, Lançamentos, Fluxo de Caixa, Conciliação
   */
  const invalidateAfterRecebimento = useCallback(() => {
    invalidateRecebimentos();
    invalidateLancamentos();
    invalidateFluxoCaixa();
    invalidateConciliacao();
  }, [invalidateRecebimentos, invalidateLancamentos, invalidateFluxoCaixa, invalidateConciliacao]);

  /**
   * Invalidação completa após registrar um pagamento de conta
   * Atualiza: Contas a Pagar, Lançamentos, Fluxo de Caixa
   */
  const invalidateAfterPagamento = useCallback(() => {
    invalidatePagamentos();
    invalidateLancamentos();
    invalidateFluxoCaixa();
  }, [invalidatePagamentos, invalidateLancamentos, invalidateFluxoCaixa]);

  /**
   * Invalidação completa após criar/editar lançamento manual
   * Atualiza: Lançamentos, Fluxo de Caixa, Conciliação
   */
  const invalidateAfterLancamento = useCallback(() => {
    invalidateLancamentos();
    invalidateFluxoCaixa();
    invalidateConciliacao();
    invalidateRecebimentos();
    invalidatePagamentos();
  }, [invalidateLancamentos, invalidateFluxoCaixa, invalidateConciliacao, invalidateRecebimentos, invalidatePagamentos]);

  /**
   * Invalidação total de todos os dados financeiros
   */
  const invalidateAll = useCallback(() => {
    invalidateRecebimentos();
    invalidatePagamentos();
    invalidateLancamentos();
    invalidateFluxoCaixa();
    invalidateConciliacao();
    invalidateComissoes();
  }, [invalidateRecebimentos, invalidatePagamentos, invalidateLancamentos, invalidateFluxoCaixa, invalidateConciliacao, invalidateComissoes]);

  return {
    // Invalidações específicas
    invalidateRecebimentos,
    invalidatePagamentos,
    invalidateLancamentos,
    invalidateFluxoCaixa,
    invalidateConciliacao,
    invalidateComissoes,
    // Invalidações compostas (após ações)
    invalidateAfterRecebimento,
    invalidateAfterPagamento,
    invalidateAfterLancamento,
    invalidateAll,
  };
}
