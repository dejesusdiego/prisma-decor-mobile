import { Badge } from '@/components/ui/badge';
import { Check, Edit2, Plus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type CardStatus = 'new' | 'saved' | 'editing' | 'error';

interface CardStatusBadgeProps {
  status: CardStatus;
  className?: string;
}

const statusConfig = {
  new: {
    label: 'Novo',
    icon: Plus,
    className: 'badge-new',
  },
  saved: {
    label: 'Salvo',
    icon: Check,
    className: 'badge-saved',
  },
  editing: {
    label: 'Editando',
    icon: Edit2,
    className: 'badge-editing',
  },
  error: {
    label: 'Erro',
    icon: AlertCircle,
    className: 'bg-destructive/15 text-destructive border-destructive/30',
  },
};

export function CardStatusBadge({ status, className }: CardStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn('text-xs gap-1 font-normal', config.className, className)}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export function getCardStatus(id: string | undefined, hasChanges: boolean): CardStatus {
  if (!id) return 'new';
  if (hasChanges) return 'editing';
  return 'saved';
}

export function getCardStatusClass(status: CardStatus): string {
  switch (status) {
    case 'new':
      return 'card-status-new';
    case 'saved':
      return 'card-status-saved';
    case 'editing':
      return 'card-status-editing';
    case 'error':
      return 'card-status-error';
    default:
      return '';
  }
}
