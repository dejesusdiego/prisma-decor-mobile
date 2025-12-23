// Mapeamento de status do orçamento para etapa da oportunidade
export const STATUS_TO_ETAPA: Record<string, { etapa: string; temperatura: string }> = {
  rascunho: { etapa: 'qualificacao', temperatura: 'morno' },
  finalizado: { etapa: 'proposta', temperatura: 'morno' },
  enviado: { etapa: 'proposta', temperatura: 'morno' },
  sem_resposta: { etapa: 'negociacao', temperatura: 'frio' },
  pago_40: { etapa: 'negociacao', temperatura: 'quente' },
  pago_parcial: { etapa: 'negociacao', temperatura: 'quente' },
  pago_60: { etapa: 'negociacao', temperatura: 'quente' },
  pago: { etapa: 'fechado_ganho', temperatura: 'quente' },
  recusado: { etapa: 'fechado_perdido', temperatura: 'frio' },
  cancelado: { etapa: 'fechado_perdido', temperatura: 'frio' },
};

export const ETAPAS_CONFIG = [
  { id: 'prospeccao', label: 'Prospecção', color: '#3b82f6', bgClass: 'bg-blue-500' },
  { id: 'qualificacao', label: 'Qualificação', color: '#8b5cf6', bgClass: 'bg-purple-500' },
  { id: 'proposta', label: 'Proposta', color: '#f59e0b', bgClass: 'bg-amber-500' },
  { id: 'negociacao', label: 'Negociação', color: '#f97316', bgClass: 'bg-orange-500' },
  { id: 'fechado_ganho', label: 'Ganho ✓', color: '#22c55e', bgClass: 'bg-emerald-500' },
  { id: 'fechado_perdido', label: 'Perdido ✗', color: '#ef4444', bgClass: 'bg-red-500' },
];

export const TEMPERATURA_CONFIG = {
  quente: { label: 'Quente', color: 'text-red-500', bgColor: 'bg-red-500' },
  morno: { label: 'Morno', color: 'text-amber-500', bgColor: 'bg-amber-500' },
  frio: { label: 'Frio', color: 'text-blue-500', bgColor: 'bg-blue-500' },
};

export const ORIGENS_CONFIG = {
  orcamento: { label: 'Orçamento', color: 'bg-blue-100 text-blue-800' },
  visita_site: { label: 'Site', color: 'bg-green-100 text-green-800' },
  indicacao: { label: 'Indicação', color: 'bg-purple-100 text-purple-800' },
  instagram: { label: 'Instagram', color: 'bg-pink-100 text-pink-800' },
  facebook: { label: 'Facebook', color: 'bg-indigo-100 text-indigo-800' },
  google: { label: 'Google', color: 'bg-red-100 text-red-800' },
  outro: { label: 'Outro', color: 'bg-gray-100 text-gray-800' },
};

export function getEtapaFromStatus(status: string) {
  return STATUS_TO_ETAPA[status] || { etapa: 'qualificacao', temperatura: 'morno' };
}

export function getEtapaConfig(etapaId: string) {
  return ETAPAS_CONFIG.find(e => e.id === etapaId) || ETAPAS_CONFIG[0];
}

export function getTemperaturaConfig(temperatura: string) {
  return TEMPERATURA_CONFIG[temperatura as keyof typeof TEMPERATURA_CONFIG] || TEMPERATURA_CONFIG.morno;
}

export function getOrigemConfig(origem: string | null) {
  if (!origem) return ORIGENS_CONFIG.outro;
  return ORIGENS_CONFIG[origem as keyof typeof ORIGENS_CONFIG] || ORIGENS_CONFIG.outro;
}

export function formatCurrency(value: number | null) {
  if (!value) return 'R$ 0';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}
