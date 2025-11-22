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

  const coeficiente = COEFICIENTES_CORTINA[cortina.tipoCortina];

  // Calcular altura final com barra (se definida)
  const barraMt = (cortina.barraCm || 0) / 100; // Converter cm para metros
  const alturaFinal = cortina.altura + barraMt;

  // Cálculo do tecido
  let metragemBaseTecido = cortina.largura * coeficiente * cortina.quantidade;
  
  // Se altura for maior que largura do rolo, dobrar consumo
  if (tecido.largura_metro && alturaFinal > tecido.largura_metro) {
    metragemBaseTecido *= 2;
  }

  const custoTecido = metragemBaseTecido * tecido.preco_custo;

  // Cálculo do forro (se houver)
  let custoForro = 0;
  if (forro) {
    let metragemBaseForro = cortina.largura * coeficiente * cortina.quantidade;
    if (forro.largura_metro && alturaFinal > forro.largura_metro) {
      metragemBaseForro *= 2;
    }
    custoForro = metragemBaseForro * forro.preco_custo;
  }

  // Cálculo do trilho
  const comprimentoTrilho = cortina.largura + 0.1; // 10cm de sobra
  const custoTrilho = comprimentoTrilho * trilho.preco_custo * cortina.quantidade;

  // Cálculo da costura (usa preco_custo do serviço por metro linear de trilho)
  const custoCostura = comprimentoTrilho * servicoConfeccao.preco_custo * cortina.quantidade;

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
  const markup = 1 + margemPercent / 100;
  const totalGeral = custoTotal * markup;

  return {
    subtotalMateriais,
    subtotalMaoObraCostura,
    subtotalInstalacao,
    custoTotal,
    totalGeral,
  };
}
