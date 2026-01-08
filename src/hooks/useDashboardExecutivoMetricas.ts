import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, subWeeks, format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { STATUS_COM_PAGAMENTO } from '@/lib/statusOrcamento';

interface MetricasAvancadas {
  ltv: number;
  ticketMedio: number;
  margemMediaProjetada: number;
  margemMediaRealizada: number;
  totalClientes: number;
  totalOrcamentosPagos: number;
}

interface TendenciaSemanal {
  semana: string;
  receita: number;
  conversoes: number;
  ticketMedio: number;
}

interface ProjecaoMensal {
  mesAtual: number;
  projecao: number;
  baseHistorica: number;
  pipelineConvertido: number;
}

interface OrcamentoMargemBaixa {
  id: string;
  codigo: string;
  cliente: string;
  margemProjetada: number;
  margemReal: number;
  diferenca: number;
}

export function useDashboardExecutivoMetricas() {
  return useQuery({
    queryKey: ['dashboard-executivo-metricas'],
    queryFn: async () => {
      const hoje = new Date();
      
      // Buscar orçamentos pagos para LTV e Ticket Médio
      const { data: orcamentosPagos } = await supabase
        .from('orcamentos')
        .select('id, codigo, cliente_nome, cliente_telefone, total_com_desconto, total_geral, custo_total, margem_percent')
        .in('status', STATUS_COM_PAGAMENTO);
      
      // Buscar contas receber para margem realizada
      const { data: contasReceber } = await supabase
        .from('contas_receber')
        .select('orcamento_id, valor_total, valor_pago')
        .not('orcamento_id', 'is', null);
      
      // Buscar contas pagar para custos reais
      const { data: contasPagar } = await supabase
        .from('contas_pagar')
        .select('orcamento_id, valor, status')
        .not('orcamento_id', 'is', null);
      
      // Calcular LTV (por cliente único)
      const clientesUnicos = new Map<string, number>();
      (orcamentosPagos || []).forEach(orc => {
        const valor = orc.total_com_desconto || orc.total_geral || 0;
        const tel = orc.cliente_telefone || 'desconhecido';
        clientesUnicos.set(tel, (clientesUnicos.get(tel) || 0) + valor);
      });
      
      const totalClientes = clientesUnicos.size || 1;
      const totalValorClientes = Array.from(clientesUnicos.values()).reduce((a, b) => a + b, 0);
      const ltv = totalValorClientes / totalClientes;
      
      // Calcular Ticket Médio
      const totalOrcamentosPagos = (orcamentosPagos || []).length || 1;
      const totalValorOrcamentos = (orcamentosPagos || []).reduce((sum, o) => 
        sum + (o.total_com_desconto || o.total_geral || 0), 0);
      const ticketMedio = totalValorOrcamentos / totalOrcamentosPagos;
      
      // Calcular Margem Média Projetada
      const margemMediaProjetada = (orcamentosPagos || []).reduce((sum, o) => 
        sum + (o.margem_percent || 0), 0) / totalOrcamentosPagos;
      
      // Calcular Margem Realizada por orçamento
      const recebidoPorOrcamento = new Map<string, number>();
      (contasReceber || []).forEach(cr => {
        if (cr.orcamento_id) {
          recebidoPorOrcamento.set(cr.orcamento_id, 
            (recebidoPorOrcamento.get(cr.orcamento_id) || 0) + cr.valor_pago);
        }
      });
      
      const custoPorOrcamento = new Map<string, number>();
      (contasPagar || []).filter(cp => cp.status === 'pago').forEach(cp => {
        if (cp.orcamento_id) {
          custoPorOrcamento.set(cp.orcamento_id, 
            (custoPorOrcamento.get(cp.orcamento_id) || 0) + cp.valor);
        }
      });
      
      let somaMargemReal = 0;
      let countMargemReal = 0;
      const orcamentosComMargemBaixa: OrcamentoMargemBaixa[] = [];
      const LIMIAR_MARGEM_CRITICA = -10;
      
      (orcamentosPagos || []).forEach(orc => {
        const recebido = recebidoPorOrcamento.get(orc.id) || 0;
        const custo = custoPorOrcamento.get(orc.id) || (orc.custo_total || 0);
        if (recebido > 0) {
          const margemReal = ((recebido - custo) / recebido) * 100;
          const margemProjetada = orc.margem_percent || 0;
          const diferenca = margemReal - margemProjetada;
          
          somaMargemReal += margemReal;
          countMargemReal++;
          
          // Identificar orçamentos com margem crítica
          if (diferenca < LIMIAR_MARGEM_CRITICA) {
            orcamentosComMargemBaixa.push({
              id: orc.id,
              codigo: orc.codigo || orc.id.substring(0, 8),
              cliente: orc.cliente_nome || 'Cliente',
              margemProjetada,
              margemReal,
              diferenca
            });
          }
        }
      });
      
      // Ordenar por diferença (pior primeiro)
      orcamentosComMargemBaixa.sort((a, b) => a.diferenca - b.diferenca);
      
      const margemMediaRealizada = countMargemReal > 0 ? somaMargemReal / countMargemReal : 0;
      
      const metricas: MetricasAvancadas = {
        ltv,
        ticketMedio,
        margemMediaProjetada,
        margemMediaRealizada,
        totalClientes,
        totalOrcamentosPagos
      };
      
      // === Tendência Semanal (últimas 12 semanas para suportar filtros) ===
      const tendencias: TendenciaSemanal[] = [];
      
      for (let i = 11; i >= 0; i--) {
        const inicioSemana = startOfWeek(subWeeks(hoje, i), { weekStartsOn: 1 });
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(fimSemana.getDate() + 6);
        
        const semanaLabel = format(inicioSemana, 'dd/MM');
        
        // Buscar lançamentos da semana
        const { data: lancamentos } = await supabase
          .from('lancamentos_financeiros')
          .select('valor')
          .eq('tipo', 'receita')
          .gte('data_lancamento', format(inicioSemana, 'yyyy-MM-dd'))
          .lte('data_lancamento', format(fimSemana, 'yyyy-MM-dd'));
        
        // Buscar orçamentos convertidos na semana
        const { data: conversoes } = await supabase
          .from('orcamentos')
          .select('id, total_com_desconto, total_geral')
          .in('status', ['pago', 'pago_parcial', 'pago_40'])
          .gte('status_updated_at', format(inicioSemana, 'yyyy-MM-dd'))
          .lte('status_updated_at', format(fimSemana, 'yyyy-MM-dd'));
        
        const receitaSemana = (lancamentos || []).reduce((sum, l) => sum + l.valor, 0);
        const conversoesSemana = (conversoes || []).length;
        const ticketSemana = conversoesSemana > 0 
          ? (conversoes || []).reduce((sum, c) => sum + (c.total_com_desconto || c.total_geral || 0), 0) / conversoesSemana
          : 0;
        
        tendencias.push({
          semana: semanaLabel,
          receita: receitaSemana,
          conversoes: conversoesSemana,
          ticketMedio: ticketSemana
        });
      }
      
      // === Projeção Mensal ===
      const inicioMesAtual = startOfMonth(hoje);
      const fimMesAtual = endOfMonth(hoje);
      
      // Receita já realizada no mês
      const { data: receitaMesAtual } = await supabase
        .from('lancamentos_financeiros')
        .select('valor')
        .eq('tipo', 'receita')
        .gte('data_lancamento', format(inicioMesAtual, 'yyyy-MM-dd'))
        .lte('data_lancamento', format(hoje, 'yyyy-MM-dd'));
      
      const mesAtualRealizado = (receitaMesAtual || []).reduce((sum, l) => sum + l.valor, 0);
      
      // Média dos últimos 3 meses para base histórica
      let somaUltimosMeses = 0;
      for (let i = 1; i <= 3; i++) {
        const mesAnterior = addMonths(hoje, -i);
        const inicioMes = startOfMonth(mesAnterior);
        const fimMes = endOfMonth(mesAnterior);
        
        const { data: receitaMes } = await supabase
          .from('lancamentos_financeiros')
          .select('valor')
          .eq('tipo', 'receita')
          .gte('data_lancamento', format(inicioMes, 'yyyy-MM-dd'))
          .lte('data_lancamento', format(fimMes, 'yyyy-MM-dd'));
        
        somaUltimosMeses += (receitaMes || []).reduce((sum, l) => sum + l.valor, 0);
      }
      const baseHistorica = somaUltimosMeses / 3;
      
      // Pipeline ativo com taxa de conversão
      const { data: pipelineAtivo } = await supabase
        .from('orcamentos')
        .select('total_com_desconto, total_geral')
        .in('status', ['enviado', 'sem_resposta', 'em_negociacao']);
      
      const valorPipeline = (pipelineAtivo || []).reduce((sum, o) => 
        sum + (o.total_com_desconto || o.total_geral || 0), 0);
      
      // Taxa de conversão histórica
      const { data: todosOrcamentos } = await supabase
        .from('orcamentos')
        .select('status');
      
      const totalOrc = (todosOrcamentos || []).length || 1;
      const pagos = (todosOrcamentos || []).filter(o => 
        ['pago', 'pago_parcial', 'pago_40', 'instalado', 'concluido'].includes(o.status)).length;
      const taxaConversao = pagos / totalOrc;
      
      const pipelineConvertido = valorPipeline * taxaConversao;
      
      // Dias restantes no mês
      const diasNoMes = fimMesAtual.getDate();
      const diasPassados = hoje.getDate();
      const diasRestantes = diasNoMes - diasPassados;
      
      // Projeção: realizado + (média diária histórica * dias restantes) + parte do pipeline
      const mediaDiariaHistorica = baseHistorica / 30;
      const projecaoRestante = mediaDiariaHistorica * diasRestantes;
      const projecao = mesAtualRealizado + projecaoRestante + (pipelineConvertido * 0.3);
      
      const projecaoMensal: ProjecaoMensal = {
        mesAtual: mesAtualRealizado,
        projecao,
        baseHistorica,
        pipelineConvertido
      };
      
      return {
        metricas,
        tendencias,
        projecaoMensal,
        orcamentosComMargemBaixa
      };
    },
    refetchInterval: 300000, // 5 minutos
    staleTime: 60000 // 1 minuto
  });
}
