import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Package, 
  Clock, 
  Truck, 
  AlertTriangle,
  X
} from 'lucide-react';
import { AlertaContextual } from '@/hooks/useJornadaCliente';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AlertasContextuaisProps {
  alertas: AlertaContextual[];
  onAcao?: (alerta: AlertaContextual) => void;
  className?: string;
}

const ALERTA_CONFIG: Record<AlertaContextual['tipo'], { 
  icon: React.ElementType;
  variant: 'default' | 'destructive';
  bgClass: string;
}> = {
  parcela_vencendo: { 
    icon: DollarSign, 
    variant: 'default',
    bgClass: 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/30'
  },
  parcela_atrasada: { 
    icon: AlertTriangle, 
    variant: 'destructive',
    bgClass: 'border-destructive/50 bg-destructive/10'
  },
  pedido_pronto: { 
    icon: Package, 
    variant: 'default',
    bgClass: 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/30'
  },
  sem_contato: { 
    icon: Clock, 
    variant: 'default',
    bgClass: 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/30'
  },
  instalacao_pendente: { 
    icon: Truck, 
    variant: 'default',
    bgClass: 'border-purple-500/50 bg-purple-50 dark:bg-purple-950/30'
  }
};

export function AlertasContextuais({ alertas, onAcao, className }: AlertasContextuaisProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  if (!alertas || alertas.length === 0) return null;

  const alertasVisiveis = alertas.filter(a => !dismissedIds.has(a.id));
  if (alertasVisiveis.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {alertasVisiveis.slice(0, 3).map((alerta) => {
        const config = ALERTA_CONFIG[alerta.tipo];
        const Icon = config.icon;

        return (
          <Alert 
            key={alerta.id} 
            variant={config.variant}
            className={cn("relative pr-24", config.bgClass)}
          >
            <Icon className="h-4 w-4" />
            <AlertTitle className="text-sm font-medium">
              {alerta.titulo}
            </AlertTitle>
            <AlertDescription className="text-xs">
              {alerta.descricao}
            </AlertDescription>
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {alerta.acao && (
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => onAcao?.(alerta)}
                >
                  {alerta.acao.label}
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => handleDismiss(alerta.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </Alert>
        );
      })}
      
      {alertasVisiveis.length > 3 && (
        <p className="text-xs text-muted-foreground text-center">
          +{alertasVisiveis.length - 3} alertas adicionais
        </p>
      )}
    </div>
  );
}
