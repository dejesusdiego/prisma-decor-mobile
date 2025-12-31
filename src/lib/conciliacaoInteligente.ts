// Funções de cálculo de similaridade para conciliação inteligente

/**
 * Normaliza texto removendo acentos e caracteres especiais
 */
export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

/**
 * Calcula similaridade entre dois textos baseado em palavras coincidentes
 */
export function calcularSimilaridadeTexto(texto1: string, texto2: string): number {
  const t1 = normalizarTexto(texto1);
  const t2 = normalizarTexto(texto2);
  
  // Match exato ou substring
  if (t1.includes(t2) || t2.includes(t1)) {
    return 100;
  }
  
  const palavras1 = t1.split(/\s+/).filter(p => p.length > 2);
  const palavras2 = t2.split(/\s+/).filter(p => p.length > 2);
  
  if (palavras1.length === 0 || palavras2.length === 0) return 0;
  
  let coincidencias = 0;
  for (const p1 of palavras1) {
    for (const p2 of palavras2) {
      if (p1.includes(p2) || p2.includes(p1)) {
        coincidencias++;
        break;
      }
    }
  }
  
  return Math.round((coincidencias / Math.max(palavras1.length, palavras2.length)) * 100);
}

/**
 * Calcula similaridade de valor com tolerância percentual
 * Tolerância padrão de 5% para cobrir taxas bancárias
 */
export function calcularSimilaridadeValor(valor1: number, valor2: number, tolerancia = 0.05): number {
  if (valor1 === 0 && valor2 === 0) return 100;
  if (valor1 === 0 || valor2 === 0) return 0;
  
  const diferenca = Math.abs(valor1 - valor2);
  const maiorValor = Math.max(valor1, valor2);
  const percentualDiferenca = diferenca / maiorValor;
  
  // Match exato
  if (diferenca === 0) return 100;
  
  // Dentro da tolerância
  if (percentualDiferenca <= tolerancia) {
    // Score proporcional: 100 para exato, diminui linearmente até o limite da tolerância
    return Math.round(100 - (percentualDiferenca / tolerancia) * 30);
  }
  
  // Fora da tolerância mas ainda pode ser relevante
  if (percentualDiferenca <= 0.20) {
    return Math.round(50 - (percentualDiferenca - tolerancia) * 100);
  }
  
  return 0;
}

/**
 * Calcula similaridade de data baseado em proximidade
 * Quanto mais próximas as datas, maior o score
 */
export function calcularSimilaridadeData(data1: string, data2: string): number {
  const d1 = new Date(data1);
  const d2 = new Date(data2);
  
  // Diferença em dias
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Mesma data = 100
  if (diffDays === 0) return 100;
  // Até 3 dias = 90-100
  if (diffDays <= 3) return 100 - diffDays * 3;
  // Até 7 dias = 80-90
  if (diffDays <= 7) return 90 - (diffDays - 3) * 2;
  // Até 15 dias = 60-80
  if (diffDays <= 15) return 80 - (diffDays - 7) * 2;
  // Até 30 dias = 30-60
  if (diffDays <= 30) return 60 - (diffDays - 15);
  // Mais de 30 dias = score decrescente
  if (diffDays <= 60) return Math.max(0, 30 - (diffDays - 30));
  
  return 0;
}

export interface ScoreConciliacao {
  scoreNome: number;
  scoreValor: number;
  scoreData: number;
  scoreTotal: number;
  confianca: 'alta' | 'media' | 'baixa';
}

/**
 * Calcula score combinado de conciliação com pesos:
 * - Nome: 50%
 * - Valor: 35%
 * - Data: 15%
 */
export function calcularScoreCombinado(
  descricaoLancamento: string,
  nomeCliente: string,
  valorLancamento: number,
  valorOrcamento: number,
  dataLancamento: string,
  dataOrcamento: string
): ScoreConciliacao {
  const scoreNome = calcularSimilaridadeTexto(descricaoLancamento, nomeCliente);
  const scoreValor = calcularSimilaridadeValor(valorLancamento, valorOrcamento);
  const scoreData = calcularSimilaridadeData(dataLancamento, dataOrcamento);
  
  // Pesos: nome 50%, valor 35%, data 15%
  const scoreTotal = Math.round(
    scoreNome * 0.50 +
    scoreValor * 0.35 +
    scoreData * 0.15
  );
  
  // Determinar nível de confiança
  let confianca: 'alta' | 'media' | 'baixa';
  if (scoreTotal >= 70 && scoreNome >= 60 && scoreValor >= 70) {
    confianca = 'alta';
  } else if (scoreTotal >= 50 && (scoreNome >= 50 || scoreValor >= 80)) {
    confianca = 'media';
  } else {
    confianca = 'baixa';
  }
  
  return {
    scoreNome,
    scoreValor,
    scoreData,
    scoreTotal,
    confianca
  };
}

/**
 * Extrai possíveis nomes de cliente de uma descrição de extrato bancário
 */
export function extrairNomesDeDescricao(descricao: string): string[] {
  const normalizada = normalizarTexto(descricao);
  
  // Padrões comuns em extratos
  const padroes = [
    /pix\s+(?:de\s+)?([a-z\s]+?)(?:\s+\d|$)/i,
    /ted\s+(?:de\s+)?([a-z\s]+?)(?:\s+\d|$)/i,
    /doc\s+(?:de\s+)?([a-z\s]+?)(?:\s+\d|$)/i,
    /transf\s+(?:de\s+)?([a-z\s]+?)(?:\s+\d|$)/i,
    /receb\s+(?:de\s+)?([a-z\s]+?)(?:\s+\d|$)/i,
    /pgto\s+(?:de\s+)?([a-z\s]+?)(?:\s+\d|$)/i,
  ];
  
  const nomes: string[] = [];
  
  for (const padrao of padroes) {
    const match = normalizada.match(padrao);
    if (match && match[1]) {
      const nome = match[1].trim();
      if (nome.length > 3 && !nomes.includes(nome)) {
        nomes.push(nome);
      }
    }
  }
  
  // Se não encontrou padrões, usar a descrição completa
  if (nomes.length === 0) {
    nomes.push(normalizada);
  }
  
  return nomes;
}
