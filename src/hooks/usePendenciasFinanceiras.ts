import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface PendenciasFinanceiras {
  lancamentosOrfaos: number;
  valorLancamentosOrfaos: number;
  parcelasAtrasadas: number;
  valorParcelasAtrasadas: number;
  contasPagarAtrasadas: number;
  valorContasPagarAtrasadas: number;
  orcamentosSemConciliacao: number;
  totalPendencias: number;
}

export function usePendenciasFinanceiras() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pendencias-financeiras'],
    queryFn: async (): Promise<PendenciasFinanceiras> => {
      // Lançamentos órfãos (entradas sem vínculo)
      const { data: orfaos, error: erroOrfaos } = await supabase
        .from('lancamentos_financeiros')
        .select('id, valor')
        .is('parcela_receber_id', null)
        .is('conta_pagar_id', null)
        .eq('tipo', 'entrada');

      if (erroOrfaos) throw erroOrfaos;

      // Parcelas a receber atrasadas
      const { data: parcelasAtrasadas, error: erroParcelasAtrasadas } = await supabase
        .from('parcelas_receber')
        .select('id, valor')
        .eq('status', 'atrasado');

      if (erroParcelasAtrasadas) throw erroParcelasAtrasadas;

      // Contas a pagar atrasadas
      const { data: contasPagarAtrasadas, error: erroContasPagarAtrasadas } = await supabase
        .from('contas_pagar')
        .select('id, valor')
        .eq('status', 'atrasado');

      if (erroContasPagarAtrasadas) throw erroContasPagarAtrasadas;

      // Orçamentos pagos sem conta a receber conciliada
      const { data: orcamentosSemConciliacao, error: erroOrcamentosSemConciliacao } = await supabase
        .from('orcamentos')
        .select(`
          id,
          contas_receber!left(id, valor_pago, valor_total)
        `)
        .in('status', ['pago_40', 'pago_parcial', 'pago_60', 'pago']);

      if (erroOrcamentosSemConciliacao) throw erroOrcamentosSemConciliacao;

      // Contar orçamentos que têm pagamento esperado mas sem recebimentos vinculados
      const orcamentosPendentes = (orcamentosSemConciliacao || []).filter(orc => {
        const contas = orc.contas_receber as any[];
        if (!contas || contas.length === 0) return true;
        return contas.some(c => c.valor_pago === 0);
      });

      const lancamentosOrfaosData = orfaos || [];
      const parcelasAtrasadasData = parcelasAtrasadas || [];
      const contasPagarAtrasadasData = contasPagarAtrasadas || [];

      const pendencias: PendenciasFinanceiras = {
        lancamentosOrfaos: lancamentosOrfaosData.length,
        valorLancamentosOrfaos: lancamentosOrfaosData.reduce((acc, l) => acc + l.valor, 0),
        parcelasAtrasadas: parcelasAtrasadasData.length,
        valorParcelasAtrasadas: parcelasAtrasadasData.reduce((acc, p) => acc + p.valor, 0),
        contasPagarAtrasadas: contasPagarAtrasadasData.length,
        valorContasPagarAtrasadas: contasPagarAtrasadasData.reduce((acc, c) => acc + c.valor, 0),
        orcamentosSemConciliacao: orcamentosPendentes.length,
        totalPendencias: 
          lancamentosOrfaosData.length + 
          parcelasAtrasadasData.length + 
          contasPagarAtrasadasData.length +
          orcamentosPendentes.length
      };

      return pendencias;
    },
    enabled: !!user,
    refetchInterval: 60000 // Atualizar a cada minuto
  });
}
