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

export function calcularCustosCortina(
  cortina: Cortina,
  materiais: Material[],
  servicoConfeccao: ServicoConfeccao,
  servicoInstalacao?: ServicoInstalacao | null
): CustosCortina {
  // Validação de entrada
  if (!cortina.tecidoId || !cortina.trilhoId) {
    throw new Error('Tecido e trilho são obrigatórios para cortinas');
  }

  const tecido = materiais.find((m) => m.id === cortina.tecidoId);
  const forro = cortina.forroId ? materiais.find((m) => m.id === cortina.forroId) : null;
  const trilho = materiais.find((m) => m.id === cortina.trilhoId);

  if (!tecido || !trilho) {
    throw new Error('Tecido ou trilho não encontrado na base de dados');
  }

  // 1) Converter barra de cm para metros
  const barra_m = (cortina.barraCm || 0) / 100;

  // 2) Consumo POR CORTINA (sem considerar quantidade ainda)
  let consumoPorCortina_m = (cortina.largura * 3.5) + barra_m;

  // 3) Verificar se precisa emenda (altura vs largura do rolo)
  if (tecido.largura_metro && cortina.altura > tecido.largura_metro) {
    consumoPorCortina_m *= 2;
  }

  // 4) Consumo total de tecido (considerando quantidade)
  const consumoTotalTecido_m = consumoPorCortina_m * cortina.quantidade;

  // 5) Custo do tecido
  const custoTecido = consumoTotalTecido_m * tecido.preco_custo;

  // Cálculo do forro (se houver) - mesma lógica do tecido
  let custoForro = 0;
  if (forro) {
    let consumoPorCortinaForro_m = (cortina.largura * 3.5) + barra_m;
    
    if (forro.largura_metro && cortina.altura > forro.largura_metro) {
      consumoPorCortinaForro_m *= 2;
    }
    
    const consumoTotalForro_m = consumoPorCortinaForro_m * cortina.quantidade;
    custoForro = consumoTotalForro_m * forro.preco_custo;
  }

  // Cálculo do trilho (10cm de sobra, SEM multiplicar por quantidade)
  const comprimentoTrilho_m = cortina.largura + 0.1;
  const custoTrilho = comprimentoTrilho_m * trilho.preco_custo;

  // Cálculo da costura (usa comprimento do trilho, SEM multiplicar por quantidade)
  const custoCostura = comprimentoTrilho_m * servicoConfeccao.preco_custo;

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
