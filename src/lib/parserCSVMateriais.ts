/**
 * Parser CSV Universal para Materiais e Serviços
 * Suporta detecção automática de separador, encoding e mapeamento de cabeçalhos
 */

export interface RegistroParsed {
  linha: number;
  dados: Record<string, string | number | boolean | null>;
  valido: boolean;
  erros: string[];
}

export interface ResultadoParse {
  registros: RegistroParsed[];
  cabecalhosOriginais: string[];
  cabecalhosMapeados: string[];
  separador: string;
  totalLinhas: number;
  totalValidos: number;
  totalErros: number;
}

// Mapeamento de cabeçalhos: CSV → campo do banco
const MAPEAMENTO_CABECALHOS: Record<string, string> = {
  // Código do item
  'codigo_item': 'codigo_item',
  'codigo': 'codigo_item',
  'cod': 'codigo_item',
  'code': 'codigo_item',
  'sku': 'codigo_item',
  'ref': 'codigo_item',
  'referencia': 'codigo_item',
  'codigoitem': 'codigo_item',
  
  // Nome
  'nome': 'nome',
  'name': 'nome',
  'descricao': 'nome',
  'description': 'nome',
  'produto': 'nome',
  'nome_modelo': 'nome_modelo',
  'nomemodelo': 'nome_modelo',
  'modelo': 'nome_modelo',
  
  // Categoria
  'categoria': 'categoria',
  'category': 'categoria',
  'tipo_produto': 'categoria',
  
  // Unidade
  'unidade': 'unidade',
  'unit': 'unidade',
  'un': 'unidade',
  'und': 'unidade',
  
  // Preços
  'preco_custo': 'preco_custo',
  'precocusto': 'preco_custo',
  'custo': 'preco_custo',
  'cost': 'preco_custo',
  'preco': 'preco_custo',
  'price': 'preco_custo',
  'valor': 'preco_custo',
  'preco_custo_por_ponto': 'preco_custo_por_ponto',
  'precocustoporponto': 'preco_custo_por_ponto',
  'custo_por_ponto': 'preco_custo_por_ponto',
  'custoporponto': 'preco_custo_por_ponto',
  
  // Dimensões
  'largura_metro': 'largura_metro',
  'largurametro': 'largura_metro',
  'largura': 'largura_metro',
  'width': 'largura_metro',
  
  // Campos específicos
  'linha': 'linha',
  'line': 'linha',
  'colecao': 'linha',
  'collection': 'linha',
  
  'cor': 'cor',
  'color': 'cor',
  'colour': 'cor',
  
  'tipo': 'tipo',
  'type': 'tipo',
  
  'aplicacao': 'aplicacao',
  'application': 'aplicacao',
  'uso': 'aplicacao',
  
  'potencia': 'potencia',
  'power': 'potencia',
  'watts': 'potencia',
  
  'area_min_fat': 'area_min_fat',
  'areaminf': 'area_min_fat',
  'areaminfat': 'area_min_fat',
  'area_minima': 'area_min_fat',
  'area_min': 'area_min_fat',
  
  'ativo': 'ativo',
  'active': 'ativo',
  'status': 'ativo',
};

// Campos obrigatórios por tipo
const CAMPOS_OBRIGATORIOS: Record<string, string[]> = {
  material: ['codigo_item', 'nome', 'categoria', 'preco_custo'],
  confeccao: ['codigo_item', 'nome_modelo', 'preco_custo'],
  instalacao: ['codigo_item', 'nome', 'preco_custo_por_ponto'],
};

/**
 * Detecta o separador usado no CSV
 */
function detectarSeparador(linhas: string[]): string {
  const separadores = [';', ',', '\t', '|'];
  const contagens: Record<string, number[]> = {};

  separadores.forEach(sep => {
    contagens[sep] = linhas.slice(0, Math.min(5, linhas.length)).map(linha => 
      (linha.match(new RegExp(`\\${sep}`, 'g')) || []).length
    );
  });

  // O separador correto deve ter contagem consistente e > 0
  let melhorSep = ';';
  let melhorScore = 0;

  for (const [sep, counts] of Object.entries(contagens)) {
    if (counts.length === 0 || counts[0] === 0) continue;
    
    const primeiro = counts[0];
    const consistente = counts.every(c => c === primeiro);
    const score = consistente ? primeiro : 0;
    
    if (score > melhorScore) {
      melhorScore = score;
      melhorSep = sep;
    }
  }

  return melhorSep;
}

/**
 * Converte valor monetário para número
 * Suporta: 1234.56, 1234,56, 1.234,56, 1,234.56
 */
export function parseMoney(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  
  let str = String(raw).trim();
  
  // Remove símbolos de moeda e espaços
  str = str.replace(/[R$€$£\s]/g, '');
  
  if (!str) return null;
  
  // Detecta formato
  const temVirgula = str.includes(',');
  const temPonto = str.includes('.');
  
  if (temVirgula && temPonto) {
    // Formato brasileiro: 1.234,56 ou formato americano: 1,234.56
    const ultimaVirgula = str.lastIndexOf(',');
    const ultimoPonto = str.lastIndexOf('.');
    
    if (ultimaVirgula > ultimoPonto) {
      // Formato brasileiro: 1.234,56
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato americano: 1,234.56
      str = str.replace(/,/g, '');
    }
  } else if (temVirgula) {
    // Pode ser 1234,56 (decimal) ou 1,234 (milhares)
    const partes = str.split(',');
    if (partes[partes.length - 1].length <= 2) {
      // Decimal brasileiro
      str = str.replace(',', '.');
    } else {
      // Milhares americano
      str = str.replace(/,/g, '');
    }
  }
  
  const valor = parseFloat(str);
  return isNaN(valor) ? null : valor;
}

/**
 * Normaliza cabeçalho para mapeamento
 */
function normalizarCabecalho(cabecalho: string): string {
  return cabecalho
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Mapeia cabeçalho original para campo do banco
 */
function mapearCabecalho(cabecalho: string): string | null {
  const normalizado = normalizarCabecalho(cabecalho);
  return MAPEAMENTO_CABECALHOS[normalizado] || null;
}

/**
 * Valida um registro baseado no tipo
 */
function validarRegistro(
  dados: Record<string, string | number | boolean | null>,
  tipo: 'material' | 'confeccao' | 'instalacao'
): string[] {
  const erros: string[] = [];
  const obrigatorios = CAMPOS_OBRIGATORIOS[tipo];

  for (const campo of obrigatorios) {
    const valor = dados[campo];
    if (valor === null || valor === undefined || valor === '') {
      erros.push(`Campo obrigatório "${campo}" está vazio`);
    }
  }

  // Validações específicas
  if (tipo === 'material' && dados.preco_custo !== null) {
    const preco = typeof dados.preco_custo === 'number' ? dados.preco_custo : parseMoney(String(dados.preco_custo));
    if (preco !== null && preco < 0) {
      erros.push('Preço de custo não pode ser negativo');
    }
  }

  if (tipo === 'instalacao' && dados.preco_custo_por_ponto !== null) {
    const preco = typeof dados.preco_custo_por_ponto === 'number' ? dados.preco_custo_por_ponto : parseMoney(String(dados.preco_custo_por_ponto));
    if (preco !== null && preco < 0) {
      erros.push('Preço por ponto não pode ser negativo');
    }
  }

  return erros;
}

/**
 * Faz parse de uma linha CSV respeitando aspas
 */
function parseLinhaCSV(linha: string, separador: string): string[] {
  const resultado: string[] = [];
  let atual = '';
  let dentroAspas = false;
  
  for (let i = 0; i < linha.length; i++) {
    const char = linha[i];
    
    if (char === '"') {
      if (dentroAspas && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else {
        dentroAspas = !dentroAspas;
      }
    } else if (char === separador && !dentroAspas) {
      resultado.push(atual.trim());
      atual = '';
    } else {
      atual += char;
    }
  }
  
  resultado.push(atual.trim());
  return resultado;
}

/**
 * Parser principal de CSV
 */
export function parseCSVMateriais(
  conteudo: string,
  tipo: 'material' | 'confeccao' | 'instalacao' = 'material',
  categoriaDefault?: string
): ResultadoParse {
  // Normaliza quebras de linha
  const linhas = conteudo
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter(l => l.trim() !== '');

  if (linhas.length === 0) {
    return {
      registros: [],
      cabecalhosOriginais: [],
      cabecalhosMapeados: [],
      separador: ';',
      totalLinhas: 0,
      totalValidos: 0,
      totalErros: 0,
    };
  }

  const separador = detectarSeparador(linhas);
  const cabecalhosOriginais = parseLinhaCSV(linhas[0], separador);
  const cabecalhosMapeados = cabecalhosOriginais.map(c => mapearCabecalho(c) || c);

  const registros: RegistroParsed[] = [];

  for (let i = 1; i < linhas.length; i++) {
    const valores = parseLinhaCSV(linhas[i], separador);
    
    // Pula linhas vazias
    if (valores.every(v => !v)) continue;

    const dados: Record<string, string | number | boolean | null> = {};

    cabecalhosMapeados.forEach((campo, idx) => {
      const valorRaw = valores[idx] || '';
      
      // Converte valores específicos
      if (campo.includes('preco') || campo === 'area_min_fat' || campo === 'largura_metro') {
        dados[campo] = parseMoney(valorRaw);
      } else if (campo === 'ativo') {
        const lower = valorRaw.toLowerCase();
        dados[campo] = lower === 'true' || lower === 'sim' || lower === 'yes' || lower === '1' || lower === 's';
      } else {
        dados[campo] = valorRaw || null;
      }
    });

    // Adiciona categoria default se não existir
    if (categoriaDefault && !dados.categoria) {
      dados.categoria = categoriaDefault;
    }

    // Se ativo não foi definido, assume true
    if (dados.ativo === null || dados.ativo === undefined) {
      dados.ativo = true;
    }

    const erros = validarRegistro(dados, tipo);

    registros.push({
      linha: i + 1,
      dados,
      valido: erros.length === 0,
      erros,
    });
  }

  return {
    registros,
    cabecalhosOriginais,
    cabecalhosMapeados,
    separador,
    totalLinhas: linhas.length - 1,
    totalValidos: registros.filter(r => r.valido).length,
    totalErros: registros.filter(r => !r.valido).length,
  };
}

/**
 * Gera conteúdo CSV a partir de dados
 */
export function gerarCSV<T extends object>(
  dados: T[],
  colunas: { campo: keyof T | string; titulo: string }[],
  separador: string = ';'
): string {
  if (dados.length === 0) return '';

  const cabecalho = colunas.map(c => c.titulo).join(separador);
  
  const linhas = dados.map(item => {
    return colunas.map(col => {
      const valor = item[col.campo as keyof T];
      if (valor === null || valor === undefined) return '';
      if (typeof valor === 'number') {
        // Formata números com vírgula decimal
        return String(valor).replace('.', ',');
      }
      if (typeof valor === 'boolean') {
        return valor ? 'Sim' : 'Não';
      }
      // Escapa aspas e envolve se contiver separador
      const str = String(valor);
      if (str.includes(separador) || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(separador);
  });

  return [cabecalho, ...linhas].join('\n');
}

/**
 * Faz download de um arquivo CSV
 */
export function downloadCSV(conteudo: string, nomeArquivo: string): void {
  // Adiciona BOM para Excel reconhecer UTF-8
  const bom = '\uFEFF';
  const blob = new Blob([bom + conteudo], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
