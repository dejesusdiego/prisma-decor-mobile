import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, addDays, format } from 'date-fns';
import { STATUS_COM_PAGAMENTO } from '@/lib/statusOrcamento';
import { parseDateOnly, formatDateOnly, startOfToday } from '@/lib/dateOnly';

export interface MetricasUnificadas {
  // Financeiro
  totalAReceber: number;
  totalVencido: number;
  recebidoMes: number;
  
  // Produção
  pedidosEmProducao: number;
  pedidosProntos: number;
  instalacoesEstaSemana: number;
  
  // CRM
  followUpsPendentes: number;
  contatosSemInteracao7d: number;
  orcamentosSemResposta: number;
  
  // Pipeline
  valorPipelineAtivo: number;
  taxaConversao: number;
}

export interface ProximaAcao {
  tipo: 'instalacao' | 'follow_up' | 'parcela' | 'pedido_pronto' | 'sem_resposta';
  titulo: string;
  descricao: string;
  data?: string;
  prioridade: 'alta' | 'media' | 'baixa';
  referencia: {
    tipo: 'contato' | 'orcamento' | 'pedido' | 'instalacao' | 'parcela';
    id: string;
  };
}

export function useDashboardUnificado() {
  return useQuery({
    queryKey: ['dashboard-unificado'],
    queryFn: async () => {
      const hoje = startOfToday();
      const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 });
      const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 });
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      
      // Buscar contas a receber
      const { data: contasReceber } = await supabase
        .from('contas_receber')
        .select('valor_total, valor_pago, status, data_vencimento');
      
      // Buscar parcelas pendentes
      const { data: parcelasPendentes } = await supabase
        .from('parcelas_receber')
        .select('id, valor, data_vencimento, status, conta_receber_id')
        .in('status', ['pendente', 'atrasado'])
        .order('data_vencimento', { ascending: true });
      
      // Buscar pedidos
      const { data: pedidos } = await supabase
        .from('pedidos')
        .select('id, numero_pedido, status_producao, orcamento_id, orcamento:orcamentos(cliente_nome)');
      
      // Buscar instalações da semana
      const { data: instalacoes } = await supabase
        .from('instalacoes')
        .select('id, data_agendada, turno, status, pedido_id, pedido:pedidos(numero_pedido, orcamento:orcamentos(cliente_nome))')
        .gte('data_agendada', format(inicioSemana, 'yyyy-MM-dd'))
        .lte('data_agendada', format(fimSemana, 'yyyy-MM-dd'))
        .in('status', ['agendada', 'confirmada']);
      
      // Buscar atividades pendentes
      const { data: atividadesPendentes } = await supabase
        .from('atividades_crm')
        .select('id, titulo, tipo, data_atividade, contato_id, contato:contatos(nome)')
        .eq('concluida', false)
        .lte('data_atividade', format(addDays(hoje, 3), 'yyyy-MM-dd'))
        .order('data_atividade', { ascending: true });
      
      // Buscar contatos sem interação
      const dataLimite = format(addDays(hoje, -7), 'yyyy-MM-dd');
      const { data: contatosSemInteracao } = await supabase
        .from('contatos')
        .select('id')
        .or(`ultima_interacao_em.is.null,ultima_interacao_em.lt.${dataLimite}`);
      
      // Buscar orçamentos sem resposta
      const { data: orcamentosSemResposta } = await supabase
        .from('orcamentos')
        .select('id, codigo, cliente_nome, total_com_desconto, total_geral, status_updated_at, contato_id')
        .in('status', ['enviado', 'sem_resposta'])
        .order('status_updated_at', { ascending: true });
      
      // Buscar lançamentos do mês
      const { data: lancamentosMes } = await supabase
        .from('lancamentos_financeiros')
        .select('valor, tipo')
        .gte('data_lancamento', format(inicioMes, 'yyyy-MM-dd'))
        .eq('tipo', 'receita');
      
      // Buscar taxa de conversão
      const { data: orcamentosTodos } = await supabase
        .from('orcamentos')
        .select('status');
      
      // Calcular métricas
      const totalAReceber = (contasReceber || [])
        .filter(c => c.status !== 'pago')
        .reduce((sum, c) => sum + (c.valor_total - c.valor_pago), 0);
      
      const totalVencido = (parcelasPendentes || [])
        .filter(p => p.status === 'atrasado')
        .reduce((sum, p) => sum + p.valor, 0);
      
      const recebidoMes = (lancamentosMes || [])
        .reduce((sum, l) => sum + l.valor, 0);
      
      const statusProducao = ['em_corte', 'em_costura', 'aguardando_materiais'];
      const statusProntos = ['pronto_instalacao', 'pronto_entrega'];
      
      const pedidosEmProducao = (pedidos || []).filter(p => statusProducao.includes(p.status_producao)).length;
      const pedidosProntos = (pedidos || []).filter(p => statusProntos.includes(p.status_producao)).length;
      const instalacoesEstaSemana = (instalacoes || []).length;
      
      const followUpsPendentes = (atividadesPendentes || []).length;
      const contatosSemInteracao7d = (contatosSemInteracao || []).length;
      const qtdOrcamentosSemResposta = (orcamentosSemResposta || []).length;
      
      const orcamentosTotal = orcamentosTodos?.length || 1;
      const orcamentosPagos = orcamentosTodos?.filter(o => STATUS_COM_PAGAMENTO.includes(o.status as any)).length || 0;
      const taxaConversao = (orcamentosPagos / orcamentosTotal) * 100;
      
      const valorPipelineAtivo = (orcamentosSemResposta || [])
        .reduce((sum, o) => sum + (o.total_com_desconto || o.total_geral || 0), 0);
      
      const metricas: MetricasUnificadas = {
        totalAReceber,
        totalVencido,
        recebidoMes,
        pedidosEmProducao,
        pedidosProntos,
        instalacoesEstaSemana,
        followUpsPendentes,
        contatosSemInteracao7d,
        orcamentosSemResposta: qtdOrcamentosSemResposta,
        valorPipelineAtivo,
        taxaConversao
      };
      
      // Montar próximas ações
      const proximasAcoes: ProximaAcao[] = [];
      
      // Instalações agendadas
      (instalacoes || []).slice(0, 3).forEach((inst: any) => {
        proximasAcoes.push({
          tipo: 'instalacao',
          titulo: `Instalação - ${inst.pedido?.orcamento?.cliente_nome || 'Cliente'}`,
          descricao: `${formatDateOnly(inst.data_agendada, 'dd/MM')} - ${inst.turno === 'manha' ? 'Manhã' : 'Tarde'}`,
          data: inst.data_agendada,
          prioridade: 'alta',
          referencia: { tipo: 'instalacao', id: inst.id }
        });
      });
      
      // Pedidos prontos
      (pedidos || []).filter((p: any) => statusProntos.includes(p.status_producao)).slice(0, 3).forEach((ped: any) => {
        proximasAcoes.push({
          tipo: 'pedido_pronto',
          titulo: `Pedido ${ped.numero_pedido} pronto`,
          descricao: ped.orcamento?.cliente_nome || 'Agendar entrega/instalação',
          prioridade: 'alta',
          referencia: { tipo: 'pedido', id: ped.id }
        });
      });
      
      // Follow-ups pendentes
      (atividadesPendentes || []).slice(0, 3).forEach((ativ: any) => {
        const dataAtividade = parseDateOnly(ativ.data_atividade) || new Date();
        proximasAcoes.push({
          tipo: 'follow_up',
          titulo: ativ.titulo,
          descricao: ativ.contato?.nome || 'Contato',
          data: ativ.data_atividade,
          prioridade: dataAtividade < hoje ? 'alta' : 'media',
          referencia: { tipo: 'contato', id: ativ.contato_id }
        });
      });
      
      // Parcelas vencendo
      (parcelasPendentes || []).slice(0, 3).forEach((parc: any) => {
        const dataVenc = parseDateOnly(parc.data_vencimento);
        const isVencido = dataVenc ? dataVenc < hoje : false;
        proximasAcoes.push({
          tipo: 'parcela',
          titulo: `Parcela ${isVencido ? 'vencida' : 'a vencer'}`,
          descricao: `R$ ${parc.valor.toFixed(0)} - ${formatDateOnly(parc.data_vencimento, 'dd/MM')}`,
          data: parc.data_vencimento,
          prioridade: isVencido ? 'alta' : 'media',
          referencia: { tipo: 'parcela', id: parc.id }
        });
      });
      
      // Orçamentos sem resposta
      (orcamentosSemResposta || []).slice(0, 3).forEach((orc: any) => {
        proximasAcoes.push({
          tipo: 'sem_resposta',
          titulo: `${orc.codigo} - ${orc.cliente_nome}`,
          descricao: `R$ ${(orc.total_com_desconto || orc.total_geral || 0).toFixed(0)}`,
          prioridade: 'media',
          referencia: { tipo: 'orcamento', id: orc.id }
        });
      });
      
      // Ordenar por prioridade
      proximasAcoes.sort((a, b) => {
        const prioridadeOrdem = { alta: 0, media: 1, baixa: 2 };
        return prioridadeOrdem[a.prioridade] - prioridadeOrdem[b.prioridade];
      });
      
      return {
        metricas,
        proximasAcoes: proximasAcoes.slice(0, 10)
      };
    },
    refetchInterval: 60000 // Atualizar a cada minuto
  });
}
