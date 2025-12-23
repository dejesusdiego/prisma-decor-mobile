import type { Cortina, Material, ServicoConfeccao, ServicoInstalacao } from '@/types/orcamento';
import { COEFICIENTES_CORTINA, COEFICIENTES_FORRO } from '@/types/orcamento';
import type { CoeficientesPorTipo } from '@/hooks/useConfiguracoes';

// ============= CONSTANTES =============

const MARGEM_COSTURA_SUPERIOR = 0.16; // 16cm de margem superior para costura
const LARGURA_ROLO_PADRAO = 2.80; // 2.80m quando não tem largura cadastrada

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
  // Indicadores de cálculo por altura
  calculoPorAlturaTecido: boolean;
  calculoPorAlturaForro: boolean;
  // Detalhes do cálculo por altura (quando aplicável)
  numeroPanosTecido: number;
  numeroPanosForro: number;
  alturaPanoTecido: number;
  alturaPanoForro: number;
  // Indicadores de emenda (mantido para compatibilidade)
  precisaEmendaTecido: boolean;
  precisaEmendaForro: boolean;
  coeficienteTecido: number;
  coeficienteForro: number;
  // Custos unitários (por metro ou por ponto)
  precoTecido_m: number;
  precoForro_m: number;
  precoTrilho_m: number;
  precoCostura_m: number;
  precoInstalacao_ponto: number;
  // Larguras dos rolos
  larguraRoloTecido_m: number;
  larguraRoloForro_m: number;
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

// ============= FUNÇÕES AUXILIARES =============

/**
 * Calcula o consumo de material (tecido ou forro) com a lógica correta:
 * - Se (altura + barra) > largura do rolo → cálculo por ALTURA (panos)
 * - Se (altura + barra) <= largura do rolo → cálculo por METRO LINEAR
 */
function calcularConsumoMaterial(
  largura: number, // largura da cortina em metros
  altura: number, // altura da cortina em metros
  barra_m: number, // barra em metros
  coeficiente: number,
  larguraRolo: number, // largura do rolo em metros
  quantidade: number
): { consumo_m: number; calculoPorAltura: boolean; numeroPanos: number; alturaPano: number } {
  const alturaComBarra = altura + barra_m;
  
  // Verifica se precisa calcular por altura (quando altura + barra ultrapassa a largura do rolo)
  if (alturaComBarra > larguraRolo) {
    // Cálculo por ALTURA (número de panos)
    // altura_pano = altura + margem_costura_superior + barra
    const alturaPano = altura + MARGEM_COSTURA_SUPERIOR + barra_m;
    
    // numero_panos = arredondamento para cima de (largura × coeficiente) / largura_rolo
    const numeroPanos = Math.ceil((largura * coeficiente) / larguraRolo);
    
    // consumo_total = numero_panos × altura_pano × quantidade
    const consumo_m = numeroPanos * alturaPano * quantidade;
    
    return {
      consumo_m,
      calculoPorAltura: true,
      numeroPanos,
      alturaPano
    };
  } else {
    // Cálculo por METRO LINEAR (simples)
    // consumo_total = largura × coeficiente × quantidade
    const consumo_m = largura * coeficiente * quantidade;
    
    return {
      consumo_m,
      calculoPorAltura: false,
      numeroPanos: 0,
      alturaPano: 0
    };
  }
}

// ============= FUNÇÕES DE CÁLCULO =============

export function calcularConsumoDetalhado(
  cortina: Cortina,
  materiais: Material[],
  coeficientesTecidoConfig?: CoeficientesPorTipo,
  coeficientesForroConfig?: CoeficientesPorTipo
): ConsumoDetalhado {
  const tecido = cortina.tecidoId ? materiais.find((m) => m.id === cortina.tecidoId || m.codigo_item === cortina.tecidoId) : null;
  const forro = cortina.forroId ? materiais.find((m) => m.id === cortina.forroId || m.codigo_item === cortina.forroId) : null;
  const trilho = cortina.trilhoId ? materiais.find((m) => m.id === cortina.trilhoId || m.codigo_item === cortina.trilhoId) : null;

  // Converter barra de cm para metros - separar barra do tecido e barra do forro
  const barraTecido_m = (cortina.barraCm || 0) / 100;
  const barraForro_m = (cortina.barraForroCm ?? cortina.barraCm ?? 0) / 100; // Usar barra do forro se definida, senão usar barra do tecido

  // Obter coeficientes - usar configurações dinâmicas se disponíveis, senão fallback para constantes
  const coeficientesTecido = coeficientesTecidoConfig || COEFICIENTES_CORTINA;
  const coeficientesForro = coeficientesForroConfig || COEFICIENTES_FORRO;
  
  const coeficienteTecido = coeficientesTecido[cortina.tipoCortina as keyof typeof coeficientesTecido] || 3.5;
  const coeficienteForro = coeficientesForro[cortina.tipoCortina as keyof typeof coeficientesForro] || 2.5;

  // Larguras dos rolos (usar padrão 2.80m se não cadastrado)
  const larguraRoloTecido = tecido?.largura_metro || LARGURA_ROLO_PADRAO;
  const larguraRoloForro = forro?.largura_metro || LARGURA_ROLO_PADRAO;

  // Cálculo do consumo de tecido
  let consumoTecido_m = 0;
  let calculoPorAlturaTecido = false;
  let numeroPanosTecido = 0;
  let alturaPanoTecido = 0;
  
  if (tecido) {
    const resultadoTecido = calcularConsumoMaterial(
      cortina.largura,
      cortina.altura,
      barraTecido_m,
      coeficienteTecido,
      larguraRoloTecido,
      cortina.quantidade
    );
    consumoTecido_m = resultadoTecido.consumo_m;
    calculoPorAlturaTecido = resultadoTecido.calculoPorAltura;
    numeroPanosTecido = resultadoTecido.numeroPanos;
    alturaPanoTecido = resultadoTecido.alturaPano;
  }

  // Cálculo do consumo de forro (usa coeficiente de forro E barra do forro separada)
  let consumoForro_m = 0;
  let calculoPorAlturaForro = false;
  let numeroPanosForro = 0;
  let alturaPanoForro = 0;
  
  if (forro) {
    const resultadoForro = calcularConsumoMaterial(
      cortina.largura,
      cortina.altura,
      barraForro_m, // Usar barra do forro separada
      coeficienteForro,
      larguraRoloForro,
      cortina.quantidade
    );
    consumoForro_m = resultadoForro.consumo_m;
    calculoPorAlturaForro = resultadoForro.calculoPorAltura;
    numeroPanosForro = resultadoForro.numeroPanos;
    alturaPanoForro = resultadoForro.alturaPano;
  }

  // Comprimento do trilho (10cm de sobra) - unitário (sem multiplicar por quantidade aqui, já que é para exibição)
  const comprimentoTrilhoUnitario_m = trilho ? cortina.largura + 0.1 : 0;
  // Total multiplicado pela quantidade
  const comprimentoTrilho_m = comprimentoTrilhoUnitario_m * cortina.quantidade;

  // Comprimento para costura - total
  const comprimentoCosturaUnitario_m = trilho ? comprimentoTrilhoUnitario_m : cortina.largura;
  const comprimentoCostura_m = comprimentoCosturaUnitario_m * cortina.quantidade;

  return {
    consumoTecido_m,
    consumoForro_m,
    comprimentoTrilho_m,
    comprimentoCostura_m,
    calculoPorAlturaTecido,
    calculoPorAlturaForro,
    numeroPanosTecido,
    numeroPanosForro,
    alturaPanoTecido,
    alturaPanoForro,
    precisaEmendaTecido: calculoPorAlturaTecido, // Agora indica se é cálculo por altura
    precisaEmendaForro: calculoPorAlturaForro,
    coeficienteTecido,
    coeficienteForro,
    precoTecido_m: tecido?.preco_custo || 0,
    precoForro_m: forro?.preco_custo || 0,
    precoTrilho_m: trilho?.preco_custo || 0,
    precoCostura_m: 0, // Será preenchido com o serviço de confecção
    precoInstalacao_ponto: 0, // Será preenchido com o serviço de instalação
    larguraRoloTecido_m: larguraRoloTecido,
    larguraRoloForro_m: larguraRoloForro,
  };
}

export function calcularResumoConsolidado(
  cortinas: Cortina[],
  materiais: Material[],
  coeficientesTecidoConfig?: CoeficientesPorTipo,
  coeficientesForroConfig?: CoeficientesPorTipo
): ResumoConsolidado {
  let totalTecido_m = 0;
  let totalForro_m = 0;
  let totalTrilho_m = 0;
  let totalPontosInstalacao = 0;
  let totalCortinas = 0;
  let totalPersianas = 0;
  let totalOutros = 0;

  for (const cortina of cortinas) {
    const qtd = cortina.quantidade || 1;
    
    // Contagem por tipo (somar quantidades, não apenas itens)
    if (cortina.tipoProduto === 'cortina') {
      totalCortinas += qtd;
      const consumo = calcularConsumoDetalhado(cortina, materiais, coeficientesTecidoConfig, coeficientesForroConfig);
      totalTecido_m += consumo.consumoTecido_m;
      totalForro_m += consumo.consumoForro_m;
      // Trilho: comprimento unitário × quantidade
      const comprimentoTrilhoUnitario = cortina.trilhoId ? (cortina.largura + 0.1) : 0;
      totalTrilho_m += comprimentoTrilhoUnitario * qtd;
    } else if (cortina.tipoProduto === 'persiana') {
      totalPersianas += qtd;
    } else {
      totalOutros += qtd;
    }

    // Pontos de instalação (multiplicar pela quantidade)
    if (cortina.precisaInstalacao) {
      totalPontosInstalacao += (cortina.pontosInstalacao || 1) * qtd;
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
  servicoInstalacao?: ServicoInstalacao | null,
  coeficientesTecidoConfig?: CoeficientesPorTipo,
  coeficientesForroConfig?: CoeficientesPorTipo
): CustosCortina {
  // Validação de entrada - pelo menos tecido OU forro deve estar presente
  if (!cortina.tecidoId && !cortina.forroId) {
    throw new Error('É necessário informar pelo menos tecido ou forro');
  }

  const tecido = cortina.tecidoId ? materiais.find((m) => m.id === cortina.tecidoId || m.codigo_item === cortina.tecidoId) : null;
  const forro = cortina.forroId ? materiais.find((m) => m.id === cortina.forroId || m.codigo_item === cortina.forroId) : null;
  const trilho = cortina.trilhoId ? materiais.find((m) => m.id === cortina.trilhoId || m.codigo_item === cortina.trilhoId) : null;

  // 1) Converter barra de cm para metros - separar barra do tecido e barra do forro
  const barraTecido_m = (cortina.barraCm || 0) / 100;
  const barraForro_m = (cortina.barraForroCm ?? cortina.barraCm ?? 0) / 100;

  // 2) Obter coeficientes - usar configurações dinâmicas se disponíveis
  const coeficientesTecido = coeficientesTecidoConfig || COEFICIENTES_CORTINA;
  const coeficientesForro = coeficientesForroConfig || COEFICIENTES_FORRO;
  
  const coeficienteTecido = coeficientesTecido[cortina.tipoCortina as keyof typeof coeficientesTecido] || 3.5;
  const coeficienteForro = coeficientesForro[cortina.tipoCortina as keyof typeof coeficientesForro] || 2.5;

  // Larguras dos rolos (usar padrão 2.80m se não cadastrado)
  const larguraRoloTecido = tecido?.largura_metro || LARGURA_ROLO_PADRAO;
  const larguraRoloForro = forro?.largura_metro || LARGURA_ROLO_PADRAO;

  // 3) Cálculo do tecido (se houver) - usa coeficiente de tecido
  let custoTecido = 0;
  if (tecido) {
    const resultadoTecido = calcularConsumoMaterial(
      cortina.largura,
      cortina.altura,
      barraTecido_m,
      coeficienteTecido,
      larguraRoloTecido,
      cortina.quantidade
    );
    custoTecido = resultadoTecido.consumo_m * tecido.preco_custo;
  }

  // 4) Cálculo do forro (se houver) - usa coeficiente de FORRO E barra do forro separada
  let custoForro = 0;
  if (forro) {
    const resultadoForro = calcularConsumoMaterial(
      cortina.largura,
      cortina.altura,
      barraForro_m, // Usar barra do forro separada
      coeficienteForro,
      larguraRoloForro,
      cortina.quantidade
    );
    custoForro = resultadoForro.consumo_m * forro.preco_custo;
  }

  // 5) Cálculo do trilho (10cm de sobra, multiplicado pela quantidade)
  const comprimentoTrilhoUnitario_m = cortina.largura + 0.1;
  const comprimentoTrilhoTotal_m = comprimentoTrilhoUnitario_m * cortina.quantidade;
  const custoTrilho = trilho ? (comprimentoTrilhoTotal_m * trilho.preco_custo) : 0;

  // 6) Cálculo da costura (usa comprimento do trilho OU largura, multiplicado pela quantidade)
  const comprimentoParaCosturaUnitario = trilho ? comprimentoTrilhoUnitario_m : cortina.largura;
  const comprimentoParaCosturaTotal = comprimentoParaCosturaUnitario * cortina.quantidade;
  const custoCostura = comprimentoParaCosturaTotal * servicoConfeccao.preco_custo;

  // 7) Cálculo da instalação (pontos multiplicados pela quantidade)
  const pontosInstalacaoTotal = (cortina.pontosInstalacao || 1) * cortina.quantidade;
  const custoInstalacao = cortina.precisaInstalacao && servicoInstalacao
    ? pontosInstalacaoTotal * servicoInstalacao.preco_custo_por_ponto
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
