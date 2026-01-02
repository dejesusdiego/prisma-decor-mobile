import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DollarSign, Lock, Unlock, CheckCircle2 } from 'lucide-react';
import { StatusFinanceiroPedido, STATUS_LIBERACAO_LABELS } from '@/hooks/usePedidoFinanceiro';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface BadgeStatusFinanceiroProps {
  status: StatusFinanceiroPedido | null | undefined;
  size?: 'sm' | 'md';
  showTooltip?: boolean;
}

export function BadgeStatusFinanceiro({ status, size = 'md', showTooltip = true }: BadgeStatusFinanceiroProps) {
  if (!status) {
    return (
      <Badge variant="outline" className="text-muted-foreground gap-1">
        <DollarSign className={cn("h-3 w-3", size === 'sm' && 'h-2.5 w-2.5')} />
        <span className={size === 'sm' ? 'text-[10px]' : 'text-xs'}>-</span>
      </Badge>
    );
  }

  const info = STATUS_LIBERACAO_LABELS[status.statusLiberacao];
  
  const getIcon = () => {
    switch (status.statusLiberacao) {
      case 'bloqueado':
        return <Lock className={cn("h-3 w-3", size === 'sm' && 'h-2.5 w-2.5')} />;
      case 'materiais_liberados':
      case 'instalacao_liberada':
        return <Unlock className={cn("h-3 w-3", size === 'sm' && 'h-2.5 w-2.5')} />;
      case 'totalmente_pago':
        return <CheckCircle2 className={cn("h-3 w-3", size === 'sm' && 'h-2.5 w-2.5')} />;
    }
  };

  const badge = (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1 border-0",
        info.bgColor,
        info.color,
        size === 'sm' && 'px-1.5 py-0.5'
      )}
    >
      {getIcon()}
      <span className={size === 'sm' ? 'text-[10px]' : 'text-xs'}>
        {Math.round(status.percentualPago)}%
      </span>
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="max-w-[250px]">
          <div className="space-y-1">
            <p className="font-semibold">{info.label}</p>
            <div className="text-xs space-y-0.5">
              <p>Recebido: {formatCurrency(status.valorRecebido)}</p>
              <p>Pendente: {formatCurrency(status.valorPendente)}</p>
              <p>Total: {formatCurrency(status.valorTotal)}</p>
            </div>
            {status.statusLiberacao === 'bloqueado' && (
              <p className="text-xs text-red-600 mt-1">
                ⚠️ Aguardando 40% para liberar materiais
              </p>
            )}
            {status.statusLiberacao === 'materiais_liberados' && (
              <p className="text-xs text-yellow-600 mt-1">
                ⚠️ Aguardando 60% para liberar instalação
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
