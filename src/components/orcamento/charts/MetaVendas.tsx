import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp } from 'lucide-react';

interface MetaVendasProps {
  meta: number;
  realizado: number;
}

export function MetaVendas({ meta, realizado }: MetaVendasProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const percentual = meta > 0 ? Math.min((realizado / meta) * 100, 100) : 0;
  const falta = Math.max(meta - realizado, 0);
  const atingiu = realizado >= meta;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-muted-foreground" />
          Meta do Mês
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{percentual.toFixed(1)}%</span>
          </div>
          <Progress 
            value={percentual} 
            className="h-3"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Realizado</p>
            <p className={`text-lg font-bold ${atingiu ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
              {formatCurrency(realizado)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Meta</p>
            <p className="text-lg font-bold text-muted-foreground">
              {formatCurrency(meta)}
            </p>
          </div>
        </div>

        {atingiu ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm font-medium">Meta atingida!</span>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Faltam <span className="font-medium text-foreground">{formatCurrency(falta)}</span> para atingir a meta
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
