import type { Cortina, Material, ServicoConfeccao, ServicoInstalacao } from '@/types/orcamento';
import { COEFICIENTES_CORTINA } from '@/types/orcamento';

// ============= INTERFACES =============

export interface CustosCortina {
  custoTecido: number;
  custoForro: number;
  custoTrilho: number;
  custoCostura: number;
  custoInstalacao: number;
  custoTotal: number;
}

export interface CustosPersiana {
  custoMaterialPrincipal: number;
  custoTrilho: number;
  custoInstalacao: number;
  custoTotal: number;
}

export interface ResumoOrcamento {
  subtotalMateriais: number;
  subtotalMaoObraCostura: number;
  subtotalInstalacao: number;
  custoTotal: number;
  totalGeral: number;
}

export interface ConsumoDetalhado {
  // Consumo em metros
  consumoTecido_m: number;
  consumoForro_m: number;
  comprimentoTrilho_m: number;
  comprimentoCostura_m: number;
  // Indicadores
  precisaEmendaTecido: boolean;
  precisaEmendaForro: boolean;
  coeficienteUsado: number;
  // Custos unitários (por metro ou por ponto)
  precoTecido_m: number;
  precoForro_m: number;
  precoTrilho_m: number;
  precoCostura_m: number;
  precoInstalacao_ponto: number;
  // Larguras dos rolos
  larguraRoloTecido_m: number | null;
  larguraRoloForro_m: number | null;
}

export interface ResumoConsolidado {
  totalTecido_m: number;
  totalForro_m: number;
  totalTrilho_m: number;
  totalPontosInstalacao: number;
  totalCortinas: number;
  totalPersianas: number;
  totalOutros: number;
}

// ============= FUNÇÕES DE CÁLCULO =============

export function calcularConsumoDetalhado(
  cortina: Cortina,
  materiais: Material[]
): ConsumoDetalhado {
  const tecido = cortina.tecidoId ? materiais.find((m) => m.id === cortina.tecidoId || m.codigo_item === cortina.tecidoId) : null;
  const forro = cortina.forroId ? materiais.find((m) => m.id === cortina.forroId || m.codigo_item === cortina.forroId) : null;
  const trilho = cortina.trilhoId ? materiais.find((m) => m.id === cortina.trilhoId || m.codigo_item === cortina.trilhoId) : null;

  // Converter barra de cm para metros
  const barra_m = (cortina.barraCm || 0) / 100;

  // Obter coeficiente baseado no tipo de cortina
  const coeficiente = COEFICIENTES_CORTINA[cortina.tipoCortina as keyof typeof COEFICIENTES_CORTINA] || 3.5;

  // Cálculo do consumo de tecido
  let consumoTecido_m = 0;
  let precisaEmendaTecido = false;
  if (tecido) {
    consumoTecido_m = (cortina.largura * coeficiente) + barra_m;
    
    // Verificar se precisa emenda (altura vs largura do rolo)
    if (tecido.largura_metro && cortina.altura > tecido.largura_metro) {
      consumoTecido_m *= 2;
      precisaEmendaTecido = true;
    }
    
    consumoTecido_m *= cortina.quantidade;
  }

  // Cálculo do consumo de forro
  let consumoForro_m = 0;
  let precisaEmendaForro = false;
  if (forro) {
    consumoForro_m = (cortina.largura * coeficiente) + barra_m;
    
    if (forro.largura_metro && cortina.altura > forro.largura_metro) {
      consumoForro_m *= 2;
      precisaEmendaForro = true;
    }
    
    consumoForro_m *= cortina.quantidade;
  }

  // Comprimento do trilho (10cm de sobra)
  const comprimentoTrilho_m = trilho ? cortina.largura + 0.1 : 0;

  // Comprimento para costura
  const comprimentoCostura_m = trilho ? comprimentoTrilho_m : cortina.largura;

  return {
    consumoTecido_m,
    consumoForro_m,
    comprimentoTrilho_m,
    comprimentoCostura_m,
    precisaEmendaTecido,
    precisaEmendaForro,
    coeficienteUsado: coeficiente,
    precoTecido_m: tecido?.preco_custo || 0,
    precoForro_m: forro?.preco_custo || 0,
    precoTrilho_m: trilho?.preco_custo || 0,
    precoCostura_m: 0, // Será preenchido com o serviço de confecção
    precoInstalacao_ponto: 0, // Será preenchido com o serviço de instalação
    larguraRoloTecido_m: tecido?.largura_metro || null,
    larguraRoloForro_m: forro?.largura_metro || null,
  };
}

export function calcularResumoConsolidado(
  cortinas: Cortina[],
  materiais: Material[]
): ResumoConsolidado {
  let totalTecido_m = 0;
  let totalForro_m = 0;
  let totalTrilho_m = 0;
  let totalPontosInstalacao = 0;
  let totalCortinas = 0;
  let totalPersianas = 0;
  let totalOutros = 0;

  for (const cortina of cortinas) {
    // Contagem por tipo
    if (cortina.tipoProduto === 'cortina') {
      totalCortinas++;
      const consumo = calcularConsumoDetalhado(cortina, materiais);
      totalTecido_m += consumo.consumoTecido_m;
      totalForro_m += consumo.consumoForro_m;
      totalTrilho_m += consumo.comprimentoTrilho_m;
    } else if (cortina.tipoProduto === 'persiana') {
      totalPersianas++;
    } else {
      totalOutros++;
    }

    // Pontos de instalação
    if (cortina.precisaInstalacao) {
      totalPontosInstalacao += cortina.pontosInstalacao || 1;
    }
  }

  return {
    totalTecido_m,
    totalForro_m,
    totalTrilho_m,
    totalPontosInstalacao,
    totalCortinas,
    totalPersianas,
    totalOutros,
  };
}

export function calcularCustosCortina(
  cortina: Cortina,
  materiais: Material[],
  servicoConfeccao: ServicoConfeccao,
  servicoInstalacao?: ServicoInstalacao | null
): CustosCortina {
  // Validação de entrada - pelo menos tecido OU forro deve estar presente
  if (!cortina.tecidoId && !cortina.forroId) {
    throw new Error('É necessário informar pelo menos tecido ou forro');
  }

  const tecido = cortina.tecidoId ? materiais.find((m) => m.id === cortina.tecidoId) : null;
  const forro = cortina.forroId ? materiais.find((m) => m.id === cortina.forroId) : null;
  const trilho = cortina.trilhoId ? materiais.find((m) => m.id === cortina.trilhoId) : null;

  // 1) Converter barra de cm para metros
  const barra_m = (cortina.barraCm || 0) / 100;

  // 2) Obter coeficiente baseado no tipo de cortina
  const coeficiente = COEFICIENTES_CORTINA[cortina.tipoCortina as keyof typeof COEFICIENTES_CORTINA] || 3.5;

  // 3) Cálculo do tecido (se houver)
  let custoTecido = 0;
  if (tecido) {
    let consumoPorCortina_m = (cortina.largura * coeficiente) + barra_m;
    
    // Verificar se precisa emenda (altura vs largura do rolo)
    if (tecido.largura_metro && cortina.altura > tecido.largura_metro) {
      consumoPorCortina_m *= 2;
    }
    
    const consumoTotalTecido_m = consumoPorCortina_m * cortina.quantidade;
    custoTecido = consumoTotalTecido_m * tecido.preco_custo;
  }

  // 4) Cálculo do forro (se houver) - usa mesmo coeficiente do tipo de cortina
  let custoForro = 0;
  if (forro) {
    let consumoPorCortinaForro_m = (cortina.largura * coeficiente) + barra_m;
    
    if (forro.largura_metro && cortina.altura > forro.largura_metro) {
      consumoPorCortinaForro_m *= 2;
    }
    
    const consumoTotalForro_m = consumoPorCortinaForro_m * cortina.quantidade;
    custoForro = consumoTotalForro_m * forro.preco_custo;
  }

  // 5) Cálculo do trilho (10cm de sobra, SEM multiplicar por quantidade) - opcional
  const comprimentoTrilho_m = cortina.largura + 0.1;
  const custoTrilho = trilho ? (comprimentoTrilho_m * trilho.preco_custo) : 0;

  // 6) Cálculo da costura (usa comprimento do trilho OU largura se não tiver trilho, SEM multiplicar por quantidade)
  const comprimentoParaCostura = trilho ? comprimentoTrilho_m : cortina.largura;
  const custoCostura = comprimentoParaCostura * servicoConfeccao.preco_custo;

  // Cálculo da instalação
  const custoInstalacao = cortina.precisaInstalacao && servicoInstalacao
    ? (cortina.pontosInstalacao || 1) * servicoInstalacao.preco_custo_por_ponto
    : 0;

  const custoTotal = custoTecido + custoForro + custoTrilho + custoCostura + custoInstalacao;

  return {
    custoTecido,
    custoForro,
    custoTrilho,
    custoCostura,
    custoInstalacao,
    custoTotal,
  };
}

export function calcularCustosPersiana(
  persiana: Cortina,
  materiais: Material[],
  servicoInstalacao?: ServicoInstalacao | null
): CustosPersiana {
  // Validação de entrada
  if (!persiana.materialPrincipalId) {
    throw new Error('Material principal é obrigatório para persianas');
  }

  const materialPrincipal = materiais.find((m) => m.id === persiana.materialPrincipalId);
  const trilho = persiana.trilhoId ? materiais.find((m) => m.id === persiana.trilhoId) : null;

  if (!materialPrincipal) {
    throw new Error('Material principal não encontrado na base de dados');
  }

  // Cálculo do material principal por área
  const area = persiana.largura * persiana.altura * persiana.quantidade;
  const custoMaterialPrincipal = area * materialPrincipal.preco_custo;

  // Cálculo do trilho/acessório (se houver)
  const custoTrilho = trilho 
    ? (persiana.largura + 0.1) * trilho.preco_custo * persiana.quantidade 
    : 0;

  // Cálculo da instalação
  const custoInstalacao = persiana.precisaInstalacao && servicoInstalacao
    ? (persiana.pontosInstalacao || 1) * servicoInstalacao.preco_custo_por_ponto
    : 0;

  const custoTotal = custoMaterialPrincipal + custoTrilho + custoInstalacao;

  return {
    custoMaterialPrincipal,
    custoTrilho,
    custoInstalacao,
    custoTotal,
  };
}

export function calcularResumoOrcamento(
  cortinas: Cortina[],
  margemPercent: number
): ResumoOrcamento {
  const markup = 1 + margemPercent / 100;
  
  // Calcular subtotais de custos internos
  const subtotalMateriais = cortinas.reduce(
    (acc, c) => acc + (c.custoTecido || 0) + (c.custoForro || 0) + (c.custoTrilho || 0),
    0
  );

  const subtotalMaoObraCostura = cortinas.reduce(
    (acc, c) => acc + (c.custoCostura || 0),
    0
  );

  const subtotalInstalacao = cortinas.reduce(
    (acc, c) => acc + (c.custoInstalacao || 0),
    0
  );

  const custoTotal = subtotalMateriais + subtotalMaoObraCostura + subtotalInstalacao;
  
  // Total geral é a soma dos preços de venda de cada item (que já têm margem aplicada)
  // Para calcular aqui, aplicamos a margem no custo total de cada item
  const totalGeral = cortinas.reduce((acc, c) => {
    const custoTotalItem = (c.custoTotal || 0);
    const precoVendaItem = custoTotalItem * markup;
    return acc + precoVendaItem;
  }, 0);

  return {
    subtotalMateriais,
    subtotalMaoObraCostura,
    subtotalInstalacao,
    custoTotal,
    totalGeral,
  };
}
