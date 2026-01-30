/**
 * Funções de cálculo para orçamentos - migradas do V4
 */

export interface OrcamentoCalculo {
  total_geral?: number | null
  total_com_desconto?: number | null
  status: string
}

/**
 * Retorna o percentual já pago baseado no status do orçamento
 */
export function getPercentualPago(status: string): number {
  switch (status) {
    case 'pago_40':
      return 0.40
    case 'pago_parcial':
      return 0.50
    case 'pago_60':
      return 0.60
    case 'pago':
      return 1.0
    default:
      return 0
  }
}

/**
 * Retorna o valor efetivo do orçamento (considera desconto se houver)
 */
export function getValorEfetivo(orcamento: OrcamentoCalculo): number {
  if (orcamento.total_com_desconto && orcamento.total_com_desconto > 0) {
    return orcamento.total_com_desconto
  }
  return orcamento.total_geral ?? 0
}

/**
 * Calcula o valor já recebido de um orçamento baseado no status
 */
export function calcularValorRecebido(orcamento: OrcamentoCalculo): number {
  const valorTotal = getValorEfetivo(orcamento)
  const percentual = getPercentualPago(orcamento.status)
  return valorTotal * percentual
}

/**
 * Calcula o valor ainda a receber de um orçamento baseado no status
 */
export function calcularValorAReceber(orcamento: OrcamentoCalculo): number {
  const valorTotal = getValorEfetivo(orcamento)
  const percentual = getPercentualPago(orcamento.status)

  if (['pago_40', 'pago_parcial', 'pago_60'].includes(orcamento.status)) {
    return valorTotal * (1 - percentual)
  }

  return 0
}

/**
 * Calcula o valor total de um produto baseado em dimensões
 */
export function calcularValorProduto(
  largura: number,
  altura: number,
  quantidade: number,
  valorUnitario: number
): number {
  const area = largura * altura
  return area * quantidade * valorUnitario
}

/**
 * Aplica desconto ao subtotal
 */
export function aplicarDesconto(
  subtotal: number,
  tipoDesconto: 'percentual' | 'valor' | null,
  valorDesconto: number
): number {
  if (!tipoDesconto || valorDesconto <= 0) {
    return subtotal
  }

  if (tipoDesconto === 'percentual') {
    return subtotal * (1 - valorDesconto / 100)
  }

  return Math.max(0, subtotal - valorDesconto)
}

/**
 * Verifica se o status indica que o orçamento está em processo de pagamento
 */
export function isStatusPagamento(status: string): boolean {
  return ['pago_40', 'pago_parcial', 'pago_60', 'pago'].includes(status)
}

/**
 * Verifica se o orçamento está pendente (ainda não teve resposta do cliente)
 */
export function isStatusPendente(status: string): boolean {
  return ['rascunho', 'finalizado', 'enviado'].includes(status)
}

/**
 * Retorna a ordem do status no funil de vendas (menor = mais cedo no funil)
 */
export function getOrdemFunil(status: string): number {
  const ordem: Record<string, number> = {
    rascunho: 1,
    finalizado: 2,
    enviado: 3,
    sem_resposta: 4,
    aprovado: 5,
    pago_40: 6,
    pago_parcial: 7,
    pago_60: 8,
    pago: 9,
    recusado: 10,
    cancelado: 11,
  }
  return ordem[status] ?? 99
}

/**
 * Formata valor como moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formata valor de forma compacta (ex: R$ 1,2M)
 */
export function formatCompact(value: number): string {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1).replace('.', ',')}M`
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`
  }
  return formatCurrency(value)
}
