export interface MovimentacaoExtrato {
  data_movimentacao: string;
  descricao: string;
  valor: number;
  tipo: 'credito' | 'debito';
  numero_documento?: string;
}

export interface DadosExtrato {
  banco?: string;
  conta?: string;
  data_inicio?: string;
  data_fim?: string;
  movimentacoes: MovimentacaoExtrato[];
}

/**
 * Parser para arquivos OFX (Open Financial Exchange)
 * Formato padrão bancário para extratos
 */
export function parseOFX(content: string): DadosExtrato {
  const movimentacoes: MovimentacaoExtrato[] = [];
  
  // Extrair informações do banco
  const bancoMatch = content.match(/<ORG>([^<]+)/);
  const contaMatch = content.match(/<ACCTID>([^<]+)/);
  
  // Extrair período
  const dtStartMatch = content.match(/<DTSTART>(\d{8})/);
  const dtEndMatch = content.match(/<DTEND>(\d{8})/);
  
  // Extrair transações
  const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;
  
  while ((match = transactionRegex.exec(content)) !== null) {
    const transactionBlock = match[1];
    
    // Extrair campos da transação
    const trnTypeMatch = transactionBlock.match(/<TRNTYPE>([^<\n]+)/);
    const dtPostedMatch = transactionBlock.match(/<DTPOSTED>(\d{8})/);
    const trnAmtMatch = transactionBlock.match(/<TRNAMT>([-\d.,]+)/);
    const fitIdMatch = transactionBlock.match(/<FITID>([^<\n]+)/);
    const memoMatch = transactionBlock.match(/<MEMO>([^<\n]+)/);
    const nameMatch = transactionBlock.match(/<NAME>([^<\n]+)/);
    const checkNumMatch = transactionBlock.match(/<CHECKNUM>([^<\n]+)/);
    
    if (dtPostedMatch && trnAmtMatch) {
      const valorStr = trnAmtMatch[1].replace(',', '.');
      const valor = parseFloat(valorStr);
      
      // Só adicionar se o valor for válido
      if (!isNaN(valor)) {
        const data = formatOFXDate(dtPostedMatch[1]);
        const descricao = memoMatch?.[1]?.trim() || nameMatch?.[1]?.trim() || 'Sem descrição';
        
        movimentacoes.push({
          data_movimentacao: data,
          descricao: descricao,
          valor: Math.abs(valor),
          tipo: valor >= 0 ? 'credito' : 'debito',
          numero_documento: fitIdMatch?.[1] || checkNumMatch?.[1]
        });
      }
    }
  }
  
  return {
    banco: bancoMatch?.[1]?.trim(),
    conta: contaMatch?.[1]?.trim(),
    data_inicio: dtStartMatch ? formatOFXDate(dtStartMatch[1]) : undefined,
    data_fim: dtEndMatch ? formatOFXDate(dtEndMatch[1]) : undefined,
    movimentacoes
  };
}

/**
 * Parser para arquivos CSV de extrato bancário
 * Espera formato: Data;Descrição;Valor ou Data,Descrição,Valor
 */
export function parseCSV(content: string): DadosExtrato {
  const movimentacoes: MovimentacaoExtrato[] = [];
  const lines = content.trim().split('\n');
  
  // Detectar separador
  const separator = lines[0].includes(';') ? ';' : ',';
  
  // Pular cabeçalho se existir
  const startIndex = lines[0].toLowerCase().includes('data') ? 1 : 0;
  
  let dataInicio: string | undefined;
  let dataFim: string | undefined;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(separator).map(p => p.trim().replace(/^"|"$/g, ''));
    
    if (parts.length >= 3) {
      const data = parseCSVDate(parts[0]);
      const descricao = parts[1];
      const valorStr = parts[2].replace(/[R$\s]/g, '').replace('.', '').replace(',', '.');
      const valor = parseFloat(valorStr);
      
      if (data && !isNaN(valor)) {
        if (!dataInicio || data < dataInicio) dataInicio = data;
        if (!dataFim || data > dataFim) dataFim = data;
        
        movimentacoes.push({
          data_movimentacao: data,
          descricao: descricao,
          valor: Math.abs(valor),
          tipo: valor >= 0 ? 'credito' : 'debito'
        });
      }
    }
  }
  
  return {
    data_inicio: dataInicio,
    data_fim: dataFim,
    movimentacoes
  };
}

function formatOFXDate(dateStr: string): string {
  // YYYYMMDD -> YYYY-MM-DD
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

function parseCSVDate(dateStr: string): string | null {
  // Tentar diferentes formatos
  // DD/MM/YYYY
  const brMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2].padStart(2, '0')}-${brMatch[1].padStart(2, '0')}`;
  }
  
  // YYYY-MM-DD
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return dateStr;
  }
  
  return null;
}

/**
 * Detecta o formato do arquivo e usa o parser apropriado
 */
export function parseExtrato(content: string, filename: string): DadosExtrato {
  const lowerFilename = filename.toLowerCase();
  
  if (lowerFilename.endsWith('.ofx') || content.includes('<OFX>') || content.includes('<STMTTRN>')) {
    return parseOFX(content);
  }
  
  return parseCSV(content);
}

/**
 * Algoritmo de matching automático entre movimentações do extrato e lançamentos do sistema
 */
export interface MatchResult {
  movimentacaoId: string;
  lancamentoId: string;
  score: number;
  motivo: string;
}

export function calcularSimilaridade(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (s1 === s2) return 100;
  if (s1.includes(s2) || s2.includes(s1)) return 70;
  
  // Calcular palavras em comum
  const words1 = new Set(s1.split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(s2.split(/\s+/).filter(w => w.length > 3));
  
  let common = 0;
  words1.forEach(w => {
    if (words2.has(w)) common++;
  });
  
  const totalWords = Math.max(words1.size, words2.size);
  return totalWords > 0 ? (common / totalWords) * 50 : 0;
}

export function autoMatch(
  movimentacoes: { id: string; data: string; valor: number; descricao: string }[],
  lancamentos: { id: string; data: string; valor: number; descricao: string }[]
): MatchResult[] {
  const matches: MatchResult[] = [];
  const usedLancamentos = new Set<string>();
  
  for (const mov of movimentacoes) {
    let bestMatch: MatchResult | null = null;
    
    for (const lanc of lancamentos) {
      if (usedLancamentos.has(lanc.id)) continue;
      
      let score = 0;
      const motivos: string[] = [];
      
      // Valor exato: +100 pontos
      if (Math.abs(mov.valor - lanc.valor) < 0.01) {
        score += 100;
        motivos.push('Valor exato');
      } 
      // Valor aproximado (±5%): +50 pontos
      else if (Math.abs(mov.valor - lanc.valor) / lanc.valor <= 0.05) {
        score += 50;
        motivos.push('Valor aproximado');
      } else {
        continue; // Valores muito diferentes, pular
      }
      
      // Data igual: +50 pontos
      if (mov.data === lanc.data) {
        score += 50;
        motivos.push('Data igual');
      }
      // Data ±2 dias: +25 pontos
      else {
        const diffDays = Math.abs(
          (new Date(mov.data).getTime() - new Date(lanc.data).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays <= 2) {
          score += 25;
          motivos.push('Data próxima');
        } else if (diffDays > 7) {
          continue; // Datas muito distantes, pular
        }
      }
      
      // Descrição similar: +25 pontos
      const descScore = calcularSimilaridade(mov.descricao, lanc.descricao);
      if (descScore >= 50) {
        score += 25;
        motivos.push('Descrição similar');
      }
      
      if (score >= 100 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = {
          movimentacaoId: mov.id,
          lancamentoId: lanc.id,
          score,
          motivo: motivos.join(', ')
        };
      }
    }
    
    if (bestMatch) {
      matches.push(bestMatch);
      usedLancamentos.add(bestMatch.lancamentoId);
    }
  }
  
  return matches;
}
