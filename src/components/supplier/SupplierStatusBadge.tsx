import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

interface SupplierStatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected';
  showTooltip?: boolean;
}

export function SupplierStatusBadge({ status, showTooltip = true }: SupplierStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pendente de Aprovação',
          variant: 'outline' as const,
          icon: Clock,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50 dark:bg-amber-950/20',
          borderColor: 'border-amber-200 dark:border-amber-800',
          tooltip: 'Seu catálogo ainda não está visível para clientes. Aguarde a aprovação.',
        };
      case 'approved':
        return {
          label: 'Ativo',
          variant: 'default' as const,
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
          borderColor: 'border-green-200 dark:border-green-800',
          tooltip: 'Seus materiais já estão disponíveis para clientes.',
        };
      case 'rejected':
        return {
          label: 'Rejeitado',
          variant: 'destructive' as const,
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-950/20',
          borderColor: 'border-red-200 dark:border-red-800',
          tooltip: 'Seu cadastro foi rejeitado. Entre em contato para mais informações.',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const badge = (
    <Badge
      variant={config.variant}
      className={`flex items-center gap-1.5 ${config.color} ${config.bgColor} ${config.borderColor}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
