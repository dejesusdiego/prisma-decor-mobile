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
    const dtPostedMatch = transactionBlock.match(/<DTPOSTED>(\d{8})/);
    const trnAmtMatch = transactionBlock.match(/<TRNAMT>([^<\n]+)/);
    const fitIdMatch = transactionBlock.match(/<FITID>([^<\n]+)/);
    const memoMatch = transactionBlock.match(/<MEMO>([^<\n]+)/);
    const nameMatch = transactionBlock.match(/<NAME>([^<\n]+)/);
    const checkNumMatch = transactionBlock.match(/<CHECKNUM>([^<\n]+)/);

    if (dtPostedMatch && trnAmtMatch) {
      const valorSigned = parseMoney(trnAmtMatch[1]);
      if (valorSigned !== null) {
        const data = formatOFXDate(dtPostedMatch[1]);
        const descricao = memoMatch?.[1]?.trim() || nameMatch?.[1]?.trim() || 'Sem descrição';

        movimentacoes.push({
          data_movimentacao: data,
          descricao,
          valor: Math.abs(valorSigned),
          tipo: valorSigned >= 0 ? 'credito' : 'debito',
          numero_documento: fitIdMatch?.[1] || checkNumMatch?.[1],
        });
      }
    }
  }

  return {
    banco: bancoMatch?.[1]?.trim(),
    conta: contaMatch?.[1]?.trim(),
    data_inicio: dtStartMatch ? formatOFXDate(dtStartMatch[1]) : undefined,
    data_fim: dtEndMatch ? formatOFXDate(dtEndMatch[1]) : undefined,
    movimentacoes,
  };
}

/**
 * Parser para arquivos CSV de extrato bancário
 * Suporta formatos comuns:
 * - Data;Descrição;Valor
 * - Data;Valor;Saldo
 * - Data;Débito;Crédito;Descrição
 */
export function parseCSV(content: string): DadosExtrato {
  const movimentacoes: MovimentacaoExtrato[] = [];
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { movimentacoes };
  }

  // Detectar separador
  const separator = lines[0].includes(';') ? ';' : ',';

  // Header (quando existir)
  const firstParts = lines[0].split(separator).map((p) => p.trim().replace(/^"|"$/g, ''));
  const hasHeader = firstParts.some((p) => /^(data|date)$/i.test(p)) || firstParts.join(' ').toLowerCase().includes('descr');
  const header = hasHeader ? firstParts.map((p) => p.toLowerCase()) : null;
  const startIndex = hasHeader ? 1 : 0;

  // Mapear índices pelo header (quando possível)
  const idxData = 0;
  const idxDescricaoFromHeader = header
    ? header.findIndex((h) => h.includes('descr') || h.includes('hist') || h.includes('memo') || h.includes('lanç') || h.includes('lanc') || h.includes('descricao'))
    : -1;

  const idxValorFromHeader = header
    ? header.findIndex((h) => h === 'valor' || h.includes('valor') || h.includes('amount') || h.includes('value'))
    : -1;

  const idxDebito = header ? header.findIndex((h) => h.includes('deb')) : -1;
  const idxCredito = header ? header.findIndex((h) => h.includes('cr	dito') || h.includes('credito')) : -1;

  let dataInicio: string | undefined;
  let dataFim: string | undefined;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const parts = line.split(separator).map((p) => p.trim().replace(/^"|"$/g, ''));
    if (parts.length < 2) continue;

    const data = parseCSVDate(parts[idxData]);
    if (!data) continue;

    // Determinar valor
    let valorSigned: number | null = null;
    let valorIndex: number | null = idxValorFromHeader >= 0 ? idxValorFromHeader : null;

    // Caso Débito/Crédito em colunas separadas
    if (idxDebito >= 0 && idxCredito >= 0 && parts[idxDebito] != null && parts[idxCredito] != null) {
      const deb = parseMoney(parts[idxDebito]) ?? 0;
      const cred = parseMoney(parts[idxCredito]) ?? 0;
      valorSigned = cred - deb;
      valorIndex = null;
    } else {
      if (valorIndex === null) {
        // Heurística: escolher a primeira coluna numérica (exceto data), priorizando número com sinal ou com 2 casas decimais
        const candidates = parts
          .map((raw, idx) => ({ idx, raw, val: idx === idxData ? null : parseMoney(raw) }))
          .filter((c): c is { idx: number; raw: string; val: number } => c.val !== null);

        const preferred =
          candidates.find((c) => /[+-]/.test(c.raw) || /[\.,]\d{2}$/.test(c.raw.replace(/\s/g, '')));

        valorIndex = (preferred ?? candidates[0])?.idx ?? null;
      }

      valorSigned = valorIndex !== null ? parseMoney(parts[valorIndex]) : null;
    }

    // Validar valor
    if (valorSigned === null || !Number.isFinite(valorSigned)) continue;

    // Proteção contra parse errado (ex: saldo/lixo virando exponencial enorme)
    if (Math.abs(valorSigned) > 1e9) continue;

    if (!dataInicio || data < dataInicio) dataInicio = data;
    if (!dataFim || data > dataFim) dataFim = data;

    // Determinar descrição
    let descricao = 'Sem descrição';
    if (idxDescricaoFromHeader >= 0 && parts[idxDescricaoFromHeader]) {
      descricao = parts[idxDescricaoFromHeader];
    } else {
      // Heurística: pegar a primeira coluna não-numérica diferente da data e do valor
      for (let j = 0; j < parts.length; j++) {
        if (j === idxData) continue;
        if (valorIndex !== null && j === valorIndex) continue;
        if (parseMoney(parts[j]) === null && parts[j]) {
          descricao = parts[j];
          break;
        }
      }
    }

    movimentacoes.push({
      data_movimentacao: data,
      descricao,
      valor: Math.abs(valorSigned),
      tipo: valorSigned >= 0 ? 'credito' : 'debito',
    });
  }

  return {
    data_inicio: dataInicio,
    data_fim: dataFim,
    movimentacoes,
  };
}

function parseMoney(raw: string): number | null {
  const cleaned = (raw ?? '')
    .toString()
    .trim()
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, '')
    .replace(/[R$]/g, '')
    .replace(/[^0-9,\.\-+Ee]/g, '');

  if (!cleaned) return null;

  let normalized = cleaned;
  const hasComma = normalized.includes(',');
  const hasDot = normalized.includes('.');

  // Padrão BR: 1.234,56
  if (hasComma && hasDot) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else if (hasComma && !hasDot) {
    normalized = normalized.replace(',', '.');
  }

  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return n;
}

function formatOFXDate(dateStr: string): string {
  // YYYYMMDD -> YYYY-MM-DD
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

function parseCSVDate(dateStr: string): string | null {
  const s = (dateStr ?? '').trim();

  // DD/MM/YYYY
  const brMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2].padStart(2, '0')}-${brMatch[1].padStart(2, '0')}`;
  }

  // DD-MM-YYYY
  const brDashMatch = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (brDashMatch) {
    return `${brDashMatch[3]}-${brDashMatch[2].padStart(2, '0')}-${brDashMatch[1].padStart(2, '0')}`;
  }

  // DD.MM.YYYY
  const brDotMatch = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (brDotMatch) {
    return `${brDotMatch[3]}-${brDotMatch[2].padStart(2, '0')}-${brDotMatch[1].padStart(2, '0')}`;
  }

  // YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return s;

  // YYYY/MM/DD
  const isoSlashMatch = s.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (isoSlashMatch) return `${isoSlashMatch[1]}-${isoSlashMatch[2]}-${isoSlashMatch[3]}`;

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
