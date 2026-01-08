import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { differenceInDays, parseISO } from 'date-fns';

export interface ResumoConciliacao {
  ultimaImportacao: Date | null;
  diasDesdeUltimaImportacao: number;
  extratoDesatualizado: boolean;
  saldoExtratoImportado: number;
  saldoSistemaConciliado: number;
  diferencaSaldo: number;
  movimentacoesPendentes: number;
  valorPendenteTotal: number;
  movimentacoesCriticas: number; // valor > R$ 500
  valorCriticoTotal: number;
}

export function useResumoConciliacao() {
  const { user } = useAuth();
  const { organizationId } = useOrganizationContext();

  return useQuery({
    queryKey: ['resumo-conciliacao', organizationId],
    queryFn: async (): Promise<ResumoConciliacao> => {
      if (!organizationId) {
        return {
          ultimaImportacao: null,
          diasDesdeUltimaImportacao: 999,
          extratoDesatualizado: true,
          saldoExtratoImportado: 0,
          saldoSistemaConciliado: 0,
          diferencaSaldo: 0,
          movimentacoesPendentes: 0,
          valorPendenteTotal: 0,
          movimentacoesCriticas: 0,
          valorCriticoTotal: 0
        };
      }

      // Buscar última importação de extrato (a tabela não tem organization_id, então filtramos por user)
      const { data: ultimoExtrato } = await supabase
        .from('extratos_bancarios')
        .select('id, created_at, data_fim')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Buscar movimentações do extrato
      const { data: movimentacoes } = await supabase
        .from('movimentacoes_extrato')
        .select('id, valor, tipo, conciliado, ignorado');

      const todasMovimentacoes = movimentacoes || [];

      // Calcular saldo do extrato importado (soma de todas as movimentações)
      const saldoExtratoImportado = todasMovimentacoes.reduce((acc, mov) => {
        const valor = mov.tipo === 'credito' ? mov.valor : -mov.valor;
        return acc + valor;
      }, 0);

      // Calcular saldo conciliado (apenas movimentações vinculadas a lançamentos)
      const saldoSistemaConciliado = todasMovimentacoes
        .filter(m => m.conciliado)
        .reduce((acc, mov) => {
          const valor = mov.tipo === 'credito' ? mov.valor : -mov.valor;
          return acc + valor;
        }, 0);

      // Movimentações pendentes (não conciliadas e não ignoradas)
      const pendentes = todasMovimentacoes.filter(m => !m.conciliado && !m.ignorado);
      const movimentacoesPendentes = pendentes.length;
      const valorPendenteTotal = pendentes.reduce((acc, m) => acc + Math.abs(m.valor), 0);

      // Movimentações críticas (valor > R$ 500)
      const criticas = pendentes.filter(m => Math.abs(m.valor) >= 500);
      const movimentacoesCriticas = criticas.length;
      const valorCriticoTotal = criticas.reduce((acc, m) => acc + Math.abs(m.valor), 0);

      // Calcular dias desde última importação
      const ultimaImportacao = ultimoExtrato?.created_at 
        ? parseISO(ultimoExtrato.created_at) 
        : null;
      
      const diasDesdeUltimaImportacao = ultimaImportacao 
        ? differenceInDays(new Date(), ultimaImportacao) 
        : 999;

      const extratoDesatualizado = diasDesdeUltimaImportacao > 3;

      return {
        ultimaImportacao,
        diasDesdeUltimaImportacao,
        extratoDesatualizado,
        saldoExtratoImportado,
        saldoSistemaConciliado,
        diferencaSaldo: saldoExtratoImportado - saldoSistemaConciliado,
        movimentacoesPendentes,
        valorPendenteTotal,
        movimentacoesCriticas,
        valorCriticoTotal
      };
    },
    enabled: !!user && !!organizationId,
    refetchInterval: 60000 // Atualizar a cada 1 minuto
  });
}
