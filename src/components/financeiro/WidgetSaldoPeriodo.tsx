import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { format, subDays } from 'date-fns';

interface WidgetSaldoPeriodoProps {
  saldoAtual: number;
  dataInicio: Date;
  dataFim: Date;
  onNavigate?: (view: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function WidgetSaldoPeriodo({ 
  saldoAtual, 
  dataInicio, 
  dataFim,
  onNavigate 
}: WidgetSaldoPeriodoProps) {
  const { organizationId } = useOrganizationContext();
  
  // Calcular período anterior (mesmo intervalo de dias)
  const diasPeriodo = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
  const dataInicioAnterior = subDays(dataInicio, diasPeriodo);
  const dataFimAnterior = subDays(dataInicio, 1);
  
  const { data: saldoAnterior, isLoading } = useQuery({
    queryKey: ['saldo-periodo-anterior', dataInicioAnterior, dataFimAnterior, organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .select('tipo, valor')
        .eq('organization_id', organizationId)
        .gte('data_lancamento', format(dataInicioAnterior, 'yyyy-MM-dd'))
        .lte('data_lancamento', format(dataFimAnterior, 'yyyy-MM-dd'));

      if (error) throw error;
      
      let entradas = 0;
      let saidas = 0;
      
      data?.forEach(l => {
        if (l.tipo === 'entrada') {
          entradas += Number(l.valor);
        } else {
          saidas += Number(l.valor);
        }
      });
      
      return entradas - saidas;
    },
    enabled: !!organizationId,
  });

  const diferenca = saldoAnterior !== undefined ? saldoAtual - saldoAnterior : 0;
  const percentual = saldoAnterior !== undefined && saldoAnterior !== 0 
    ? ((diferenca / Math.abs(saldoAnterior)) * 100).toFixed(1)
    : null;

  const isPositivo = saldoAtual >= 0;
  const isMelhorando = diferenca > 0;

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
      className={cn(
        "min-h-[280px] sm:min-h-[320px] lg:min-h-[360px] flex flex-col cursor-pointer hover:shadow-md transition-shadow",
        isPositivo ? "border-emerald-200 dark:border-emerald-800" : "border-red-200 dark:border-red-800"
      )}
      onClick={() => onNavigate?.('finFluxoPrevisto')}
    >
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Wallet className={cn(
            "h-4 w-4 shrink-0",
            isPositivo ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          )} />
          <span className="flex-1 min-w-0">Saldo do Período</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div>
          <div className={cn(
            "text-3xl sm:text-4xl font-bold mb-2",
            isPositivo ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          )}>
            {formatCurrency(saldoAtual)}
          </div>
          
          {saldoAnterior !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              {isMelhorando ? (
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : diferenca < 0 ? (
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              ) : (
                <Minus className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={cn(
                isMelhorando ? "text-emerald-600 dark:text-emerald-400" : 
                diferenca < 0 ? "text-red-600 dark:text-red-400" : 
                "text-muted-foreground"
              )}>
                {diferenca >= 0 ? '+' : ''}{formatCurrency(diferenca)}
                {percentual && ` (${percentual}%)`}
              </span>
              <span className="text-muted-foreground text-xs">
                vs período anterior
              </span>
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Clique para ver fluxo de caixa detalhado
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
