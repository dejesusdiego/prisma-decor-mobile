import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { STATUS_LIST, getStatusConfig } from '@/lib/statusOrcamento';
import {
  getValorEfetivo,
  calcularValorRecebido,
  calcularValorAReceber,
  getOrdemFunil,
  getStatusChartColor,
} from '@/lib/calculosStatus';
import { addDays, subDays, startOfMonth, endOfMonth, format, differenceInDays } from 'date-fns';

export type PeriodoFiltro = '7d' | '30d' | '90d' | '12m' | 'mes_atual' | 'all';

interface Orcamento {
  id: string;
  codigo: string;
  cliente_nome: string;
  status: string;
  total_geral: number | null;
  total_com_desconto: number | null;
  created_at: string;
  updated_at: string;
  validade_dias: number | null;
}

interface Stats {
  totalOrcamentos: number;
  valorTotal: number;
  valorRecebido: number;
  valorAReceber: number;
  ticketMedio: number;
  taxaConversao: number;
  margemMedia: number;
  lucroProjetado: number;
}

interface FunilItem {
  status: string;
  label: string;
  quantidade: number;
  valor: number;
  color: string;
  percentual: number;
}

interface DadoMensal {
  mes: string;
  faturamento: number;
  quantidade: number;
}

interface OrcamentoAlerta {
  id: string;
  codigo: string;
  cliente_nome: string;
  tipo: 'vencendo' | 'sem_resposta' | 'vencido';
  diasRestantes?: number;
  diasSemResposta?: number;
  valor: number;
}

interface DashboardData {
  stats: Stats;
  funil: FunilItem[];
  recentOrcamentos: Orcamento[];
  dadosMensais: DadoMensal[];
  alertas: OrcamentoAlerta[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function getDateRange(periodo: PeriodoFiltro): { inicio: Date; fim: Date } {
  const hoje = new Date();
  
  switch (periodo) {
    case '7d':
      return { inicio: subDays(hoje, 7), fim: hoje };
    case '30d':
      return { inicio: subDays(hoje, 30), fim: hoje };
    case '90d':
      return { inicio: subDays(hoje, 90), fim: hoje };
    case '12m':
      return { inicio: subDays(hoje, 365), fim: hoje };
    case 'mes_atual':
      return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) };
    case 'all':
    default:
      return { inicio: new Date(2020, 0, 1), fim: hoje };
  }
}

export function useDashboardData(periodo: PeriodoFiltro = '30d'): DashboardData {
  const [stats, setStats] = useState<Stats>({
    totalOrcamentos: 0,
    valorTotal: 0,
    valorRecebido: 0,
    valorAReceber: 0,
    ticketMedio: 0,
    taxaConversao: 0,
    margemMedia: 0,
    lucroProjetado: 0,
  });
  const [funil, setFunil] = useState<FunilItem[]>([]);
  const [recentOrcamentos, setRecentOrcamentos] = useState<Orcamento[]>([]);
  const [dadosMensais, setDadosMensais] = useState<DadoMensal[]>([]);
  const [alertas, setAlertas] = useState<OrcamentoAlerta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { inicio, fim } = getDateRange(periodo);

      // Buscar todos os orçamentos do período
      const { data: orcamentos, error: orcError } = await supabase
        .from('orcamentos')
        .select('*')
        .gte('created_at', inicio.toISOString())
        .lte('created_at', fim.toISOString())
        .order('created_at', { ascending: false });

      if (orcError) throw orcError;

      const allOrcamentos = orcamentos || [];

      // Calcular estatísticas
      let valorTotal = 0;
      let valorRecebido = 0;
      let valorAReceber = 0;
      let custoTotal = 0;
      let orcamentosComValor = 0;
      let orcamentosConvertidos = 0;

      // Agrupar por status para o funil
      const statusCount: Record<string, { quantidade: number; valor: number }> = {};

      allOrcamentos.forEach((orc) => {
        const valor = getValorEfetivo(orc);
        valorTotal += valor;
        valorRecebido += calcularValorRecebido(orc);
        valorAReceber += calcularValorAReceber(orc);
        custoTotal += orc.custo_total || 0;

        if (valor > 0) orcamentosComValor++;

        // Contar conversões (aprovado em diante)
        if (['aprovado', 'pago_40', 'pago_parcial', 'pago_60', 'pago'].includes(orc.status)) {
          orcamentosConvertidos++;
        }

        // Agrupar por status
        if (!statusCount[orc.status]) {
          statusCount[orc.status] = { quantidade: 0, valor: 0 };
        }
        statusCount[orc.status].quantidade++;
        statusCount[orc.status].valor += valor;
      });

      // Calcular estatísticas
      const totalOrcamentos = allOrcamentos.length;
      const ticketMedio = orcamentosComValor > 0 ? valorTotal / orcamentosComValor : 0;
      const taxaConversao = totalOrcamentos > 0 ? (orcamentosConvertidos / totalOrcamentos) * 100 : 0;
      const margemMedia = valorTotal > 0 ? ((valorTotal - custoTotal) / valorTotal) * 100 : 0;
      const lucroProjetado = valorTotal - custoTotal;

      setStats({
        totalOrcamentos,
        valorTotal,
        valorRecebido,
        valorAReceber,
        ticketMedio,
        taxaConversao,
        margemMedia,
        lucroProjetado,
      });

      // Montar funil de vendas com todos os status
      const funilData: FunilItem[] = STATUS_LIST
        .map((status) => {
          const config = getStatusConfig(status);
          const data = statusCount[status] || { quantidade: 0, valor: 0 };
          return {
            status,
            label: config.label,
            quantidade: data.quantidade,
            valor: data.valor,
            color: getStatusChartColor(status),
            percentual: totalOrcamentos > 0 ? (data.quantidade / totalOrcamentos) * 100 : 0,
          };
        })
        .filter((item) => item.quantidade > 0)
        .sort((a, b) => getOrdemFunil(a.status) - getOrdemFunil(b.status));

      setFunil(funilData);

      // Orçamentos recentes (últimos 10)
      setRecentOrcamentos(allOrcamentos.slice(0, 10));

      // Dados mensais (últimos 6 meses)
      const mesesMap: Record<string, { faturamento: number; quantidade: number }> = {};
      allOrcamentos.forEach((orc) => {
        if (['aprovado', 'pago_40', 'pago_parcial', 'pago_60', 'pago'].includes(orc.status)) {
          const mes = format(new Date(orc.created_at), 'MMM/yy');
          if (!mesesMap[mes]) {
            mesesMap[mes] = { faturamento: 0, quantidade: 0 };
          }
          mesesMap[mes].faturamento += getValorEfetivo(orc);
          mesesMap[mes].quantidade++;
        }
      });

      const dadosMensaisArr = Object.entries(mesesMap)
        .map(([mes, data]) => ({ mes, ...data }))
        .slice(-6);

      setDadosMensais(dadosMensaisArr);

      // Calcular alertas
      const hoje = new Date();
      const alertasArr: OrcamentoAlerta[] = [];

      allOrcamentos.forEach((orc) => {
        const valor = getValorEfetivo(orc);

        // Orçamentos enviados sem resposta há mais de 5 dias
        if (orc.status === 'enviado') {
          const diasSemResposta = differenceInDays(hoje, new Date(orc.updated_at));
          if (diasSemResposta >= 5) {
            alertasArr.push({
              id: orc.id,
              codigo: orc.codigo,
              cliente_nome: orc.cliente_nome,
              tipo: 'sem_resposta',
              diasSemResposta,
              valor,
            });
          }
        }

        // Orçamentos próximos do vencimento ou vencidos
        if (['rascunho', 'finalizado', 'enviado'].includes(orc.status) && orc.validade_dias) {
          const dataVencimento = addDays(new Date(orc.created_at), orc.validade_dias);
          const diasRestantes = differenceInDays(dataVencimento, hoje);

          if (diasRestantes < 0) {
            alertasArr.push({
              id: orc.id,
              codigo: orc.codigo,
              cliente_nome: orc.cliente_nome,
              tipo: 'vencido',
              diasRestantes,
              valor,
            });
          } else if (diasRestantes <= 3) {
            alertasArr.push({
              id: orc.id,
              codigo: orc.codigo,
              cliente_nome: orc.cliente_nome,
              tipo: 'vencendo',
              diasRestantes,
              valor,
            });
          }
        }
      });

      // Ordenar alertas: vencidos primeiro, depois por urgência
      alertasArr.sort((a, b) => {
        if (a.tipo === 'vencido' && b.tipo !== 'vencido') return -1;
        if (b.tipo === 'vencido' && a.tipo !== 'vencido') return 1;
        return (a.diasRestantes ?? 0) - (b.diasRestantes ?? 0);
      });

      setAlertas(alertasArr.slice(0, 10));
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setError('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    stats,
    funil,
    recentOrcamentos,
    dadosMensais,
    alertas,
    isLoading,
    error,
    refetch: loadData,
  };
}
