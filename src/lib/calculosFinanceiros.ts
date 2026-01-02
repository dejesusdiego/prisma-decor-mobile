/**
 * Funções utilitárias para cálculos financeiros
 */

// Configurações padrão de tolerância
const TOLERANCIA_VALOR_PADRAO = 5.00; // R$ 5,00
const TOLERANCIA_PERCENTUAL_PADRAO = 0.5; // 0,5%

/**
 * Verifica se um pagamento está completo considerando tolerância para pequenas diferenças
 * A conta será considerada "paga" se a diferença for menor que AMBOS os limites
 */
export function isPagamentoCompleto(
  valorTotal: number,
  valorPago: number,
  toleranciaValor: number = TOLERANCIA_VALOR_PADRAO,
  toleranciaPercent: number = TOLERANCIA_PERCENTUAL_PADRAO
): boolean {
  if (valorTotal <= 0) return true;
  if (valorPago >= valorTotal) return true;
  
  const diferenca = valorTotal - valorPago;
  const percentualDiferenca = (diferenca / valorTotal) * 100;
  
  // Considera pago se a diferença for menor que a tolerância em valor E percentual
  return diferenca <= toleranciaValor && percentualDiferenca <= toleranciaPercent;
}

/**
 * Calcula o status dinâmico de uma conta/parcela baseado na data de vencimento
 * Retorna 'atrasado' se vencida e não paga, caso contrário retorna o status original
 */
export function calcularStatusDinamico(
  statusOriginal: string,
  dataVencimento: string | Date
): string {
  // Se já está pago, não muda
  if (statusOriginal === 'pago') return 'pago';
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const vencimento = new Date(dataVencimento);
  vencimento.setHours(0, 0, 0, 0);
  
  // Se vencido e não pago, está atrasado
  if (vencimento < hoje) {
    return 'atrasado';
  }
  
  return statusOriginal;
}

/**
 * Calcula a diferença entre valor total e valor pago
 */
export function calcularDiferenca(valorTotal: number, valorPago: number): number {
  return Math.max(0, valorTotal - valorPago);
}

/**
 * Formata a diferença para exibição (ex: "R$ 0,47 de diferença")
 */
export function formatarDiferenca(valorTotal: number, valorPago: number): string {
  const diferenca = calcularDiferenca(valorTotal, valorPago);
  if (diferenca === 0) return '';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(diferenca);
}
