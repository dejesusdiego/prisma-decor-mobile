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
  const tecido = materiais.find((m) => m.id === cortina.tecidoId);
  const forro = cortina.forroId ? materiais.find((m) => m.id === cortina.forroId) : null;
  const trilho = materiais.find((m) => m.id === cortina.trilhoId);

  if (!tecido || !trilho) {
    throw new Error('Tecido ou trilho não encontrado');
  }

  const coeficiente = COEFICIENTES_CORTINA[cortina.tipoCortina];

  // Cálculo do tecido
  let metragemBaseTecido = cortina.largura * coeficiente * cortina.quantidade;
  
  // Se altura for maior que largura do rolo, dobrar consumo
  if (tecido.largura_metro && cortina.altura > tecido.largura_metro) {
    metragemBaseTecido *= 2;
  }

  const custoTecido = metragemBaseTecido * tecido.preco_custo;

  // Cálculo do forro (se houver)
  let custoForro = 0;
  if (forro) {
    let metragemBaseForro = cortina.largura * coeficiente * cortina.quantidade;
    if (forro.largura_metro && cortina.altura > forro.largura_metro) {
      metragemBaseForro *= 2;
    }
    custoForro = metragemBaseForro * forro.preco_custo;
  }

  // Cálculo do trilho
  const comprimentoTrilho = cortina.largura + 0.1; // 10cm de sobra
  const custoTrilho = comprimentoTrilho * trilho.preco_custo * cortina.quantidade;

  // Cálculo da costura
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
