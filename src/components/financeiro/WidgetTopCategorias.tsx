import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tag, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { DespesaCategoria } from '@/hooks/useFinanceiroData';

interface WidgetTopCategoriasProps {
  categorias: DespesaCategoria[];
  isLoading?: boolean;
  onNavigate?: (view: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function WidgetTopCategorias({ 
  categorias, 
  isLoading,
  onNavigate 
}: WidgetTopCategoriasProps) {
  // Filtrar apenas despesas e pegar top 3
  const topCategorias = categorias
    .filter(c => c.valor > 0)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 3);

  const totalDespesas = categorias.reduce((sum, c) => sum + c.valor, 0);

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

  if (topCategorias.length === 0) {
    return (
      <Card className="min-h-[280px] sm:min-h-[320px] lg:min-h-[360px] flex flex-col">
        <CardHeader className="pb-2 shrink-0">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Tag className="h-4 w-4 shrink-0 text-primary" />
            <span className="flex-1 min-w-0">Top Categorias</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground text-center">
            Nenhuma despesa registrada no período
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-h-[280px] sm:min-h-[320px] lg:min-h-[360px] flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Tag className="h-4 w-4 shrink-0 text-primary" />
          <span className="flex-1 min-w-0">Top Categorias de Despesas</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {topCategorias.map((categoria, index) => (
            <div key={categoria.categoria}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div 
                    className="h-3 w-3 rounded-full shrink-0" 
                    style={{ backgroundColor: categoria.cor || '#6b7280' }}
                  />
                  <span className="text-sm font-medium break-words flex-1" title={categoria.categoria}>
                    {categoria.categoria}
                  </span>
                </div>
                <span className="text-sm font-semibold shrink-0 ml-2">
                  {formatCurrency(categoria.valor)}
                </span>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${categoria.percentual}%`,
                    backgroundColor: categoria.cor || '#6b7280'
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {categoria.percentual.toFixed(1)}% do total
              </p>
            </div>
          ))}
        </div>
        
        {categorias.length > 3 && (
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => onNavigate?.('finRelatorios')}
            >
              Ver todas as categorias
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
