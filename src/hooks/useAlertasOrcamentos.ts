import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AlertaOrcamento {
  tipo: 'custos_pendentes' | 'parcelas_sem_extrato' | 'divergencia_valor' | 'atraso_recebimento';
  severidade: 'info' | 'warning' | 'error';
  orcamentoId: string;
  orcamentoCodigo: string;
  clienteNome: string;
  mensagem: string;
  valor?: number;
  acao?: string;
}

export interface ResumoAlertasOrcamentos {
  alertas: AlertaOrcamento[];
  totalOrcamentosComAlerta: number;
  valorTotalPendente: number;
  parcelasSemExtrato: number;
  custosNaoPagos: number;
}

export function useAlertasOrcamentos() {
  return useQuery({
    queryKey: ['alertas-orcamentos-conciliacao'],
    queryFn: async (): Promise<ResumoAlertasOrcamentos> => {
      const alertas: AlertaOrcamento[] = [];
      let valorTotalPendente = 0;
      let parcelasSemExtrato = 0;
      let custosNaoPagos = 0;

      // Buscar orçamentos com contas a receber
      const { data: contasReceber } = await supabase
        .from('contas_receber')
        .select(`
          id, cliente_nome, valor_total, valor_pago, status, orcamento_id,
          orcamento:orcamentos(id, codigo, cliente_nome, status),
          parcelas_receber(id, numero_parcela, valor, status, data_vencimento)
        `)
        .not('orcamento_id', 'is', null)
        .in('status', ['pendente', 'parcial', 'atrasado']);

      // Buscar lançamentos com parcela_receber_id para saber quais estão conciliadas
      const { data: lancamentosRecebimento } = await supabase
        .from('lancamentos_financeiros')
        .select('id, parcela_receber_id')
        .not('parcela_receber_id', 'is', null);

      const parcelasComLancamento = new Set(
        (lancamentosRecebimento || []).map(l => l.parcela_receber_id)
      );

      // Buscar movimentações conciliadas
      const lancamentoIds = (lancamentosRecebimento || []).map(l => l.id);
      const { data: movimentacoesConciliadas } = await supabase
        .from('movimentacoes_extrato')
        .select('lancamento_id')
        .in('lancamento_id', lancamentoIds.length > 0 ? lancamentoIds : ['00000000-0000-0000-0000-000000000000'])
        .eq('conciliado', true);

      const lancamentosConciliados = new Set(
        (movimentacoesConciliadas || []).map(m => m.lancamento_id)
      );

      // Verificar cada conta a receber
      for (const conta of contasReceber || []) {
        const orcamento = conta.orcamento as any;
        if (!orcamento) continue;

        const parcelasPagas = (conta.parcelas_receber || []).filter((p: any) => p.status === 'pago');
        
        // Verificar parcelas pagas sem conciliação no extrato
        for (const parcela of parcelasPagas as any[]) {
          const lancamento = lancamentosRecebimento?.find(l => l.parcela_receber_id === parcela.id);
          if (lancamento && !lancamentosConciliados.has(lancamento.id)) {
            parcelasSemExtrato++;
            alertas.push({
              tipo: 'parcelas_sem_extrato',
              severidade: 'warning',
              orcamentoId: orcamento.id,
              orcamentoCodigo: orcamento.codigo,
              clienteNome: conta.cliente_nome,
              mensagem: `Parcela ${parcela.numero_parcela} paga não encontrada no extrato`,
              valor: Number(parcela.valor),
              acao: 'Verificar extrato'
            });
          }
        }

        // Verificar parcelas atrasadas
        const parcelasAtrasadas = (conta.parcelas_receber || []).filter((p: any) => p.status === 'atrasado');
        if (parcelasAtrasadas.length > 0) {
          const valorAtrasado = parcelasAtrasadas.reduce((acc: number, p: any) => acc + Number(p.valor), 0);
          valorTotalPendente += valorAtrasado;
          alertas.push({
            tipo: 'atraso_recebimento',
            severidade: 'error',
            orcamentoId: orcamento.id,
            orcamentoCodigo: orcamento.codigo,
            clienteNome: conta.cliente_nome,
            mensagem: `${parcelasAtrasadas.length} parcela(s) em atraso`,
            valor: valorAtrasado,
            acao: 'Cobrar cliente'
          });
        }
      }

      // Buscar contas a pagar não pagas por orçamento
      const { data: contasPagar } = await supabase
        .from('contas_pagar')
        .select(`
          id, descricao, valor, status, orcamento_id,
          orcamento:orcamentos(id, codigo, cliente_nome)
        `)
        .not('orcamento_id', 'is', null)
        .in('status', ['pendente', 'atrasado']);

      // Agrupar por orçamento
      const custosPorOrcamento = new Map<string, { total: number; count: number; orcamento: any }>();
      
      for (const conta of contasPagar || []) {
        const orcamento = conta.orcamento as any;
        if (!orcamento) continue;

        const atual = custosPorOrcamento.get(orcamento.id) || { 
          total: 0, 
          count: 0, 
          orcamento 
        };
        atual.total += Number(conta.valor);
        atual.count++;
        custosPorOrcamento.set(orcamento.id, atual);
        custosNaoPagos++;
      }

      for (const [orcamentoId, dados] of custosPorOrcamento) {
        valorTotalPendente += dados.total;
        alertas.push({
          tipo: 'custos_pendentes',
          severidade: dados.total > 1000 ? 'warning' : 'info',
          orcamentoId,
          orcamentoCodigo: dados.orcamento.codigo,
          clienteNome: dados.orcamento.cliente_nome,
          mensagem: `${dados.count} custo(s) não pago(s)`,
          valor: dados.total,
          acao: 'Pagar custos'
        });
      }

      // Ordenar por severidade e valor
      alertas.sort((a, b) => {
        const severidadeOrder = { error: 0, warning: 1, info: 2 };
        if (severidadeOrder[a.severidade] !== severidadeOrder[b.severidade]) {
          return severidadeOrder[a.severidade] - severidadeOrder[b.severidade];
        }
        return (b.valor || 0) - (a.valor || 0);
      });

      // Contar orçamentos únicos
      const orcamentosUnicos = new Set(alertas.map(a => a.orcamentoId));

      return {
        alertas: alertas.slice(0, 20), // Limitar a 20 alertas
        totalOrcamentosComAlerta: orcamentosUnicos.size,
        valorTotalPendente,
        parcelasSemExtrato,
        custosNaoPagos
      };
    },
    refetchInterval: 60000 // Atualizar a cada minuto
  });
}
