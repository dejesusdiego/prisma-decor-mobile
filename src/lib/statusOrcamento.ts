// Configuração centralizada de status de orçamentos

export const STATUS_CONFIG = {
  rascunho: {
    label: 'Rascunho',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    badgeVariant: 'secondary' as const,
  },
  finalizado: {
    label: 'Finalizado',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    badgeVariant: 'default' as const,
  },
  enviado: {
    label: 'Enviado',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    badgeVariant: 'default' as const,
  },
  sem_resposta: {
    label: 'Sem Resposta',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
    badgeVariant: 'destructive' as const,
  },
  recusado: {
    label: 'Recusado',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    badgeVariant: 'destructive' as const,
  },
  pago_40: {
    label: 'Pago 40%',
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
    badgeVariant: 'default' as const,
  },
  pago_parcial: {
    label: 'Pago 50%',
    color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
    badgeVariant: 'default' as const,
  },
  pago_60: {
    label: 'Pago 60%',
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
    badgeVariant: 'default' as const,
  },
  pago: {
    label: 'Pago',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    badgeVariant: 'default' as const,
  },
} as const;

export type StatusOrcamento = keyof typeof STATUS_CONFIG;

export const STATUS_LIST: StatusOrcamento[] = [
  'rascunho',
  'finalizado',
  'enviado',
  'sem_resposta',
  'recusado',
  'pago_40',
  'pago_parcial',
  'pago_60',
  'pago',
];

export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status as StatusOrcamento] || STATUS_CONFIG.rascunho;
}

export function getStatusLabel(status: string) {
  return getStatusConfig(status).label;
}

export function getStatusColor(status: string) {
  return getStatusConfig(status).color;
}
