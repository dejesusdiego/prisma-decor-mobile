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
  cidade: string | null;
  status: string;
  total_geral: number | null;
  total_com_desconto: number | null;
  custo_total: number | null;
  subtotal_materiais: number | null;
  subtotal_mao_obra_costura: number | null;
  subtotal_instalacao: number | null;
  created_at: string;
  updated_at: string;
  status_updated_at: string | null;
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

interface Tendencia {
  valor: number;
  percentual: number;
  tipo: 'up' | 'down' | 'neutral';
}

interface StatsTendencias {
  totalOrcamentos: Tendencia;
  valorTotal: Tendencia;
  taxaConversao: Tendencia;
  valorAReceber: Tendencia;
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

interface ProdutoRanking {
  tipo: string;
  quantidade: number;
  faturamento: number;
}

interface DadoCusto {
  nome: string;
  valor: number;
  cor: string;
}

interface CidadeDistribuicao {
  cidade: string;
  quantidade: number;
  valor: number;
}

interface DashboardData {
  stats: Stats;
  tendencias: StatsTendencias;
  funil: FunilItem[];
  recentOrcamentos: Orcamento[];
  dadosMensais: DadoMensal[];
  alertas: OrcamentoAlerta[];
  produtosRanking: ProdutoRanking[];
  custosComposicao: DadoCusto[];
  cidadesDistribuicao: CidadeDistribuicao[];
  tempoMedioConversao: number;
  metaVendas: { meta: number; realizado: number };
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

function getPreviousDateRange(periodo: PeriodoFiltro): { inicio: Date; fim: Date } {
  const { inicio, fim } = getDateRange(periodo);
  const duracao = differenceInDays(fim, inicio);
  
  return {
    inicio: subDays(inicio, duracao + 1),
    fim: subDays(inicio, 1),
  };
}

function calcularTendencia(atual: number, anterior: number): Tendencia {
  if (anterior === 0) {
    return { valor: atual, percentual: atual > 0 ? 100 : 0, tipo: atual > 0 ? 'up' : 'neutral' };
  }
  const diff = atual - anterior;
  const percentual = (diff / anterior) * 100;
  return {
    valor: diff,
    percentual: Math.abs(percentual),
    tipo: percentual > 0 ? 'up' : percentual < 0 ? 'down' : 'neutral',
  };
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
  const [tendencias, setTendencias] = useState<StatsTendencias>({
    totalOrcamentos: { valor: 0, percentual: 0, tipo: 'neutral' },
    valorTotal: { valor: 0, percentual: 0, tipo: 'neutral' },
    taxaConversao: { valor: 0, percentual: 0, tipo: 'neutral' },
    valorAReceber: { valor: 0, percentual: 0, tipo: 'neutral' },
  });
  const [funil, setFunil] = useState<FunilItem[]>([]);
  const [recentOrcamentos, setRecentOrcamentos] = useState<Orcamento[]>([]);
  const [dadosMensais, setDadosMensais] = useState<DadoMensal[]>([]);
  const [alertas, setAlertas] = useState<OrcamentoAlerta[]>([]);
  const [produtosRanking, setProdutosRanking] = useState<ProdutoRanking[]>([]);
  const [custosComposicao, setCustosComposicao] = useState<DadoCusto[]>([]);
  const [cidadesDistribuicao, setCidadesDistribuicao] = useState<CidadeDistribuicao[]>([]);
  const [tempoMedioConversao, setTempoMedioConversao] = useState(0);
  const [metaVendas, setMetaVendas] = useState({ meta: 0, realizado: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { inicio, fim } = getDateRange(periodo);
      const { inicio: inicioAnterior, fim: fimAnterior } = getPreviousDateRange(periodo);

      // Buscar orçamentos do período atual
      const { data: orcamentos, error: orcError } = await supabase
        .from('orcamentos')
        .select('*')
        .gte('created_at', inicio.toISOString())
        .lte('created_at', fim.toISOString())
        .order('created_at', { ascending: false });

      if (orcError) throw orcError;

      // Buscar orçamentos do período anterior para comparação
      const { data: orcamentosAnteriores } = await supabase
        .from('orcamentos')
        .select('*')
        .gte('created_at', inicioAnterior.toISOString())
        .lte('created_at', fimAnterior.toISOString());

      // Buscar itens de cortina para ranking de produtos
      const orcamentoIds = (orcamentos || []).map(o => o.id);
      let cortinaItems: any[] = [];
      
      if (orcamentoIds.length > 0) {
        const { data: items } = await supabase
          .from('cortina_items')
          .select('tipo_cortina, tipo_produto, quantidade, preco_venda, orcamento_id')
          .in('orcamento_id', orcamentoIds);
        cortinaItems = items || [];
      }

      // Buscar meta de vendas
      const { data: configMeta } = await supabase
        .from('configuracoes_sistema')
        .select('valor')
        .eq('chave', 'meta_vendas_mensal')
        .maybeSingle();

      const allOrcamentos = (orcamentos || []) as Orcamento[];
      const allOrcamentosAnteriores = (orcamentosAnteriores || []) as Orcamento[];

      // Calcular estatísticas do período atual
      let valorTotal = 0;
      let valorRecebido = 0;
      let valorAReceber = 0;
      let custoTotal = 0;
      let totalMateriais = 0;
      let totalCostura = 0;
      let totalInstalacao = 0;
      let orcamentosComValor = 0;
      let orcamentosConvertidos = 0;
      let temposConversao: number[] = [];

      const statusCount: Record<string, { quantidade: number; valor: number }> = {};
      const cidadesMap: Record<string, { quantidade: number; valor: number }> = {};

      allOrcamentos.forEach((orc) => {
        const valor = getValorEfetivo(orc);
        valorTotal += valor;
        valorRecebido += calcularValorRecebido(orc);
        valorAReceber += calcularValorAReceber(orc);
        custoTotal += orc.custo_total || 0;
        totalMateriais += orc.subtotal_materiais || 0;
        totalCostura += orc.subtotal_mao_obra_costura || 0;
        totalInstalacao += orc.subtotal_instalacao || 0;

        if (valor > 0) orcamentosComValor++;

        // Contar conversões e calcular tempo
        if (['aprovado', 'pago_40', 'pago_parcial', 'pago_60', 'pago'].includes(orc.status)) {
          orcamentosConvertidos++;
          if (orc.status_updated_at) {
            const dias = differenceInDays(new Date(orc.status_updated_at), new Date(orc.created_at));
            if (dias >= 0) temposConversao.push(dias);
          }
        }

        // Agrupar por status
        if (!statusCount[orc.status]) {
          statusCount[orc.status] = { quantidade: 0, valor: 0 };
        }
        statusCount[orc.status].quantidade++;
        statusCount[orc.status].valor += valor;

        // Agrupar por cidade
        const cidade = orc.cidade || 'Não informada';
        if (!cidadesMap[cidade]) {
          cidadesMap[cidade] = { quantidade: 0, valor: 0 };
        }
        cidadesMap[cidade].quantidade++;
        cidadesMap[cidade].valor += valor;
      });

      // Calcular estatísticas do período anterior
      let valorTotalAnterior = 0;
      let valorAReceberAnterior = 0;
      let orcamentosConvertidosAnterior = 0;

      allOrcamentosAnteriores.forEach((orc) => {
        valorTotalAnterior += getValorEfetivo(orc);
        valorAReceberAnterior += calcularValorAReceber(orc);
        if (['aprovado', 'pago_40', 'pago_parcial', 'pago_60', 'pago'].includes(orc.status)) {
          orcamentosConvertidosAnterior++;
        }
      });

      const totalOrcamentos = allOrcamentos.length;
      const totalOrcamentosAnterior = allOrcamentosAnteriores.length;
      const ticketMedio = orcamentosComValor > 0 ? valorTotal / orcamentosComValor : 0;
      const taxaConversao = totalOrcamentos > 0 ? (orcamentosConvertidos / totalOrcamentos) * 100 : 0;
      const taxaConversaoAnterior = totalOrcamentosAnterior > 0 
        ? (orcamentosConvertidosAnterior / totalOrcamentosAnterior) * 100 : 0;
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

      // Calcular tendências
      setTendencias({
        totalOrcamentos: calcularTendencia(totalOrcamentos, totalOrcamentosAnterior),
        valorTotal: calcularTendencia(valorTotal, valorTotalAnterior),
        taxaConversao: calcularTendencia(taxaConversao, taxaConversaoAnterior),
        valorAReceber: calcularTendencia(valorAReceber, valorAReceberAnterior),
      });

      // Composição de custos
      setCustosComposicao([
        { nome: 'Materiais', valor: totalMateriais, cor: 'hsl(var(--chart-1))' },
        { nome: 'Costura', valor: totalCostura, cor: 'hsl(var(--chart-2))' },
        { nome: 'Instalação', valor: totalInstalacao, cor: 'hsl(var(--chart-3))' },
      ]);

      // Distribuição por cidade (top 5)
      const cidadesArr = Object.entries(cidadesMap)
        .map(([cidade, data]) => ({ cidade, ...data }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 5);
      setCidadesDistribuicao(cidadesArr);

      // Tempo médio de conversão
      const tempoMedio = temposConversao.length > 0 
        ? temposConversao.reduce((a, b) => a + b, 0) / temposConversao.length 
        : 0;
      setTempoMedioConversao(Math.round(tempoMedio));

      // Ranking de produtos
      const produtosMap: Record<string, { quantidade: number; faturamento: number }> = {};
      cortinaItems.forEach((item) => {
        const tipo = item.tipo_cortina || item.tipo_produto || 'outro';
        if (!produtosMap[tipo]) {
          produtosMap[tipo] = { quantidade: 0, faturamento: 0 };
        }
        produtosMap[tipo].quantidade += item.quantidade || 1;
        produtosMap[tipo].faturamento += item.preco_venda || 0;
      });

      const produtosArr = Object.entries(produtosMap)
        .map(([tipo, data]) => ({ tipo, ...data }))
        .sort((a, b) => b.faturamento - a.faturamento)
        .slice(0, 5);
      setProdutosRanking(produtosArr);

      // Meta de vendas (mês atual)
      const metaValor = configMeta?.valor as number || 100000;
      const iniciMes = startOfMonth(new Date());
      const realizadoMes = allOrcamentos
        .filter(o => 
          new Date(o.created_at) >= iniciMes && 
          ['aprovado', 'pago_40', 'pago_parcial', 'pago_60', 'pago'].includes(o.status)
        )
        .reduce((sum, o) => sum + getValorEfetivo(o), 0);
      setMetaVendas({ meta: metaValor, realizado: realizadoMes });

      // Funil de vendas
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

      // Orçamentos recentes
      setRecentOrcamentos(allOrcamentos.slice(0, 10));

      // Dados diários
      const diasMap: Record<string, { faturamento: number; quantidade: number }> = {};
      allOrcamentos.forEach((orc) => {
        if (['aprovado', 'pago_40', 'pago_parcial', 'pago_60', 'pago'].includes(orc.status)) {
          const diaKey = format(new Date(orc.created_at), 'yyyy-MM-dd');
          if (!diasMap[diaKey]) {
            diasMap[diaKey] = { faturamento: 0, quantidade: 0 };
          }
          diasMap[diaKey].faturamento += getValorEfetivo(orc);
          diasMap[diaKey].quantidade++;
        }
      });

      const dadosDiariosArr = Object.entries(diasMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([diaKey, data]) => ({ 
          mes: format(new Date(diaKey), 'dd/MM'),
          ...data 
        }));
      setDadosMensais(dadosDiariosArr);

      // Alertas
      const hoje = new Date();
      const alertasArr: OrcamentoAlerta[] = [];

      allOrcamentos.forEach((orc) => {
        const valor = getValorEfetivo(orc);

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
    tendencias,
    funil,
    recentOrcamentos,
    dadosMensais,
    alertas,
    produtosRanking,
    custosComposicao,
    cidadesDistribuicao,
    tempoMedioConversao,
    metaVendas,
    isLoading,
    error,
    refetch: loadData,
  };
}
