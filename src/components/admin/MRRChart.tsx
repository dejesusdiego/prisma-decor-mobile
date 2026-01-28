import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MRRHistoryPoint {
  month_label: string;
  month_date: string;
  mrr_value: number;
}

interface MRRChartProps {
  className?: string;
}

export function MRRChart({ className }: MRRChartProps) {
  const [history, setHistory] = useState<MRRHistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMRRHistory();
  }, []);

  const loadMRRHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: rpcError } = await (supabase as any)
        .rpc('get_mrr_history', { months_count: 12 });

      if (rpcError) throw rpcError;

      // Reverse to show chronological order
      const historyData: MRRHistoryPoint[] = data || [];
      setHistory([...historyData].reverse());
    } catch (err: any) {
      console.error('Error loading MRR history:', err);
      setError('Erro ao carregar histórico de MRR');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value / 100);
  };

  // Calculate max value for scaling
  const maxValue = Math.max(...history.map(h => h.mrr_value), 1);
  const minValue = Math.min(...history.map(h => h.mrr_value), 0);
  const range = maxValue - minValue || 1;

  // Calculate growth trend
  const calculateTrend = () => {
    if (history.length < 2) return { direction: 'neutral', value: 0 };
    
    const current = history[history.length - 1]?.mrr_value || 0;
    const previous = history[history.length - 2]?.mrr_value || 0;
    
    if (previous === 0) return { direction: current > 0 ? 'up' : 'neutral', value: 100 };
    
    const change = ((current - previous) / previous) * 100;
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      value: Math.abs(change)
    };
  };

  const trend = calculateTrend();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base font-medium">MRR ao Longo do Tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse flex space-x-2">
              <div className="w-3 h-3 bg-primary/30 rounded-full animate-bounce" />
              <div className="w-3 h-3 bg-primary/30 rounded-full animate-bounce [animation-delay:0.1s]" />
              <div className="w-3 h-3 bg-primary/30 rounded-full animate-bounce [animation-delay:0.2s]" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base font-medium">MRR ao Longo do Tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <p className="text-sm">{error}</p>
            <button
              onClick={loadMRRHistory}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">MRR ao Longo do Tempo</CardTitle>
        {trend.direction !== 'neutral' && (
          <div className={cn(
            "flex items-center gap-1 text-sm",
            trend.direction === 'up' ? "text-green-600" : "text-red-600"
          )}>
            {trend.direction === 'up' ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>{trend.value.toFixed(1)}% vs mês anterior</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[300px] relative">
          {history.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Sem dados disponíveis
            </div>
          ) : (
            <>
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(maxValue)}</span>
                <span>{formatCurrency((maxValue + minValue) / 2)}</span>
                <span>{formatCurrency(minValue)}</span>
              </div>

              {/* Chart area */}
              <div className="ml-16 h-full flex flex-col">
                {/* Bars */}
                <div className="flex-1 flex items-end gap-1 px-2">
                  {history.map((point, index) => {
                    const height = range > 0 
                      ? ((point.mrr_value - minValue) / range) * 100 
                      : 50;
                    
                    return (
                      <div
                        key={point.month_date}
                        className="flex-1 flex flex-col items-center gap-1 group"
                      >
                        {/* Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg border whitespace-nowrap z-10">
                          {formatCurrency(point.mrr_value)}
                        </div>
                        
                        {/* Bar */}
                        <div
                          className={cn(
                            "w-full max-w-[40px] rounded-t transition-all duration-500",
                            index === history.length - 1 
                              ? "bg-primary" 
                              : "bg-primary/40 hover:bg-primary/60"
                          )}
                          style={{ height: `${Math.max(height, 5)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* X-axis labels */}
                <div className="h-8 flex items-center gap-1 px-2 border-t">
                  {history.map((point, index) => (
                    <div
                      key={point.month_date}
                      className={cn(
                        "flex-1 text-center text-xs",
                        index === history.length - 1 
                          ? "text-foreground font-medium" 
                          : "text-muted-foreground"
                      )}
                    >
                      {point.month_label}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Summary stats */}
        {history.length > 0 && (
          <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">MRR Atual</p>
              <p className="text-lg font-semibold">
                {formatCurrency(history[history.length - 1]?.mrr_value || 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Média 12 meses</p>
              <p className="text-lg font-semibold">
                {formatCurrency(
                  history.reduce((acc, h) => acc + h.mrr_value, 0) / history.length
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Crescimento Total</p>
              <p className={cn(
                "text-lg font-semibold",
                (history[history.length - 1]?.mrr_value || 0) > (history[0]?.mrr_value || 0)
                  ? "text-green-600"
                  : "text-red-600"
              )}>
                {history[0]?.mrr_value > 0
                  ? `+${(((history[history.length - 1]?.mrr_value - history[0]?.mrr_value) / history[0]?.mrr_value) * 100).toFixed(1)}%`
                  : '0%'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
