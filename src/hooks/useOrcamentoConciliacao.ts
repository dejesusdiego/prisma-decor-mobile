import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MovimentacaoConciliada {
  id: string;
  descricao: string;
  valor: number;
  tipo: string | null;
  data_movimentacao: string;
  conciliado: boolean;
  ignorado: boolean;
  lancamento_id: string | null;
  // Dados do lançamento vinculado
  lancamento?: {
    id: string;
    descricao: string;
    tipo: string;
    parcela_receber_id: string | null;
    conta_pagar_id: string | null;
  } | null;
  // Origem: recebimento ou pagamento
  origem: 'recebimento' | 'pagamento' | 'manual';
  parcela_numero?: number;
  conta_descricao?: string;
}

export interface ParcelaConciliacao {
  id: string;
  numero_parcela: number;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  conciliada_extrato: boolean;
  movimentacao_extrato?: {
    id: string;
    descricao: string;
    data_movimentacao: string;
    valor: number;
  } | null;
}

export interface ContaPagarConciliacao {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  fornecedor: string | null;
  categoria_nome: string | null;
  conciliada_extrato: boolean;
  movimentacao_extrato?: {
    id: string;
    descricao: string;
    data_movimentacao: string;
    valor: number;
  } | null;
}

export interface ComparativoConciliacao {
  valorOrcamento: number;
  totalRecebido: number;
  totalRecebidoConciliado: number;
  totalCustos: number;
  totalCustosPagos: number;
  totalCustosConciliados: number;
  margemProjetada: number;
  margemRealizada: number;
  diferencaRecebimentos: number;
  diferencaCustos: number;
}

export interface AlertaConciliacao {
  tipo: 'warning' | 'error' | 'info';
  mensagem: string;
  acao?: string;
}

export interface OrcamentoConciliacaoData {
  orcamento: {
    id: string;
    codigo: string;
    cliente_nome: string;
    status: string;
    total_geral: number | null;
    total_com_desconto: number | null;
    custo_total: number | null;
  } | null;
  parcelas: ParcelaConciliacao[];
  contasPagar: ContaPagarConciliacao[];
  movimentacoes: MovimentacaoConciliada[];
  comparativo: ComparativoConciliacao;
  alertas: AlertaConciliacao[];
  statusConciliacao: 'completo' | 'parcial' | 'pendente';
}

export function useOrcamentoConciliacao(orcamentoId: string | null) {
  return useQuery({
    queryKey: ['orcamento-conciliacao', orcamentoId],
    queryFn: async (): Promise<OrcamentoConciliacaoData> => {
      if (!orcamentoId) {
        return {
          orcamento: null,
          parcelas: [],
          contasPagar: [],
          movimentacoes: [],
          comparativo: {
            valorOrcamento: 0,
            totalRecebido: 0,
            totalRecebidoConciliado: 0,
            totalCustos: 0,
            totalCustosPagos: 0,
            totalCustosConciliados: 0,
            margemProjetada: 0,
            margemRealizada: 0,
            diferencaRecebimentos: 0,
            diferencaCustos: 0
          },
          alertas: [],
          statusConciliacao: 'pendente'
        };
      }

      // Buscar orçamento
      const { data: orcamento } = await supabase
        .from('orcamentos')
        .select('id, codigo, cliente_nome, status, total_geral, total_com_desconto, custo_total')
        .eq('id', orcamentoId)
        .single();

      // Buscar contas a receber e parcelas
      const { data: contasReceber } = await supabase
        .from('contas_receber')
        .select(`
          id,
          descricao,
          valor_total,
          valor_pago,
          parcelas_receber (
            id,
            numero_parcela,
            valor,
            data_vencimento,
            data_pagamento,
            status
          )
        `)
        .eq('orcamento_id', orcamentoId);

      // Buscar contas a pagar
      const { data: contasPagar } = await supabase
        .from('contas_pagar')
        .select(`
          id,
          descricao,
          valor,
          data_vencimento,
          data_pagamento,
          status,
          fornecedor,
          categoria_id,
          categorias_financeiras (nome)
        `)
        .eq('orcamento_id', orcamentoId);

      // Coletar IDs de parcelas e contas para buscar lançamentos
      const parcelaIds = contasReceber?.flatMap(c => c.parcelas_receber?.map(p => p.id) || []) || [];
      const contaPagarIds = contasPagar?.map(c => c.id) || [];

      // Buscar lançamentos vinculados
      const { data: lancamentos } = await supabase
        .from('lancamentos_financeiros')
        .select('id, descricao, tipo, parcela_receber_id, conta_pagar_id')
        .or(`parcela_receber_id.in.(${parcelaIds.join(',')}),conta_pagar_id.in.(${contaPagarIds.join(',')})`);

      // Buscar movimentações de extrato vinculadas aos lançamentos
      const lancamentoIds = lancamentos?.map(l => l.id) || [];
      const { data: movimentacoes } = await supabase
        .from('movimentacoes_extrato')
        .select('id, descricao, valor, tipo, data_movimentacao, conciliado, ignorado, lancamento_id')
        .in('lancamento_id', lancamentoIds.length > 0 ? lancamentoIds : ['00000000-0000-0000-0000-000000000000']);

      // Processar parcelas com status de conciliação
      const parcelas: ParcelaConciliacao[] = [];
      contasReceber?.forEach(conta => {
        conta.parcelas_receber?.forEach(parcela => {
          const lancamento = lancamentos?.find(l => l.parcela_receber_id === parcela.id);
          const movimentacao = lancamento 
            ? movimentacoes?.find(m => m.lancamento_id === lancamento.id && m.conciliado)
            : null;

          parcelas.push({
            id: parcela.id,
            numero_parcela: parcela.numero_parcela,
            valor: parcela.valor,
            data_vencimento: parcela.data_vencimento,
            data_pagamento: parcela.data_pagamento,
            status: parcela.status,
            conciliada_extrato: !!movimentacao,
            movimentacao_extrato: movimentacao ? {
              id: movimentacao.id,
              descricao: movimentacao.descricao,
              data_movimentacao: movimentacao.data_movimentacao,
              valor: movimentacao.valor
            } : null
          });
        });
      });

      // Processar contas a pagar com status de conciliação
      const contasPagarProcessadas: ContaPagarConciliacao[] = (contasPagar || []).map(conta => {
        const lancamento = lancamentos?.find(l => l.conta_pagar_id === conta.id);
        const movimentacao = lancamento 
          ? movimentacoes?.find(m => m.lancamento_id === lancamento.id && m.conciliado)
          : null;

        return {
          id: conta.id,
          descricao: conta.descricao,
          valor: conta.valor,
          data_vencimento: conta.data_vencimento,
          data_pagamento: conta.data_pagamento,
          status: conta.status,
          fornecedor: conta.fornecedor,
          categoria_nome: (conta.categorias_financeiras as any)?.nome || null,
          conciliada_extrato: !!movimentacao,
          movimentacao_extrato: movimentacao ? {
            id: movimentacao.id,
            descricao: movimentacao.descricao,
            data_movimentacao: movimentacao.data_movimentacao,
            valor: movimentacao.valor
          } : null
        };
      });

      // Processar todas as movimentações relacionadas
      const movimentacoesProcessadas: MovimentacaoConciliada[] = (movimentacoes || []).map(mov => {
        const lancamento = lancamentos?.find(l => l.id === mov.lancamento_id);
        let origem: 'recebimento' | 'pagamento' | 'manual' = 'manual';
        let parcela_numero: number | undefined;
        let conta_descricao: string | undefined;

        if (lancamento?.parcela_receber_id) {
          origem = 'recebimento';
          const parcela = parcelas.find(p => p.id === lancamento.parcela_receber_id);
          parcela_numero = parcela?.numero_parcela;
        } else if (lancamento?.conta_pagar_id) {
          origem = 'pagamento';
          const conta = contasPagarProcessadas.find(c => c.id === lancamento.conta_pagar_id);
          conta_descricao = conta?.descricao;
        }

        return {
          id: mov.id,
          descricao: mov.descricao,
          valor: mov.valor,
          tipo: mov.tipo,
          data_movimentacao: mov.data_movimentacao,
          conciliado: mov.conciliado || false,
          ignorado: mov.ignorado || false,
          lancamento_id: mov.lancamento_id,
          lancamento: lancamento ? {
            id: lancamento.id,
            descricao: lancamento.descricao,
            tipo: lancamento.tipo,
            parcela_receber_id: lancamento.parcela_receber_id,
            conta_pagar_id: lancamento.conta_pagar_id
          } : null,
          origem,
          parcela_numero,
          conta_descricao
        };
      });

      // Calcular comparativo
      const valorOrcamento = orcamento?.total_com_desconto ?? orcamento?.total_geral ?? 0;
      const totalRecebido = parcelas
        .filter(p => p.status === 'pago')
        .reduce((acc, p) => acc + p.valor, 0);
      const totalRecebidoConciliado = parcelas
        .filter(p => p.conciliada_extrato)
        .reduce((acc, p) => acc + p.valor, 0);
      const totalCustos = orcamento?.custo_total ?? 0;
      const totalCustosPagos = contasPagarProcessadas
        .filter(c => c.status === 'pago')
        .reduce((acc, c) => acc + c.valor, 0);
      const totalCustosConciliados = contasPagarProcessadas
        .filter(c => c.conciliada_extrato)
        .reduce((acc, c) => acc + c.valor, 0);

      const margemProjetada = valorOrcamento > 0 
        ? ((valorOrcamento - totalCustos) / valorOrcamento) * 100 
        : 0;
      const margemRealizada = totalRecebido > 0 
        ? ((totalRecebido - totalCustosPagos) / totalRecebido) * 100 
        : 0;

      const comparativo: ComparativoConciliacao = {
        valorOrcamento,
        totalRecebido,
        totalRecebidoConciliado,
        totalCustos,
        totalCustosPagos,
        totalCustosConciliados,
        margemProjetada,
        margemRealizada,
        diferencaRecebimentos: totalRecebido - totalRecebidoConciliado,
        diferencaCustos: totalCustosPagos - totalCustosConciliados
      };

      // Gerar alertas
      const alertas: AlertaConciliacao[] = [];

      // Parcelas pagas mas não conciliadas
      const parcelasNaoConciliadas = parcelas.filter(p => p.status === 'pago' && !p.conciliada_extrato);
      if (parcelasNaoConciliadas.length > 0) {
        alertas.push({
          tipo: 'warning',
          mensagem: `${parcelasNaoConciliadas.length} parcela(s) paga(s) não encontrada(s) no extrato bancário`,
          acao: 'Verificar conciliação'
        });
      }

      // Custos pagos mas não conciliados
      const custosNaoConciliados = contasPagarProcessadas.filter(c => c.status === 'pago' && !c.conciliada_extrato);
      if (custosNaoConciliados.length > 0) {
        alertas.push({
          tipo: 'warning',
          mensagem: `${custosNaoConciliados.length} custo(s) pago(s) não encontrado(s) no extrato bancário`,
          acao: 'Verificar conciliação'
        });
      }

      // Parcelas atrasadas
      const parcelasAtrasadas = parcelas.filter(p => p.status === 'atrasado');
      if (parcelasAtrasadas.length > 0) {
        alertas.push({
          tipo: 'error',
          mensagem: `${parcelasAtrasadas.length} parcela(s) em atraso`,
          acao: 'Cobrar cliente'
        });
      }

      // Custos pendentes
      const custosPendentes = contasPagarProcessadas.filter(c => c.status === 'pendente' || c.status === 'atrasado');
      if (custosPendentes.length > 0) {
        const valorPendente = custosPendentes.reduce((acc, c) => acc + c.valor, 0);
        alertas.push({
          tipo: 'info',
          mensagem: `R$ ${valorPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em custos pendentes`,
          acao: 'Pagar custos'
        });
      }

      // Determinar status geral de conciliação
      let statusConciliacao: 'completo' | 'parcial' | 'pendente' = 'pendente';
      const totalParcelas = parcelas.length;
      const parcelasConciliadas = parcelas.filter(p => p.conciliada_extrato).length;
      const totalContas = contasPagarProcessadas.length;
      const contasConciliadas = contasPagarProcessadas.filter(c => c.conciliada_extrato).length;

      if (totalParcelas === 0 && totalContas === 0) {
        statusConciliacao = 'pendente';
      } else if (parcelasConciliadas === totalParcelas && contasConciliadas === totalContas) {
        statusConciliacao = 'completo';
      } else if (parcelasConciliadas > 0 || contasConciliadas > 0) {
        statusConciliacao = 'parcial';
      }

      return {
        orcamento,
        parcelas,
        contasPagar: contasPagarProcessadas,
        movimentacoes: movimentacoesProcessadas,
        comparativo,
        alertas,
        statusConciliacao
      };
    },
    enabled: !!orcamentoId
  });
}
