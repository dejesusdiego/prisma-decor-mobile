import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

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
  const { organizationId } = useOrganizationContext();

  return useQuery({
    queryKey: ['pendencias-financeiras', organizationId],
    queryFn: async (): Promise<PendenciasFinanceiras> => {
      if (!organizationId) {
        return {
          lancamentosOrfaos: 0,
          valorLancamentosOrfaos: 0,
          parcelasAtrasadas: 0,
          valorParcelasAtrasadas: 0,
          contasPagarAtrasadas: 0,
          valorContasPagarAtrasadas: 0,
          orcamentosSemConciliacao: 0,
          totalPendencias: 0
        };
      }

      // Lançamentos órfãos (entradas sem vínculo) - filtrado por organização
      const { data: orfaos, error: erroOrfaos } = await supabase
        .from('lancamentos_financeiros')
        .select('id, valor')
        .eq('organization_id', organizationId)
        .is('parcela_receber_id', null)
        .is('conta_pagar_id', null)
        .eq('tipo', 'entrada');

      if (erroOrfaos) throw erroOrfaos;

      // Parcelas a receber atrasadas - via join com contas_receber filtrada por org
      const { data: contasReceberAtrasadas, error: erroContasReceber } = await supabase
        .from('contas_receber')
        .select('id, parcelas_receber!inner(id, valor)')
        .eq('organization_id', organizationId);

      // Filtrar parcelas atrasadas manualmente (parcelas_receber não tem organization_id direto)
      const { data: parcelasAtrasadas, error: erroParcelasAtrasadas } = await supabase
        .from('parcelas_receber')
        .select('id, valor, conta_receber:contas_receber!inner(organization_id)')
        .eq('status', 'atrasado')
        .eq('conta_receber.organization_id', organizationId);

      if (erroParcelasAtrasadas) throw erroParcelasAtrasadas;

      // Contas a pagar atrasadas - filtrado por organização
      const { data: contasPagarAtrasadas, error: erroContasPagarAtrasadas } = await supabase
        .from('contas_pagar')
        .select('id, valor')
        .eq('organization_id', organizationId)
        .eq('status', 'atrasado');

      if (erroContasPagarAtrasadas) throw erroContasPagarAtrasadas;

      // Orçamentos pagos sem conta a receber conciliada - filtrado por organização
      const { data: orcamentosSemConciliacao, error: erroOrcamentosSemConciliacao } = await supabase
        .from('orcamentos')
        .select(`
          id,
          contas_receber!left(id, valor_pago, valor_total)
        `)
        .eq('organization_id', organizationId)
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
    enabled: !!organizationId,
    refetchInterval: 60000 // Atualizar a cada minuto
  });
}
