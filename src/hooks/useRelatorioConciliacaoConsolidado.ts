import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { STATUS_CONCILIACAO_VALIDOS, STATUS_COM_PAGAMENTO, STATUS_TOTALMENTE_PAGO } from '@/lib/statusOrcamento';
import { useOrganization } from '@/hooks/useOrganization';

export interface OrcamentoConciliacaoResumo {
  id: string;
  codigo: string;
  clienteNome: string;
  status: string;
  valorTotal: number;
  valorRecebido: number;
  valorRecebidoConciliado: number;
  custoTotal: number;
  custosPagos: number;
  custosConciliados: number;
  statusConciliacao: 'completo' | 'parcial' | 'pendente';
  percentualRecebido: number;
  percentualConciliado: number;
  createdAt: string;
}

export interface RelatorioConsolidado {
  orcamentos: OrcamentoConciliacaoResumo[];
  totais: {
    valorOrcamentos: number;
    valorRecebido: number;
    valorRecebidoConciliado: number;
    custoTotal: number;
    custosPagos: number;
    custosConciliados: number;
    margemMedia: number;
  };
  estatisticas: {
    totalOrcamentos: number;
    completos: number;
    parciais: number;
    pendentes: number;
    percentualGeral: number;
  };
}

export type FiltroStatusPagamento = 'todos' | 'pagos' | 'totalmente_pago';

interface FiltrosRelatorio {
  periodo?: { inicio: Date; fim: Date };
  dataInicio?: string;
  status?: string[];
  apenasComPendencias?: boolean;
  incluirNaoEnviados?: boolean;
  filtroStatusPagamento?: FiltroStatusPagamento;
}

export function useRelatorioConciliacaoConsolidado(filtros?: FiltrosRelatorio) {
  const { organizationId } = useOrganization();
  
  return useQuery({
    queryKey: ['relatorio-conciliacao-consolidado', filtros, organizationId],
    queryFn: async (): Promise<RelatorioConsolidado> => {
      if (!organizationId) {
        return {
          orcamentos: [],
          totais: { valorOrcamentos: 0, valorRecebido: 0, valorRecebidoConciliado: 0, custoTotal: 0, custosPagos: 0, custosConciliados: 0, margemMedia: 0 },
          estatisticas: { totalOrcamentos: 0, completos: 0, parciais: 0, pendentes: 0, percentualGeral: 0 }
        };
      }
      
      // Buscar orçamentos com contas a receber e pagar
      let query = supabase
        .from('orcamentos')
        .select(`
          id, codigo, cliente_nome, status, total_geral, total_com_desconto, custo_total, created_at,
          contas_receber(
            id, valor_total, valor_pago, status,
            parcelas_receber(id, valor, status)
          ),
          contas_pagar(id, valor, status)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(100);

      // Determinar quais status filtrar
      let statusParaFiltrar: string[] = [];
      
      if (filtros?.filtroStatusPagamento === 'pagos') {
        statusParaFiltrar = [...STATUS_COM_PAGAMENTO];
      } else if (filtros?.filtroStatusPagamento === 'totalmente_pago') {
        statusParaFiltrar = [...STATUS_TOTALMENTE_PAGO];
      } else if (filtros?.status && filtros.status.length > 0) {
        statusParaFiltrar = filtros.status;
      } else if (!filtros?.incluirNaoEnviados) {
        statusParaFiltrar = [...STATUS_CONCILIACAO_VALIDOS];
      }
      
      if (statusParaFiltrar.length > 0) {
        query = query.in('status', statusParaFiltrar);
      }

      if (filtros?.periodo) {
        query = query
          .gte('created_at', filtros.periodo.inicio.toISOString())
          .lte('created_at', filtros.periodo.fim.toISOString());
      } else if (filtros?.dataInicio) {
        query = query.gte('created_at', filtros.dataInicio);
      }

      const { data: orcamentos } = await query;

      // Buscar lançamentos para verificar conciliação
      const { data: lancamentos } = await supabase
        .from('lancamentos_financeiros')
        .select('id, parcela_receber_id, conta_pagar_id');

      const { data: movimentacoes } = await supabase
        .from('movimentacoes_extrato')
        .select('lancamento_id')
        .eq('conciliado', true);

      const lancamentosConciliados = new Set(
        (movimentacoes || []).map(m => m.lancamento_id)
      );

      // Mapear parcelas e contas a pagar que estão conciliadas
      const parcelasConciliadas = new Set<string>();
      const contasPagarConciliadas = new Set<string>();

      for (const lanc of lancamentos || []) {
        if (lancamentosConciliados.has(lanc.id)) {
          if (lanc.parcela_receber_id) parcelasConciliadas.add(lanc.parcela_receber_id);
          if (lanc.conta_pagar_id) contasPagarConciliadas.add(lanc.conta_pagar_id);
        }
      }

      // Processar cada orçamento
      const orcamentosProcessados: OrcamentoConciliacaoResumo[] = [];
      
      let totalValorOrcamentos = 0;
      let totalValorRecebido = 0;
      let totalValorRecebidoConciliado = 0;
      let totalCustoTotal = 0;
      let totalCustosPagos = 0;
      let totalCustosConciliados = 0;

      for (const orc of orcamentos || []) {
        const valorTotal = orc.total_com_desconto ?? orc.total_geral ?? 0;
        const custoTotal = orc.custo_total ?? 0;

        // Processar contas a receber
        let valorRecebido = 0;
        let valorRecebidoConciliado = 0;
        
        for (const conta of (orc.contas_receber || []) as any[]) {
          valorRecebido += conta.valor_pago || 0;
          
          for (const parcela of (conta.parcelas_receber || []) as any[]) {
            if (parcela.status === 'pago' && parcelasConciliadas.has(parcela.id)) {
              valorRecebidoConciliado += Number(parcela.valor);
            }
          }
        }

        // Processar contas a pagar
        let custosPagos = 0;
        let custosConciliados = 0;

        for (const conta of (orc.contas_pagar || []) as any[]) {
          if (conta.status === 'pago') {
            custosPagos += Number(conta.valor);
            if (contasPagarConciliadas.has(conta.id)) {
              custosConciliados += Number(conta.valor);
            }
          }
        }

        // Determinar status de conciliação
        let statusConciliacao: 'completo' | 'parcial' | 'pendente' = 'pendente';
        const totalParcelas = (orc.contas_receber || []).reduce(
          (acc: number, c: any) => acc + ((c.parcelas_receber || []).length), 0
        );
        const totalContas = (orc.contas_pagar || []).length;

        if (totalParcelas === 0 && totalContas === 0) {
          statusConciliacao = 'pendente';
        } else {
          const parcelasOrc = (orc.contas_receber || []).flatMap((c: any) => c.parcelas_receber || []);
          const parcelasConciliadasOrc = parcelasOrc.filter((p: any) => parcelasConciliadas.has(p.id)).length;
          const contasConciliadasOrc = (orc.contas_pagar || []).filter((c: any) => contasPagarConciliadas.has(c.id)).length;

          if (parcelasConciliadasOrc === parcelasOrc.length && contasConciliadasOrc === (orc.contas_pagar || []).length) {
            if (parcelasOrc.length > 0 || (orc.contas_pagar || []).length > 0) {
              statusConciliacao = 'completo';
            }
          } else if (parcelasConciliadasOrc > 0 || contasConciliadasOrc > 0) {
            statusConciliacao = 'parcial';
          }
        }

        const percentualRecebido = valorTotal > 0 ? (valorRecebido / valorTotal) * 100 : 0;
        const percentualConciliado = valorRecebido > 0 ? (valorRecebidoConciliado / valorRecebido) * 100 : 0;

        // Filtrar se necessário
        if (filtros?.apenasComPendencias && statusConciliacao === 'completo') {
          continue;
        }

        orcamentosProcessados.push({
          id: orc.id,
          codigo: orc.codigo,
          clienteNome: orc.cliente_nome,
          status: orc.status,
          valorTotal,
          valorRecebido,
          valorRecebidoConciliado,
          custoTotal,
          custosPagos,
          custosConciliados,
          statusConciliacao,
          percentualRecebido,
          percentualConciliado,
          createdAt: orc.created_at
        });

        // Acumular totais
        totalValorOrcamentos += valorTotal;
        totalValorRecebido += valorRecebido;
        totalValorRecebidoConciliado += valorRecebidoConciliado;
        totalCustoTotal += custoTotal;
        totalCustosPagos += custosPagos;
        totalCustosConciliados += custosConciliados;
      }

      // Calcular estatísticas
      const completos = orcamentosProcessados.filter(o => o.statusConciliacao === 'completo').length;
      const parciais = orcamentosProcessados.filter(o => o.statusConciliacao === 'parcial').length;
      const pendentes = orcamentosProcessados.filter(o => o.statusConciliacao === 'pendente').length;

      const percentualGeral = totalValorRecebido > 0 
        ? (totalValorRecebidoConciliado / totalValorRecebido) * 100 
        : 0;

      const margemMedia = totalValorOrcamentos > 0
        ? ((totalValorOrcamentos - totalCustoTotal) / totalValorOrcamentos) * 100
        : 0;

      return {
        orcamentos: orcamentosProcessados,
        totais: {
          valorOrcamentos: totalValorOrcamentos,
          valorRecebido: totalValorRecebido,
          valorRecebidoConciliado: totalValorRecebidoConciliado,
          custoTotal: totalCustoTotal,
          custosPagos: totalCustosPagos,
          custosConciliados: totalCustosConciliados,
          margemMedia
        },
        estatisticas: {
          totalOrcamentos: orcamentosProcessados.length,
          completos,
          parciais,
          pendentes,
          percentualGeral
        }
      };
    }
  });
}
