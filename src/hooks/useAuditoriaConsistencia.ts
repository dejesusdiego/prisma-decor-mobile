import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InconsistenciaItem {
  id: string;
  tipo: 'orcamento_sem_pedido' | 'orcamento_sem_conta' | 'pedido_sem_pagamento' | 'conta_orfa' | 'status_divergente' | 'comissao_sem_recebimento';
  severidade: 'critica' | 'alta' | 'media';
  descricao: string;
  dados: Record<string, any>;
}

export interface AuditoriaResult {
  orcamentosSemPedido: InconsistenciaItem[];
  orcamentosSemConta: InconsistenciaItem[];
  pedidosSemPagamento: InconsistenciaItem[];
  contasOrfas: InconsistenciaItem[];
  statusDivergente: InconsistenciaItem[];
  comissoesSemRecebimento: InconsistenciaItem[];
  total: number;
  criticas: number;
  altas: number;
  medias: number;
}

export function useAuditoriaConsistencia() {
  return useQuery({
    queryKey: ['auditoria-consistencia'],
    queryFn: async (): Promise<AuditoriaResult> => {
      const inconsistencias: AuditoriaResult = {
        orcamentosSemPedido: [],
        orcamentosSemConta: [],
        pedidosSemPagamento: [],
        contasOrfas: [],
        statusDivergente: [],
        comissoesSemRecebimento: [],
        total: 0,
        criticas: 0,
        altas: 0,
        medias: 0
      };

      // 1. Orçamentos com status de pagamento mas sem pedido na produção
      const { data: orcamentosSemPedido } = await supabase
        .from('orcamentos')
        .select('id, codigo, cliente_nome, status, total_com_desconto, total_geral, created_at')
        .in('status', ['pago_40', 'pago_parcial', 'pago_60', 'pago']);

      if (orcamentosSemPedido) {
        for (const orc of orcamentosSemPedido) {
          const { data: pedido } = await supabase
            .from('pedidos')
            .select('id')
            .eq('orcamento_id', orc.id)
            .maybeSingle();

          if (!pedido) {
            inconsistencias.orcamentosSemPedido.push({
              id: orc.id,
              tipo: 'orcamento_sem_pedido',
              severidade: 'alta',
              descricao: `Orçamento ${orc.codigo} está com status "${orc.status}" mas não tem pedido na produção`,
              dados: {
                codigo: orc.codigo,
                cliente: orc.cliente_nome,
                status: orc.status,
                valor: orc.total_com_desconto || orc.total_geral
              }
            });
          }
        }
      }

      // 1.5 Orçamentos com status de pagamento mas SEM conta a receber
      if (orcamentosSemPedido) {
        for (const orc of orcamentosSemPedido) {
          const { data: conta } = await supabase
            .from('contas_receber')
            .select('id')
            .eq('orcamento_id', orc.id)
            .maybeSingle();

          if (!conta) {
            inconsistencias.orcamentosSemConta.push({
              id: orc.id,
              tipo: 'orcamento_sem_conta',
              severidade: 'critica',
              descricao: `Orçamento ${orc.codigo} está com status "${orc.status}" mas NÃO TEM conta a receber`,
              dados: {
                codigo: orc.codigo,
                cliente: orc.cliente_nome,
                status: orc.status,
                valor: orc.total_com_desconto || orc.total_geral,
                criadoEm: orc.created_at
              }
            });
          }
        }
      }

      // 2. Pedidos ativos com orçamento sem status de pagamento
      const { data: pedidosAtivos } = await supabase
        .from('pedidos')
        .select(`
          id, numero_pedido, status_producao, created_at,
          orcamento:orcamentos(id, codigo, cliente_nome, status)
        `)
        .not('status_producao', 'in', '("entregue","cancelado")');

      if (pedidosAtivos) {
        for (const pedido of pedidosAtivos) {
          const orcamento = pedido.orcamento as any;
          if (orcamento && !['pago_40', 'pago_parcial', 'pago_60', 'pago'].includes(orcamento.status)) {
            inconsistencias.pedidosSemPagamento.push({
              id: pedido.id,
              tipo: 'pedido_sem_pagamento',
              severidade: 'critica',
              descricao: `Pedido ${pedido.numero_pedido} está ativo mas orçamento ${orcamento.codigo} não tem pagamento`,
              dados: {
                numeroPedido: pedido.numero_pedido,
                statusPedido: pedido.status_producao,
                codigo: orcamento.codigo,
                statusOrcamento: orcamento.status
              }
            });
          }
        }
      }

      // 3. Contas a receber órfãs (sem orçamento válido)
      const { data: contasReceber } = await supabase
        .from('contas_receber')
        .select(`
          id, cliente_nome, valor_total, valor_pago, status, orcamento_id,
          orcamento:orcamentos(id, status)
        `)
        .not('status', 'eq', 'pago');

      if (contasReceber) {
        for (const conta of contasReceber) {
          if (conta.orcamento_id && !conta.orcamento) {
            inconsistencias.contasOrfas.push({
              id: conta.id,
              tipo: 'conta_orfa',
              severidade: 'media',
              descricao: `Conta a receber de "${conta.cliente_nome}" referencia orçamento inexistente`,
              dados: {
                cliente: conta.cliente_nome,
                valor: conta.valor_total,
                pago: conta.valor_pago,
                orcamentoId: conta.orcamento_id
              }
            });
          }
        }
      }

      // 4. Status divergente entre orçamento e conta a receber
      const { data: orcamentosComConta } = await supabase
        .from('orcamentos')
        .select(`
          id, codigo, cliente_nome, status, total_com_desconto, total_geral
        `)
        .in('status', ['pago_40', 'pago_parcial', 'pago_60', 'pago']);

      if (orcamentosComConta) {
        for (const orc of orcamentosComConta) {
          const { data: conta } = await supabase
            .from('contas_receber')
            .select('id, valor_total, valor_pago, status')
            .eq('orcamento_id', orc.id)
            .maybeSingle();

          if (conta) {
            const percentualReal = conta.valor_total > 0 ? (conta.valor_pago / conta.valor_total) * 100 : 0;
            let statusEsperado = '';
            
            if (percentualReal >= 100) statusEsperado = 'pago';
            else if (percentualReal >= 60) statusEsperado = 'pago_60';
            else if (percentualReal >= 50) statusEsperado = 'pago_parcial';
            else if (percentualReal >= 40) statusEsperado = 'pago_40';
            else statusEsperado = 'pendente';

            // Verificar divergência significativa
            const statusCompativel = 
              (orc.status === 'pago' && percentualReal >= 99.5) ||
              (orc.status === 'pago_60' && percentualReal >= 60 && percentualReal < 100) ||
              (orc.status === 'pago_parcial' && percentualReal >= 40 && percentualReal < 60) ||
              (orc.status === 'pago_40' && percentualReal >= 40 && percentualReal < 50);

            if (!statusCompativel && percentualReal < 40 && ['pago_40', 'pago_parcial', 'pago_60', 'pago'].includes(orc.status)) {
              inconsistencias.statusDivergente.push({
                id: orc.id,
                tipo: 'status_divergente',
                severidade: 'alta',
                descricao: `Orçamento ${orc.codigo} está como "${orc.status}" mas só tem ${percentualReal.toFixed(1)}% pago`,
                dados: {
                  codigo: orc.codigo,
                  cliente: orc.cliente_nome,
                  statusAtual: orc.status,
                  statusEsperado,
                  percentualPago: percentualReal,
                  valorTotal: conta.valor_total,
                  valorPago: conta.valor_pago
                }
              });
            }
          }
        }
      }

      // 5. Comissões sem parcela recebida correspondente
      const { data: comissoes } = await supabase
        .from('comissoes')
        .select(`
          id, orcamento_id, vendedor_nome, valor_comissao, status, observacoes
        `)
        .eq('status', 'pendente');

      if (comissoes) {
        for (const comissao of comissoes) {
          if (comissao.orcamento_id) {
            const { data: conta } = await supabase
              .from('contas_receber')
              .select('id, valor_pago')
              .eq('orcamento_id', comissao.orcamento_id)
              .maybeSingle();

            if (conta && conta.valor_pago <= 0) {
              inconsistencias.comissoesSemRecebimento.push({
                id: comissao.id,
                tipo: 'comissao_sem_recebimento',
                severidade: 'media',
                descricao: `Comissão de "${comissao.vendedor_nome}" criada mas sem recebimento registrado`,
                dados: {
                  vendedor: comissao.vendedor_nome,
                  valor: comissao.valor_comissao,
                  observacoes: comissao.observacoes
                }
              });
            }
          }
        }
      }

      // Calcular totais
      const todasInconsistencias = [
        ...inconsistencias.orcamentosSemPedido,
        ...inconsistencias.orcamentosSemConta,
        ...inconsistencias.pedidosSemPagamento,
        ...inconsistencias.contasOrfas,
        ...inconsistencias.statusDivergente,
        ...inconsistencias.comissoesSemRecebimento
      ];

      inconsistencias.total = todasInconsistencias.length;
      inconsistencias.criticas = todasInconsistencias.filter(i => i.severidade === 'critica').length;
      inconsistencias.altas = todasInconsistencias.filter(i => i.severidade === 'alta').length;
      inconsistencias.medias = todasInconsistencias.filter(i => i.severidade === 'media').length;

      return inconsistencias;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false
  });
}
