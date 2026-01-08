import { supabase } from '@/integrations/supabase/client';
import { getValorEfetivo, getPercentualPago, calcularValorRecebido, calcularValorAReceber } from './calculosStatus';
import { addMonths, format } from 'date-fns';

// Tolerância para considerar pagamento completo (0.5% ou R$ 5)
const TOLERANCIA_PERCENTUAL = 99.5;

// Tipos para integração
export interface OrcamentoBase {
  id: string;
  codigo: string;
  cliente_nome: string;
  cliente_telefone: string;
  status: string;
  total_geral: number | null;
  total_com_desconto: number | null;
  custo_total: number | null;
}

export interface ContaReceberBase {
  id: string;
  orcamento_id: string | null;
  valor_total: number;
  valor_pago: number;
  status: string;
}

export interface ContaPagarBase {
  id: string;
  orcamento_id: string | null;
  valor: number;
  status: string;
  descricao: string;
}

export interface ComissaoBase {
  id: string;
  orcamento_id: string | null;
  valor_comissao: number;
  status: string;
}

export interface RentabilidadeOrcamento {
  valorOrcamento: number;
  valorRecebido: number;
  valorPendente: number;
  custoTotal: number;
  custosPagos: number;
  custosPendentes: number;
  comissoesTotal: number;
  comissoesPagas: number;
  lucroProjetado: number;
  lucroRealizado: number;
  margemLucro: number;
}

export interface PendenciasFinanceiras {
  temContasReceber: boolean;
  temContasPagar: boolean;
  valorReceberPendente: number;
  valorPagarPendente: number;
  parcelasAtrasadas: number;
  contasAtrasadas: number;
}

// =============================================================================
// FUNÇÕES DE CÁLCULO
// =============================================================================

/**
 * Calcula a rentabilidade completa de um orçamento
 */
export function calcularRentabilidade(
  orcamento: OrcamentoBase,
  contasReceber: ContaReceberBase[],
  contasPagar: ContaPagarBase[],
  comissoes: ComissaoBase[]
): RentabilidadeOrcamento {
  const valorOrcamento = getValorEfetivo({
    total_geral: orcamento.total_geral || 0,
    total_com_desconto: orcamento.total_com_desconto
  });

  // Calcular valores de contas a receber vinculadas
  const contasDoOrcamento = contasReceber.filter(c => c.orcamento_id === orcamento.id);
  const valorRecebido = contasDoOrcamento.reduce((acc, c) => acc + (c.valor_pago || 0), 0);
  const valorPendente = contasDoOrcamento.reduce((acc, c) => acc + (c.valor_total - c.valor_pago), 0);

  // Calcular custos (contas a pagar)
  const custosDoOrcamento = contasPagar.filter(c => c.orcamento_id === orcamento.id);
  const custoTotal = orcamento.custo_total || 0;
  const custosPagos = custosDoOrcamento
    .filter(c => c.status === 'pago')
    .reduce((acc, c) => acc + c.valor, 0);
  const custosPendentes = custosDoOrcamento
    .filter(c => c.status !== 'pago')
    .reduce((acc, c) => acc + c.valor, 0);

  // Calcular comissões
  const comissoesDoOrcamento = comissoes.filter(c => c.orcamento_id === orcamento.id);
  const comissoesTotal = comissoesDoOrcamento.reduce((acc, c) => acc + c.valor_comissao, 0);
  const comissoesPagas = comissoesDoOrcamento
    .filter(c => c.status === 'pago')
    .reduce((acc, c) => acc + c.valor_comissao, 0);

  // Lucro projetado = valor orçamento - custos totais - comissões
  const lucroProjetado = valorOrcamento - custoTotal - comissoesTotal;
  
  // Lucro realizado = valor recebido - custos pagos - comissões pagas
  const lucroRealizado = valorRecebido - custosPagos - comissoesPagas;
  
  // Margem de lucro percentual
  const margemLucro = valorOrcamento > 0 ? (lucroProjetado / valorOrcamento) * 100 : 0;

  return {
    valorOrcamento,
    valorRecebido,
    valorPendente,
    custoTotal,
    custosPagos,
    custosPendentes,
    comissoesTotal,
    comissoesPagas,
    lucroProjetado,
    lucroRealizado,
    margemLucro
  };
}

// =============================================================================
// FUNÇÕES DE GERAÇÃO DE CONTAS
// =============================================================================

/**
 * Gera conta a receber a partir de um orçamento
 */
export async function gerarContaReceberOrcamento(
  orcamento: OrcamentoBase,
  numeroParcelas: number,
  dataPrimeiraParcela: Date,
  userId: string,
  formaPagamentoId?: string,
  observacoes?: string,
  organizationId?: string
): Promise<{ success: boolean; contaId?: string; error?: string }> {
  try {
    // Validação de entrada
    if (!numeroParcelas || numeroParcelas < 1) {
      return { success: false, error: 'Número de parcelas deve ser pelo menos 1' };
    }
    
    const valorTotal = getValorEfetivo({
      total_geral: orcamento.total_geral || 0,
      total_com_desconto: orcamento.total_com_desconto
    });

    // Criar conta a receber
    const contasTable = supabase.from('contas_receber') as any;
    const { data: conta, error: contaError } = await contasTable
      .insert({
        orcamento_id: orcamento.id,
        cliente_nome: orcamento.cliente_nome,
        cliente_telefone: orcamento.cliente_telefone,
        descricao: `Orçamento ${orcamento.codigo}`,
        valor_total: valorTotal,
        valor_pago: 0,
        numero_parcelas: numeroParcelas,
        data_vencimento: format(dataPrimeiraParcela, 'yyyy-MM-dd'),
        status: 'pendente',
        observacoes,
        created_by_user_id: userId,
        organization_id: organizationId || null
      })
      .select()
      .single();

    if (contaError) throw contaError;

    // Criar parcelas
    const valorParcela = valorTotal / numeroParcelas;
    const parcelas = Array.from({ length: numeroParcelas }, (_, i) => ({
      conta_receber_id: conta.id,
      numero_parcela: i + 1,
      valor: valorParcela,
      data_vencimento: format(addMonths(dataPrimeiraParcela, i), 'yyyy-MM-dd'),
      status: 'pendente',
      forma_pagamento_id: formaPagamentoId || null
    }));

    const { error: parcelasError } = await supabase
      .from('parcelas_receber')
      .insert(parcelas);

    if (parcelasError) throw parcelasError;

    return { success: true, contaId: conta.id };
  } catch (error: any) {
    console.error('Erro ao gerar conta a receber:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Gera contas a pagar baseado nos custos do orçamento
 */
export async function gerarContasPagarOrcamento(
  orcamentoId: string,
  custos: { descricao: string; valor: number; categoriaId?: string; fornecedor?: string }[],
  dataVencimento: Date,
  userId: string,
  organizationId?: string
): Promise<{ success: boolean; contasIds?: string[]; error?: string }> {
  try {
    const contasPagar = custos.map(custo => ({
      orcamento_id: orcamentoId,
      descricao: custo.descricao,
      valor: custo.valor,
      data_vencimento: format(dataVencimento, 'yyyy-MM-dd'),
      status: 'pendente',
      categoria_id: custo.categoriaId || null,
      fornecedor: custo.fornecedor || null,
      created_by_user_id: userId,
      organization_id: organizationId || null
    }));

    const contasTable = supabase.from('contas_pagar') as any;
    const { data, error } = await contasTable
      .insert(contasPagar)
      .select();

    if (error) throw error;

    return { success: true, contasIds: data.map((c: any) => c.id) };
  } catch (error: any) {
    console.error('Erro ao gerar contas a pagar:', error);
    return { success: false, error: error.message };
  }
}

// =============================================================================
// FUNÇÕES DE CONSULTA
// =============================================================================

/**
 * Verifica pendências financeiras de um orçamento
 */
export async function verificarPendenciasFinanceiras(
  orcamentoId: string
): Promise<PendenciasFinanceiras> {
  const resultado: PendenciasFinanceiras = {
    temContasReceber: false,
    temContasPagar: false,
    valorReceberPendente: 0,
    valorPagarPendente: 0,
    parcelasAtrasadas: 0,
    contasAtrasadas: 0
  };

  try {
    // Buscar contas a receber
    const { data: contasReceber } = await supabase
      .from('contas_receber')
      .select('id, valor_total, valor_pago, status')
      .eq('orcamento_id', orcamentoId);

    if (contasReceber && contasReceber.length > 0) {
      resultado.temContasReceber = true;
      resultado.valorReceberPendente = contasReceber.reduce(
        (acc, c) => acc + (c.valor_total - c.valor_pago), 0
      );

      // Buscar parcelas atrasadas
      const contaIds = contasReceber.map(c => c.id);
      const { data: parcelas } = await supabase
        .from('parcelas_receber')
        .select('status')
        .in('conta_receber_id', contaIds)
        .eq('status', 'atrasado');

      resultado.parcelasAtrasadas = parcelas?.length || 0;
    }

    // Buscar contas a pagar
    const { data: contasPagar } = await supabase
      .from('contas_pagar')
      .select('valor, status')
      .eq('orcamento_id', orcamentoId);

    if (contasPagar && contasPagar.length > 0) {
      resultado.temContasPagar = true;
      resultado.valorPagarPendente = contasPagar
        .filter(c => c.status !== 'pago')
        .reduce((acc, c) => acc + c.valor, 0);
      resultado.contasAtrasadas = contasPagar.filter(c => c.status === 'atrasado').length;
    }

  } catch (error) {
    console.error('Erro ao verificar pendências:', error);
  }

  return resultado;
}

/**
 * Busca dados financeiros completos de um orçamento
 */
export async function buscarDadosFinanceirosOrcamento(orcamentoId: string) {
  try {
    const [contasReceberRes, contasPagarRes, comissoesRes] = await Promise.all([
      supabase
        .from('contas_receber')
        .select(`
          *,
          parcelas_receber (*)
        `)
        .eq('orcamento_id', orcamentoId),
      supabase
        .from('contas_pagar')
        .select('*')
        .eq('orcamento_id', orcamentoId),
      supabase
        .from('comissoes')
        .select('*')
        .eq('orcamento_id', orcamentoId)
    ]);

    return {
      contasReceber: contasReceberRes.data || [],
      contasPagar: contasPagarRes.data || [],
      comissoes: comissoesRes.data || [],
      errors: {
        contasReceber: contasReceberRes.error,
        contasPagar: contasPagarRes.error,
        comissoes: comissoesRes.error
      }
    };
  } catch (error) {
    console.error('Erro ao buscar dados financeiros:', error);
    return {
      contasReceber: [],
      contasPagar: [],
      comissoes: [],
      errors: { geral: error }
    };
  }
}

/**
 * Atualiza o status do orçamento baseado nos pagamentos
 */
export async function sincronizarStatusOrcamento(
  orcamentoId: string,
  valorTotal: number,
  valorPago: number
): Promise<string | null> {
  if (valorTotal <= 0) return null;

  const percentual = (valorPago / valorTotal) * 100;
  let novoStatus: string | null = null;

  // Usar tolerância para considerar pago (99.5% ou mais)
  if (percentual >= TOLERANCIA_PERCENTUAL) {
    novoStatus = 'pago';
  } else if (percentual >= 60) {
    novoStatus = 'pago_60';
  } else if (percentual >= 50) {
    novoStatus = 'pago_parcial';
  } else if (percentual >= 40) {
    novoStatus = 'pago_40';
  }

  if (novoStatus) {
    const { error } = await supabase
      .from('orcamentos')
      .update({ status: novoStatus })
      .eq('id', orcamentoId)
      .not('status', 'in', '("cancelado","pago")');

    if (error) {
      console.error('Erro ao sincronizar status:', error);
      return null;
    }
  }

  return novoStatus;
}
