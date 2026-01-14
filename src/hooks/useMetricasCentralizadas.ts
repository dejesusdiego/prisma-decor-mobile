import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { 
  STATUS_COM_PAGAMENTO, 
  STATUS_TOTALMENTE_PAGO,
  STATUS_PIPELINE_ATIVOS,
  STATUS_NEGOCIO_PERDIDO,
  StatusOrcamento 
} from '@/lib/statusOrcamento';
import { startOfMonth, endOfMonth, subMonths, differenceInDays, parseISO } from 'date-fns';
import { parseDateOnly, startOfToday } from '@/lib/dateOnly';

// ============ INTERFACES ============

export interface MetricasOrcamentos {
  total: number;
  porStatus: Record<StatusOrcamento, number>;
  valorTotal: number;
  valorRecebido: number;
  valorAReceber: number;
  ticketMedio: number;
  taxaConversao: number;
  margemMedia: number;
  orcamentosPagos: number;
}

export interface MetricasFinanceiro {
  saldo: number;
  totalEntradas: number;
  totalSaidas: number;
  contasPagar: { pendente: number; vencido: number; total: number };
  contasReceber: { pendente: number; vencido: number; total: number };
  recebidoMes: number;
  pagoMes: number;
}

export interface MetricasCRM {
  totalContatos: number;
  contatosAtivos: number;
  leads: number;
  clientes: number;
  prospects: number;
  followUpsPendentes: number;
  semInteracao7d: number;
}

export interface MetricasKPIs {
  ltv: number;
  cac: number;
  razaoLtvCac: number;
  churnRate: number;
  clientesPerdidos: number;
  clientesAtivos: number;
  clientesNovos: number;
  ticketMedio: number;
  taxaConversao: number;
  tempoMedioFechamento: number;
}

export interface MetricasProducao {
  pedidosEmProducao: number;
  pedidosProntos: number;
  pedidosAguardando: number;
  instalacoesSemana: number;
  instalacoesAtrasadas: number;
}

export interface MetricasCentralizadas {
  orcamentos: MetricasOrcamentos;
  financeiro: MetricasFinanceiro;
  crm: MetricasCRM;
  kpis: MetricasKPIs;
  producao: MetricasProducao;
  // Dados brutos para cálculos customizados
  raw: {
    orcamentos: any[];
    contatos: any[];
    contasReceber: any[];
    contasPagar: any[];
    lancamentos: any[];
    pedidos: any[];
    instalacoes: any[];
  };
}

// ============ FUNÇÕES DE CÁLCULO PURAS ============

export function calcularMetricasOrcamentos(orcamentos: any[]): MetricasOrcamentos {
  const porStatus = {} as Record<StatusOrcamento, number>;
  
  // Inicializar contadores
  const statusList: StatusOrcamento[] = ['rascunho', 'finalizado', 'enviado', 'sem_resposta', 'recusado', 'cancelado', 'pago_40', 'pago_parcial', 'pago_60', 'pago'];
  statusList.forEach(s => porStatus[s] = 0);
  
  orcamentos.forEach(o => {
    if (porStatus[o.status as StatusOrcamento] !== undefined) {
      porStatus[o.status as StatusOrcamento]++;
    }
  });
  
  const orcamentosPagos = orcamentos.filter(o => STATUS_COM_PAGAMENTO.includes(o.status as StatusOrcamento));
  const valorTotal = orcamentos.reduce((sum, o) => sum + (o.total_com_desconto || o.total_geral || 0), 0);
  const valorRecebido = orcamentosPagos.reduce((sum, o) => sum + (o.total_com_desconto || o.total_geral || 0), 0);
  
  const ticketMedio = orcamentosPagos.length > 0 
    ? valorRecebido / orcamentosPagos.length 
    : 0;
  
  const taxaConversao = orcamentos.length > 0 
    ? (orcamentosPagos.length / orcamentos.length) * 100 
    : 0;
  
  const margemMedia = orcamentosPagos.length > 0
    ? orcamentosPagos.reduce((sum, o) => sum + (o.margem_percent || 0), 0) / orcamentosPagos.length
    : 0;

  return {
    total: orcamentos.length,
    porStatus,
    valorTotal,
    valorRecebido,
    valorAReceber: valorTotal - valorRecebido,
    ticketMedio,
    taxaConversao,
    margemMedia,
    orcamentosPagos: orcamentosPagos.length,
  };
}

export function calcularMetricasFinanceiro(
  contasReceber: any[], 
  contasPagar: any[], 
  lancamentos: any[]
): MetricasFinanceiro {
  const hoje = startOfToday();
  const inicioMes = startOfMonth(hoje);
  const fimMes = endOfMonth(hoje);
  
  // Contas a receber
  const crPendentes = contasReceber.filter(c => c.status === 'pendente');
  const crVencidas = crPendentes.filter(c => {
    const dataVenc = parseDateOnly(c.data_vencimento);
    return dataVenc && dataVenc < hoje;
  });
  const totalCRPendente = crPendentes.reduce((sum, c) => sum + (c.valor_total - (c.valor_pago || 0)), 0);
  const totalCRVencido = crVencidas.reduce((sum, c) => sum + (c.valor_total - (c.valor_pago || 0)), 0);
  
  // Contas a pagar
  const cpPendentes = contasPagar.filter(c => c.status === 'pendente');
  const cpVencidas = cpPendentes.filter(c => {
    const dataVenc = parseDateOnly(c.data_vencimento);
    return dataVenc && dataVenc < hoje;
  });
  const totalCPPendente = cpPendentes.reduce((sum, c) => sum + c.valor, 0);
  const totalCPVencido = cpVencidas.reduce((sum, c) => sum + c.valor, 0);
  
  // Lançamentos do mês
  const lancamentosMes = lancamentos.filter(l => {
    const data = parseDateOnly(l.data_lancamento);
    return data && data >= inicioMes && data <= fimMes;
  });
  
  const entradas = lancamentosMes.filter(l => l.tipo === 'entrada').reduce((sum, l) => sum + l.valor, 0);
  const saidas = lancamentosMes.filter(l => l.tipo === 'saida').reduce((sum, l) => sum + l.valor, 0);
  
  // Saldo total
  const totalEntradas = lancamentos.filter(l => l.tipo === 'entrada').reduce((sum, l) => sum + l.valor, 0);
  const totalSaidas = lancamentos.filter(l => l.tipo === 'saida').reduce((sum, l) => sum + l.valor, 0);

  return {
    saldo: totalEntradas - totalSaidas,
    totalEntradas,
    totalSaidas,
    contasPagar: { pendente: totalCPPendente, vencido: totalCPVencido, total: contasPagar.length },
    contasReceber: { pendente: totalCRPendente, vencido: totalCRVencido, total: contasReceber.length },
    recebidoMes: entradas,
    pagoMes: saidas,
  };
}

export function calcularMetricasCRM(contatos: any[], atividades: any[]): MetricasCRM {
  const hoje = startOfToday();
  const seteDiasAtras = subMonths(hoje, 0);
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
  
  const leads = contatos.filter(c => c.tipo === 'lead').length;
  const clientes = contatos.filter(c => c.tipo === 'cliente').length;
  const prospects = contatos.filter(c => c.tipo === 'prospect').length;
  
  const semInteracao = contatos.filter(c => {
    if (!c.ultima_interacao_em) return true;
    const interacao = parseDateOnly(c.ultima_interacao_em);
    return interacao ? interacao < seteDiasAtras : true;
  }).length;
  
  const followUpsPendentes = atividades.filter(a => {
    const dataAtiv = parseDateOnly(a.data_atividade);
    return !a.concluida && dataAtiv && dataAtiv <= hoje;
  }).length;

  return {
    totalContatos: contatos.length,
    contatosAtivos: clientes + leads,
    leads,
    clientes,
    prospects,
    followUpsPendentes,
    semInteracao7d: semInteracao,
  };
}

export function calcularKPIs(
  orcamentos: any[], 
  contatos: any[], 
  contasPagar: any[],
  mesesAnalise: number = 6
): MetricasKPIs {
  const hoje = startOfToday();
  const dataInicio = subMonths(hoje, mesesAnalise);
  
  // Orçamentos pagos (usar STATUS_COM_PAGAMENTO)
  const orcamentosPagos = orcamentos.filter(o => STATUS_COM_PAGAMENTO.includes(o.status as StatusOrcamento));
  
  // Clientes únicos com pagamento
  const clientesPagos = new Set(orcamentosPagos.map(o => o.cliente_telefone));
  const clientesAtivos = clientesPagos.size;
  
  // Clientes novos no período (created_at é timestamp, não DATE-only, mas usar parseISO para consistência)
  const clientesNovos = contatos.filter(c => {
    const createdAt = parseISO(c.created_at);
    return createdAt >= dataInicio && c.tipo === 'cliente';
  }).length;
  
  // LTV - Valor médio por cliente
  const valorPorCliente: Record<string, number> = {};
  orcamentosPagos.forEach(o => {
    const key = o.cliente_telefone;
    valorPorCliente[key] = (valorPorCliente[key] || 0) + (o.total_com_desconto || o.total_geral || 0);
  });
  
  const valoresClientes = Object.values(valorPorCliente);
  const ltv = valoresClientes.length > 0 
    ? valoresClientes.reduce((a, b) => a + b, 0) / valoresClientes.length 
    : 0;
  
  // CAC - Custo de aquisição
  const custosMkt = contasPagar.filter(c => {
    const categoria = (c.categorias_financeiras as any)?.nome?.toLowerCase() || '';
    return categoria.includes('market') || categoria.includes('vendas') || categoria.includes('publicidade');
  }).reduce((acc, c) => acc + c.valor, 0);
  
  const cac = clientesNovos > 0 ? custosMkt / clientesNovos : 0;
  
  // Churn Rate - clientes perdidos (sem atividade por 90+ dias após último orçamento não pago)
  const clientesPerdidos = contatos.filter(c => {
    const ultimoOrcamento = orcamentos
      .filter(o => o.cliente_telefone === c.telefone)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    
    if (!ultimoOrcamento) return false;
    
    const diasSemAtividade = differenceInDays(hoje, new Date(ultimoOrcamento.created_at));
    return diasSemAtividade > 90 && STATUS_NEGOCIO_PERDIDO.includes(ultimoOrcamento.status as StatusOrcamento);
  }).length;
  
  const totalClientesInicio = contatos.filter(c => 
    new Date(c.created_at) < dataInicio && c.tipo === 'cliente'
  ).length || 1;
  
  const churnRate = (clientesPerdidos / totalClientesInicio) * 100;
  
  // Ticket Médio
  const orcamentosNoPeriodo = orcamentos.filter(o => new Date(o.created_at) >= dataInicio);
  const pagosNoPeriodo = orcamentosNoPeriodo.filter(o => STATUS_COM_PAGAMENTO.includes(o.status as StatusOrcamento));
  
  const ticketMedio = pagosNoPeriodo.length > 0
    ? pagosNoPeriodo.reduce((acc, o) => acc + (o.total_com_desconto || o.total_geral || 0), 0) / pagosNoPeriodo.length
    : 0;
  
  // Taxa de Conversão
  const taxaConversao = orcamentosNoPeriodo.length > 0
    ? (pagosNoPeriodo.length / orcamentosNoPeriodo.length) * 100
    : 0;
  
  // Tempo médio de fechamento
  const temposFechamento = pagosNoPeriodo.map(o => {
    const criacao = new Date(o.created_at);
    const fechamento = new Date(o.status_updated_at || o.updated_at);
    return Math.max(1, Math.round((fechamento.getTime() - criacao.getTime()) / (1000 * 60 * 60 * 24)));
  });
  
  const tempoMedioFechamento = temposFechamento.length > 0
    ? temposFechamento.reduce((a, b) => a + b, 0) / temposFechamento.length
    : 0;

  return {
    ltv,
    cac,
    razaoLtvCac: cac > 0 ? ltv / cac : 0,
    churnRate,
    clientesPerdidos,
    clientesAtivos,
    clientesNovos,
    ticketMedio,
    taxaConversao,
    tempoMedioFechamento,
  };
}

export function calcularMetricasProducao(pedidos: any[], instalacoes: any[]): MetricasProducao {
  const hoje = startOfToday();
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - hoje.getDay());
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 6);
  
  const statusProducao = ['em_producao', 'cortando', 'costurando'];
  const statusProntos = ['pronto', 'finalizado'];
  const statusAguardando = ['aguardando_material', 'aguardando'];
  
  const pedidosEmProducao = pedidos.filter(p => statusProducao.includes(p.status_producao)).length;
  const pedidosProntos = pedidos.filter(p => statusProntos.includes(p.status_producao)).length;
  const pedidosAguardando = pedidos.filter(p => statusAguardando.includes(p.status_producao)).length;
  
  const instalacoesSemana = instalacoes.filter(i => {
    const data = parseDateOnly(i.data_agendada);
    return data && data >= inicioSemana && data <= fimSemana;
  }).length;
  
  const instalacoesAtrasadas = instalacoes.filter(i => {
    const dataAgendada = parseDateOnly(i.data_agendada);
    return i.status === 'pendente' && dataAgendada && dataAgendada < hoje;
  }).length;

  return {
    pedidosEmProducao,
    pedidosProntos,
    pedidosAguardando,
    instalacoesSemana,
    instalacoesAtrasadas,
  };
}

// ============ HOOK PRINCIPAL ============

export function useMetricasCentralizadas() {
  const { organizationId } = useOrganizationContext();
  
  return useQuery({
    queryKey: ['metricas-centralizadas', organizationId],
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos (dados mudam pouco)
    gcTime: 30 * 60 * 1000, // Manter em cache por 30 minutos
    queryFn: async (): Promise<MetricasCentralizadas> => {
      if (!organizationId) throw new Error('Organization ID required');
      
      // Buscar todos os dados em paralelo - usando funções separadas para evitar erro TS2589
      // Otimização: selecionar apenas campos necessários ao invés de '*'
      const fetchData = async <T>(
        table: string, 
        filters?: Record<string, unknown>,
        fields?: string[]
      ): Promise<T[]> => {
        const selectFields = fields || '*'; // Fallback para '*' se não especificado
        let query = supabase.from(table as any).select(Array.isArray(selectFields) ? selectFields.join(',') : selectFields);
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value) as typeof query;
          });
        }
        const { data } = await query;
        return (data || []) as T[];
      };

      // Otimização: selecionar apenas campos necessários para cálculos de métricas
      const [
        orcamentosArr,
        contatosArr,
        contasReceberArr,
        lancamentosArr,
        pedidosArr,
        atividadesArr
      ] = await Promise.all([
        fetchData('orcamentos', { organization_id: organizationId }, ['id', 'status', 'total_geral', 'total_com_desconto', 'custo_total', 'created_at', 'cliente_telefone']),
        fetchData('contatos', { organization_id: organizationId }, ['id', 'tipo', 'created_at', 'telefone']),
        fetchData('contas_receber', { organization_id: organizationId }, ['id', 'valor_total', 'valor_pago', 'status', 'created_at']),
        fetchData('lancamentos_financeiros', { organization_id: organizationId, ignorado: false }, ['id', 'valor', 'tipo', 'data_lancamento']),
        fetchData('pedidos', { organization_id: organizationId }, ['id', 'status_producao', 'created_at', 'data_entrada']),
        fetchData('atividades_crm', { organization_id: organizationId }, ['id', 'tipo', 'concluida', 'data_atividade', 'created_at']),
      ]);

      const contasPagarArr = await fetchData('contas_pagar', { organization_id: organizationId }, ['id', 'valor_total', 'valor_pago', 'status', 'created_at']);
      const instalacoesArr = await fetchData('instalacoes', { organization_id: organizationId }, ['id', 'status', 'data_agendada', 'data_conclusao']);

      return {
        orcamentos: calcularMetricasOrcamentos(orcamentosArr),
        financeiro: calcularMetricasFinanceiro(contasReceberArr, contasPagarArr, lancamentosArr),
        crm: calcularMetricasCRM(contatosArr, atividadesArr),
        kpis: calcularKPIs(orcamentosArr, contatosArr, contasPagarArr),
        producao: calcularMetricasProducao(pedidosArr, instalacoesArr),
        raw: {
          orcamentos: orcamentosArr,
          contatos: contatosArr,
          contasReceber: contasReceberArr,
          contasPagar: contasPagarArr,
          lancamentos: lancamentosArr,
          pedidos: pedidosArr,
          instalacoes: instalacoesArr,
        },
      };
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 2, // 2 minutos
    refetchInterval: 1000 * 60 * 5, // 5 minutos
  });
}

// ============ HOOKS ESPECÍFICOS (para migração gradual) ============

export function useMetricasOrcamentos() {
  const { data, isLoading, error } = useMetricasCentralizadas();
  return { data: data?.orcamentos, isLoading, error };
}

export function useMetricasFinanceiro() {
  const { data, isLoading, error } = useMetricasCentralizadas();
  return { data: data?.financeiro, isLoading, error };
}

export function useMetricasCRM() {
  const { data, isLoading, error } = useMetricasCentralizadas();
  return { data: data?.crm, isLoading, error };
}

export function useMetricasKPIs() {
  const { data, isLoading, error } = useMetricasCentralizadas();
  return { data: data?.kpis, isLoading, error };
}

export function useMetricasProducao() {
  const { data, isLoading, error } = useMetricasCentralizadas();
  return { data: data?.producao, isLoading, error };
}
