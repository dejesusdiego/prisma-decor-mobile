import { STATUS_CONFIG, StatusOrcamento } from './statusOrcamento';

/**
 * Retorna o percentual já pago baseado no status do orçamento
 */
export function getPercentualPago(status: string): number {
  switch (status) {
    case 'pago_40':
      return 0.40;
    case 'pago_parcial':
      return 0.50;
    case 'pago_60':
      return 0.60;
    case 'pago':
      return 1.0;
    default:
      return 0;
  }
}

/**
 * Retorna o valor efetivo do orçamento (considera desconto se houver)
 */
export function getValorEfetivo(orcamento: {
  total_geral?: number | null;
  total_com_desconto?: number | null;
}): number {
  // Prioriza valor com desconto se existir e for maior que 0
  if (orcamento.total_com_desconto && orcamento.total_com_desconto > 0) {
    return orcamento.total_com_desconto;
  }
  return orcamento.total_geral ?? 0;
}

/**
 * Calcula o valor já recebido de um orçamento baseado no status
 */
export function calcularValorRecebido(orcamento: {
  status: string;
  total_geral?: number | null;
  total_com_desconto?: number | null;
}): number {
  const valorTotal = getValorEfetivo(orcamento);
  const percentual = getPercentualPago(orcamento.status);
  return valorTotal * percentual;
}

/**
 * Calcula o valor ainda a receber de um orçamento baseado no status
 */
export function calcularValorAReceber(orcamento: {
  status: string;
  total_geral?: number | null;
  total_com_desconto?: number | null;
}): number {
  const valorTotal = getValorEfetivo(orcamento);
  const percentual = getPercentualPago(orcamento.status);
  
  // Só há valor a receber se o orçamento estiver em status de pagamento parcial
  if (['pago_40', 'pago_parcial', 'pago_60'].includes(orcamento.status)) {
    return valorTotal * (1 - percentual);
  }
  
  return 0;
}

/**
 * Verifica se o status indica que o orçamento está em processo de pagamento
 */
export function isStatusPagamento(status: string): boolean {
  return ['pago_40', 'pago_parcial', 'pago_60', 'pago'].includes(status);
}

/**
 * Verifica se o orçamento está pendente (ainda não teve resposta do cliente)
 */
export function isStatusPendente(status: string): boolean {
  return ['rascunho', 'finalizado', 'enviado'].includes(status);
}

/**
 * Retorna a ordem do status no funil de vendas (menor = mais cedo no funil)
 */
export function getOrdemFunil(status: string): number {
  const ordem: Record<string, number> = {
    'rascunho': 1,
    'finalizado': 2,
    'enviado': 3,
    'aprovado': 4,
    'pago_40': 5,
    'pago_parcial': 6,
    'pago_60': 7,
    'pago': 8,
    'recusado': 9,
    'cancelado': 10,
  };
  return ordem[status] ?? 99;
}

// Re-export formatCurrency from centralized location for backwards compatibility
import { formatCurrency } from './formatters';
export { formatCurrency };

/**
 * Formata valor de forma compacta (ex: R$ 1,2M)
 */
export function formatCompact(value: number): string {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1).replace('.', ',')}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`;
  }
  return formatCurrency(value);
}

/**
 * Retorna cor do status para usar em gráficos
 */
export function getStatusChartColor(status: string): string {
  const cores: Record<string, string> = {
    'rascunho': 'hsl(var(--muted))',
    'finalizado': 'hsl(217, 91%, 60%)',
    'enviado': 'hsl(262, 83%, 58%)',
    'aprovado': 'hsl(142, 76%, 36%)',
    'pago_40': 'hsl(45, 93%, 47%)',
    'pago_parcial': 'hsl(38, 92%, 50%)',
    'pago_60': 'hsl(25, 95%, 53%)',
    'pago': 'hsl(142, 71%, 45%)',
    'recusado': 'hsl(0, 84%, 60%)',
    'cancelado': 'hsl(0, 0%, 45%)',
  };
  return cores[status] ?? 'hsl(var(--muted))';
}
