/**
 * Analytics Dashboard Component
 * 
 * Exibe métricas e dashboard de analytics para a organização
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Users, 
  ShoppingCart, 
  DollarSign,
  MousePointer,
  Target,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { 
  useAnalyticsDashboard, 
  useDailyMetrics, 
  useFunnelMetrics,
  useConversionMetrics,
  getPeriods,
  type PeriodFilter
} from '@/hooks/useAnalytics';
import { formatCurrency, formatPercent } from '@/lib/formatters';

// Helper function para formatar números
function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

// ===========================================
// COMPONENTES AUXILIARES
// ===========================================

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon: React.ReactNode;
  loading?: boolean;
}

function MetricCard({ title, value, description, trend, trendValue, icon, loading }: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-4 w-4 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <div className="flex items-center gap-1 mt-1">
            {trend && getTrendIcon()}
            <p className={`text-xs ${getTrendColor()}`}>
              {trendValue || description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===========================================
// COMPONENTE: GRÁFICO DE FUNIL
// ===========================================

function FunnelChart({ metrics, loading }: { metrics: ReturnType<typeof useFunnelMetrics>['data']; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Sem dados de funil disponíveis</p>
        <p className="text-sm">Os dados serão coletados automaticamente conforme os usuários interagem com o sistema</p>
      </div>
    );
  }

  // Usar o último dia com dados
  const latestData = metrics[metrics.length - 1];
  const maxValue = Math.max(
    latestData?.visitas_landing || 1,
    latestData?.cliques_whatsapp || 1,
    latestData?.orcamentos_criados || 1,
    latestData?.orcamentos_aprovados || 1
  );

  const stages = [
    { label: 'Visitas Landing', value: latestData?.visitas_landing || 0, color: 'bg-blue-500' },
    { label: 'Cliques WhatsApp', value: latestData?.cliques_whatsapp || 0, color: 'bg-green-500' },
    { label: 'Orçamentos Criados', value: latestData?.orcamentos_criados || 0, color: 'bg-purple-500' },
    { label: 'Orçamentos Aprovados', value: latestData?.orcamentos_aprovados || 0, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-4">
      {stages.map((stage, index) => {
        const percentage = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
        const prevStage = stages[index - 1];
        const conversionRate = prevStage && prevStage.value > 0 
          ? ((stage.value / prevStage.value) * 100).toFixed(1)
          : null;

        return (
          <div key={stage.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{stage.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold">{formatNumber(stage.value)}</span>
                {conversionRate && (
                  <Badge variant="secondary" className="text-xs">
                    {conversionRate}% conv.
                  </Badge>
                )}
              </div>
            </div>
            <div className="h-8 bg-muted rounded-md overflow-hidden">
              <div 
                className={`h-full ${stage.color} transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
      
      {latestData?.taxa_conversao > 0 && (
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="font-medium">Taxa de Conversão Geral</span>
            <Badge className="bg-primary">
              {formatPercent(latestData.taxa_conversao / 100)}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================
// COMPONENTE: MÉTRICAS DIÁRIAS
// ===========================================

function DailyMetricsTable({ metrics, loading }: { metrics: ReturnType<typeof useDailyMetrics>['data']; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Sem dados históricos</p>
        <p className="text-sm">As métricas serão coletadas automaticamente</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-2">Data</th>
            <th className="text-right py-2 px-2">Visitas</th>
            <th className="text-right py-2 px-2">Orçamentos</th>
            <th className="text-right py-2 px-2">Aprovados</th>
            <th className="text-right py-2 px-2">Receita</th>
          </tr>
        </thead>
        <tbody>
          {metrics.slice(0, 10).map((metric) => (
            <tr key={metric.id} className="border-b border-muted hover:bg-muted/50">
              <td className="py-2 px-2">
                {new Date(metric.metric_date).toLocaleDateString('pt-BR')}
              </td>
              <td className="text-right py-2 px-2">{formatNumber(metric.page_views)}</td>
              <td className="text-right py-2 px-2">{formatNumber(metric.orcamentos_criados)}</td>
              <td className="text-right py-2 px-2">{formatNumber(metric.orcamentos_convertidos)}</td>
              <td className="text-right py-2 px-2 font-medium">
                {formatCurrency(metric.receita_total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===========================================
// COMPONENTE PRINCIPAL
// ===========================================

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<string>('30d');
  const periods = getPeriods();
  
  const { dashboard, isLoading } = useAnalyticsDashboard(period);
  const { data: dailyMetrics, isLoading: loadingDaily } = useDailyMetrics(period);
  const { data: funnelMetrics, isLoading: loadingFunnel } = useFunnelMetrics(period);
  const { data: conversionMetrics, isLoading: loadingConversion } = useConversionMetrics(period);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Analytics
          </h1>
          <p className="text-muted-foreground">
            Métricas e insights do seu negócio
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            {Object.entries(periods).map(([key, p]) => (
              <option key={key} value={key}>{p.label}</option>
            ))}
          </select>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Orçamentos"
          value={formatNumber(dashboard?.totalOrcamentos || 0)}
          description={`${formatNumber(dashboard?.orcamentosAprovados || 0)} aprovados`}
          trend={dashboard?.tendenciaOrcamentos}
          icon={<ShoppingCart className="h-4 w-4" />}
          loading={isLoading}
        />
        
        <MetricCard
          title="Taxa de Conversão"
          value={formatPercent((dashboard?.taxaConversao || 0) / 100)}
          description="Dos orçamentos criados"
          trend={dashboard?.tendenciaOrcamentos}
          icon={<Target className="h-4 w-4" />}
          loading={isLoading}
        />
        
        <MetricCard
          title="Receita Total"
          value={formatCurrency(dashboard?.receitaTotal || 0)}
          description={`Ticket médio: ${formatCurrency(dashboard?.ticketMedio || 0)}`}
          trend={dashboard?.tendenciaReceita}
          icon={<DollarSign className="h-4 w-4" />}
          loading={isLoading}
        />
        
        <MetricCard
          title="Visitas"
          value={formatNumber(dashboard?.visitasTotais || 0)}
          description={`${formatNumber(dashboard?.visitasSemana || 0)} esta semana`}
          icon={<Users className="h-4 w-4" />}
          loading={isLoading}
        />
      </div>

      {/* Tabs de Detalhes */}
      <Tabs defaultValue="funil" className="space-y-4">
        <TabsList>
          <TabsTrigger value="funil" className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            Funil de Conversão
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="detalhes" className="flex items-center gap-1">
            <MousePointer className="h-4 w-4" />
            Detalhes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="funil">
          <Card>
            <CardHeader>
              <CardTitle>Funil de Conversão</CardTitle>
              <CardDescription>
                Acompanhe a jornada do visitante até a conversão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FunnelChart metrics={funnelMetrics} loading={loadingFunnel} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Histórico Diário</CardTitle>
              <CardDescription>
                Métricas agregadas por dia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DailyMetricsTable metrics={dailyMetrics} loading={loadingDaily} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detalhes">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Conversão</CardTitle>
              <CardDescription>
                Detalhamento dos orçamentos no período: {conversionMetrics?.periodo}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingConversion ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : conversionMetrics ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Orçamentos Pendentes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatNumber(conversionMetrics.orcamentosPendentes)}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Orçamentos Recusados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {formatNumber(conversionMetrics.orcamentosRecusados)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Sem dados de conversão disponíveis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dica */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <BarChart3 className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h4 className="font-medium">Dica de Analytics</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Os dados de analytics são coletados automaticamente conforme os usuários 
                interagem com sua landing page e sistema. Certifique-se de que o rodízio 
                de WhatsApp está configurado para melhor rastreamento de conversões.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AnalyticsDashboard;
