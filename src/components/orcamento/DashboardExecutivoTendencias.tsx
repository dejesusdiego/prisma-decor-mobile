import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  Calendar,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useDashboardExecutivoMetricas } from '@/hooks/useDashboardExecutivoMetricas';
import { cn } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function DashboardExecutivoTendencias() {
  const { data, isLoading } = useDashboardExecutivoMetricas();
  const tendencias = data?.tendencias || [];
  const projecao = data?.projecaoMensal;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  const mesAtual = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });
  const progressoMes = projecao 
    ? Math.min((projecao.mesAtual / projecao.projecao) * 100, 100) 
    : 0;
  
  const tendenciaPositiva = projecao && projecao.projecao > projecao.baseHistorica;

  return (
    <div className="space-y-6">
      {/* Gráficos lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Receita Semanal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Receita por Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tendencias}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="semana" 
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Receita']}
                    labelFormatter={(label) => `Semana ${label}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="receita" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1}
                    fill="url(#colorReceita)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Conversões */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-500" />
              Conversões por Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tendencias}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="semana" 
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    allowDecimals={false}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'conversoes') return [value, 'Conversões'];
                      return [formatCurrency(value), 'Ticket Médio'];
                    }}
                    labelFormatter={(label) => `Semana ${label}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="conversoes" 
                    stroke="hsl(142.1 76.2% 36.3%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(142.1 76.2% 36.3%)', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projeção Mensal */}
      <Card className={cn(
        "border-l-4",
        tendenciaPositiva ? "border-l-emerald-500" : "border-l-amber-500"
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Projeção de Receita - {mesAtual}
            </CardTitle>
            <Badge variant={tendenciaPositiva ? "default" : "secondary"} className="gap-1">
              {tendenciaPositiva ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {tendenciaPositiva ? 'Acima da média' : 'Abaixo da média'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Realizado */}
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">Realizado até hoje</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(projecao?.mesAtual || 0)}
              </p>
            </div>
            
            {/* Projeção */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Projeção do mês</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(projecao?.projecao || 0)}
              </p>
            </div>
            
            {/* Base Histórica */}
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">Média últimos 3 meses</p>
              <p className="text-2xl font-bold">
                {formatCurrency(projecao?.baseHistorica || 0)}
              </p>
            </div>
            
            {/* Pipeline Convertido */}
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">Pipeline (estimado)</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(projecao?.pipelineConvertido || 0)}
              </p>
            </div>
          </div>
          
          {/* Barra de progresso */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>Progresso do mês</span>
              <span>{progressoMes.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progressoMes}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
