export interface DadosOrcamento {
  clienteNome: string;
  clienteTelefone: string;
  ambiente: string;
  observacoes?: string;
}

export interface Cortina {
  id?: string;
  nomeIdentificacao: string;
  largura: number;
  altura: number;
  quantidade: number;
  tipoCortina: 'wave' | 'prega' | 'painel' | 'rolo';
  tecidoId: string;
  forroId?: string;
  trilhoId: string;
  precisaInstalacao: boolean;
  pontosInstalacao?: number;
  custoTecido?: number;
  custoForro?: number;
  custoTrilho?: number;
  custoCostura?: number;
  custoInstalacao?: number;
  custoTotal?: number;
  precoVenda?: number;
}

export interface Material {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
  largura_metro?: number;
  preco_custo: number;
  preco_tabela: number;
  ativo: boolean;
}

export interface ServicoConfeccao {
  id: string;
  nome_modelo: string;
  preco_custo: number;
  ativo: boolean;
}

export interface ServicoInstalacao {
  id: string;
  nome: string;
  preco_custo_por_ponto: number;
  ativo: boolean;
}

export const COEFICIENTES_CORTINA = {
  wave: 2.0,
  prega: 2.5,
  painel: 1.0,
  rolo: 1.0,
} as const;

export const OPCOES_AMBIENTE = [
  'Sala de Estar',
  'Sala de Jantar',
  'Quarto',
  'Cozinha',
  'Escritório',
  'Varanda',
  'Outros',
] as const;

export const OPCOES_MARGEM = [
  { label: 'Baixa (40%)', valor: 40 },
  { label: 'Padrão (61.5%)', valor: 61.5 },
  { label: 'Premium (80%)', valor: 80 },
] as const;
