import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TendenciaIndicatorProps {
  tipo: 'up' | 'down' | 'neutral';
  percentual: number;
  className?: string;
}

export function TendenciaIndicator({ tipo, percentual, className }: TendenciaIndicatorProps) {
  if (tipo === 'neutral' || percentual === 0) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
        <Minus className="h-3 w-3" />
        <span>0%</span>
      </span>
    );
  }

  const isUp = tipo === 'up';
  
  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        isUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
        className
      )}
    >
      {isUp ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      <span>{isUp ? '+' : '-'}{percentual.toFixed(1)}%</span>
    </span>
  );
}
