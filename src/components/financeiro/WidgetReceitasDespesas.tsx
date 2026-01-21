import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpCircle, ArrowDownCircle, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface WidgetReceitasDespesasProps {
  receitas: number;
  despesas: number;
  isLoading?: boolean;
  onNavigate?: (view: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function WidgetReceitasDespesas({ 
  receitas, 
  despesas, 
  isLoading,
  onNavigate 
}: WidgetReceitasDespesasProps) {
  const total = receitas + despesas;
  const percentualReceitas = total > 0 ? (receitas / total) * 100 : 0;
  const percentualDespesas = total > 0 ? (despesas / total) * 100 : 0;
  const saldo = receitas - despesas;
  const percentualSaldo = receitas > 0 ? (saldo / receitas) * 100 : 0;

  if (isLoading) {
    return (
      <Card className="min-h-[280px] sm:min-h-[320px] lg:min-h-[360px]">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="min-h-[280px] sm:min-h-[320px] lg:min-h-[360px] flex flex-col cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onNavigate?.('finRelatorios')}
    >
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 shrink-0 text-primary" />
          <span className="flex-1 min-w-0">Receitas vs Despesas</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Receitas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium">Receitas</span>
              </div>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(receitas)}
              </span>
            </div>
            <Progress value={percentualReceitas} className="h-2 bg-muted" />
            <p className="text-xs text-muted-foreground mt-1">
              {percentualReceitas.toFixed(1)}% do total
            </p>
          </div>

          {/* Despesas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium">Despesas</span>
              </div>
              <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(despesas)}
              </span>
            </div>
            <Progress value={percentualDespesas} className="h-2 bg-muted" />
            <p className="text-xs text-muted-foreground mt-1">
              {percentualDespesas.toFixed(1)}% do total
            </p>
          </div>

          {/* Saldo Líquido */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Saldo Líquido</span>
              <span className={cn(
                "text-lg font-bold",
                saldo >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}>
                {formatCurrency(saldo)}
              </span>
            </div>
            {receitas > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {percentualSaldo >= 0 ? '+' : ''}{percentualSaldo.toFixed(1)}% sobre receitas
              </p>
            )}
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Clique para ver relatórios detalhados
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
