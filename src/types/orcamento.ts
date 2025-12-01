export interface DadosOrcamento {
  clienteNome: string;
  clienteTelefone: string;
  cidade: string;
  endereco: string;
  observacoes?: string;
}

export interface Cortina {
  id?: string;
  nomeIdentificacao: string;
  largura: number;
  altura: number;
  barraCm?: number; // Barra da cortina em centímetros
  quantidade: number;
  tipoProduto: 'cortina' | 'persiana' | 'outro';
  tipoCortina: 'wave' | 'prega' | 'painel' | 'rolo' | 'horizontal' | 'vertical' | 'romana' | 'celular' | 'madeira' | 'outro';
  
  // Campos auxiliares para persianas (cálculo)
  larguraCm?: number;           // Largura em cm (input do usuário)
  alturaCm?: number;            // Altura em cm (input do usuário)
  alturaFaturadaM?: number;     // Altura faturada em metros (após arredondamento e mínima)
  areaM2?: number;              // Área em m² (calculada)
  
  // Cortina specific
  tecidoId?: string;
  forroId?: string;
  trilhoId?: string;
  
  // Persiana specific (com orçamento de fábrica)
  materialPrincipalId?: string;
  descricao?: string;
  fabrica?: string;
  motorizada?: boolean;
  
  // Comum
  ambiente?: string;
  precoUnitario?: number; // Para persianas e "Outros"
  valorInstalacao?: number; // Valor direto de instalação para produtos "Outros"
  precisaInstalacao: boolean;
  pontosInstalacao?: number;
  observacoesInternas?: string; // Observações internas (não aparecem no PDF)
  
  // Custos
  custoTecido?: number;
  custoForro?: number;
  custoTrilho?: number;
  custoMaterialPrincipal?: number;
  custoCostura?: number;
  custoInstalacao?: number;
  custoTotal?: number;
  precoVenda?: number;
}

export interface Material {
  id: string;
  codigo_item: string;
  nome: string;
  categoria: string;
  unidade: string;
  largura_metro?: number;
  preco_custo: number;
  preco_tabela: number;
  ativo: boolean;
  fornecedor?: string;
  // Campos específicos por categoria
  linha?: string;
  cor?: string;
  tipo?: string;
  aplicacao?: string;
  potencia?: string;
  area_min_fat?: number;
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
  wave: 3.5,
  prega: 3.5,
  painel: 2.5,  // Painel usa coeficiente 2.5
  rolo: 3.5,
  horizontal: 1.0, // Persianas horizontais
  vertical: 1.0,   // Persianas verticais
  romana: 1.0,     // Persianas romanas
  celular: 1.0,    // Persianas celulares
  madeira: 1.0,    // Persianas de madeira
} as const;

export const OPCOES_AMBIENTE = [
  'Sala de Estar',
  'Sala de Jantar',
  'Quarto',
  'Cozinha',
  'Escritório',
  'Varanda',
  'Banheiro',
  'Lavanderia',
  'Área Externa',
  'Outros',
] as const;

export const OPCOES_MARGEM = [
  { label: 'Baixa (40%)', valor: 40 },
  { label: 'Padrão (61.5%)', valor: 61.5 },
  { label: 'Premium (80%)', valor: 80 },
] as const;
