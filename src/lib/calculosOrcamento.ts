import type { Cortina, Material, ServicoConfeccao, ServicoInstalacao } from '@/types/orcamento';
import { COEFICIENTES_CORTINA } from '@/types/orcamento';

export interface CustosCortina {
  custoTecido: number;
  custoForro: number;
  custoTrilho: number;
  custoCostura: number;
  custoInstalacao: number;
  custoTotal: number;
}

// ============= CÁLCULO DE PERSIANAS =============

export interface CalculoPersianaParams {
  larguraCm: number;
  alturaCm: number;
  quantidade: number;
  precoCustoM2: number; // R$/m² do material
  margemMultiplicador?: number; // ex: 1.615 (opcional, default 1)
}

export interface ResultadoPersiana {
  larguraM: number;
  alturaM: number;
  alturaArredondadaM: number;  // Arredondada para módulo 5cm
  alturaFaturadaM: number;     // Max entre arredondada e mínima (1.20m)
  areaM2: number;              // Área faturada por unidade
  areaTotalM2: number;         // Área total (× quantidade)
  custoUnitario: number;       // Custo por peça
  custoTotal: number;          // Custo total (× quantidade)
  precoUnitario?: number;      // Preço venda por peça (com margem)
  precoTotal?: number;         // Preço venda total (com margem)
}

/**
 * Calcula valores de persiana seguindo a regra oficial da fábrica:
 * - Altura mínima de faturamento: 1.20m
 * - Módulo de 5cm na altura (arredonda para cima)
 * - Cálculo por área (m²)
 */
export function calcularValoresPersiana(params: CalculoPersianaParams): ResultadoPersiana {
  const { larguraCm, alturaCm, quantidade, precoCustoM2, margemMultiplicador = 1 } = params;

  // 1. Converter cm → metros
  const larguraM = larguraCm / 100;
  const alturaM = alturaCm / 100;

  // 2. Arredondar altura para múltiplo de 5cm (0.05m)
  const alturaArredondadaM = Math.ceil(alturaM / 0.05) * 0.05;

  // 3. Aplicar altura mínima de faturamento (1.20m)
  const ALTURA_MIN_FAT_M = 1.20;
  const alturaFaturadaM = Math.max(alturaArredondadaM, ALTURA_MIN_FAT_M);

  // 4. Calcular área faturada
  const areaM2 = larguraM * alturaFaturadaM;
  const areaTotalM2 = areaM2 * quantidade;

  // 5. Calcular custos
  const custoUnitario = areaM2 * precoCustoM2;
  const custoTotal = custoUnitario * quantidade;

  // 6. Calcular preços com margem (se fornecida)
  const precoUnitario = margemMultiplicador > 1 ? custoUnitario * margemMultiplicador : undefined;
  const precoTotal = margemMultiplicador > 1 ? custoTotal * margemMultiplicador : undefined;

  return {
    larguraM,
    alturaM,
    alturaArredondadaM,
    alturaFaturadaM,
    areaM2,
    areaTotalM2,
    custoUnitario,
    custoTotal,
    precoUnitario,
    precoTotal,
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

export interface CustosPersiana {
  custoMaterialPrincipal: number;
  custoTrilho: number;
  custoInstalacao: number;
  custoTotal: number;
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

export interface ResumoOrcamento {
  subtotalMateriais: number;
  subtotalMaoObraCostura: number;
  subtotalInstalacao: number;
  custoTotal: number;
  totalGeral: number;
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
