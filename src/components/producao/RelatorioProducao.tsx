import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2,
  Timer,
  Zap
} from 'lucide-react';
import { useProducaoData, STATUS_ITEM_LABELS, PRIORIDADE_LABELS } from '@/hooks/useProducaoData';
import { TipBanner } from '@/components/ui/TipBanner';
import { cn } from '@/lib/utils';
import { differenceInHours, differenceInDays, parseISO } from 'date-fns';

const COLORS = ['#6b7280', '#f97316', '#3b82f6', '#6366f1', '#8b5cf6', '#22c55e'];

export function RelatorioProducao() {
  const { pedidos, isLoading } = useProducaoData();

  // Calculate metrics
  const metricas = useMemo(() => {
    if (!pedidos.length) return null;

    const allItems = pedidos.flatMap(p => p.itens_pedido || []);
    
    // Count items by status
    const statusCounts: Record<string, number> = {};
    allItems.forEach(item => {
      statusCounts[item.status_item] = (statusCounts[item.status_item] || 0) + 1;
    });

    // Get label string from STATUS_ITEM_LABELS

    // Calculate average time in each stage (based on date fields)
    const tempoMedioPorEtapa: Record<string, { total: number; count: number }> = {
      corte: { total: 0, count: 0 },
      costura: { total: 0, count: 0 },
    };

    allItems.forEach(item => {
      // Calculate corte time
      if (item.data_inicio_corte && item.data_fim_corte) {
        const inicio = parseISO(item.data_inicio_corte);
        const fim = parseISO(item.data_fim_corte);
        const horas = differenceInHours(fim, inicio);
        if (horas > 0) {
          tempoMedioPorEtapa.corte.total += horas;
          tempoMedioPorEtapa.corte.count++;
        }
      }
      
      // Calculate costura time
      if (item.data_inicio_costura && item.data_fim_costura) {
        const inicio = parseISO(item.data_inicio_costura);
        const fim = parseISO(item.data_fim_costura);
        const horas = differenceInHours(fim, inicio);
        if (horas > 0) {
          tempoMedioPorEtapa.costura.total += horas;
          tempoMedioPorEtapa.costura.count++;
        }
      }
    });

    // Calculate lead time (from order creation to ready)
    const leadTimes: number[] = [];
    pedidos.forEach(p => {
      if (p.data_pronto) {
        const dias = differenceInDays(parseISO(p.data_pronto), parseISO(p.data_entrada));
        if (dias >= 0) leadTimes.push(dias);
      }
    });

    // Identify bottlenecks (stages with most items)
    const getStatusLabel = (status: string): string => {
      const labelData = STATUS_ITEM_LABELS[status];
      return typeof labelData === 'string' ? labelData : status;
    };

    const statusDistribution = Object.entries(statusCounts)
      .map(([status, count]) => ({
        status,
        label: getStatusLabel(status),
        count,
        percentage: (count / allItems.length) * 100
      }))
      .sort((a, b) => b.count - a.count);

    // Priority distribution
    const prioridadeDistribution = pedidos.reduce((acc, p) => {
      acc[p.prioridade] = (acc[p.prioridade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Overdue orders
    const hoje = new Date();
    const atrasados = pedidos.filter(p => {
      if (!p.previsao_entrega || p.status_producao === 'entregue') return false;
      return parseISO(p.previsao_entrega) < hoje;
    });

    return {
      totalItens: allItems.length,
      totalPedidos: pedidos.length,
      statusDistribution,
      tempoMedioPorEtapa: {
        corte: tempoMedioPorEtapa.corte.count > 0 
          ? Math.round(tempoMedioPorEtapa.corte.total / tempoMedioPorEtapa.corte.count) 
          : null,
        costura: tempoMedioPorEtapa.costura.count > 0 
          ? Math.round(tempoMedioPorEtapa.costura.total / tempoMedioPorEtapa.costura.count) 
          : null,
      },
      leadTimeMedio: leadTimes.length > 0 
        ? Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length) 
        : null,
      prioridadeDistribution: Object.entries(prioridadeDistribution).map(([key, value]) => ({
        name: PRIORIDADE_LABELS[key]?.label || key,
        value,
        color: PRIORIDADE_LABELS[key]?.color || 'bg-gray-500'
      })),
      atrasados: atrasados.length,
      gargalo: statusDistribution[0], // Most crowded stage
      eficiencia: allItems.length > 0 
        ? Math.round((statusCounts['pronto'] || 0) / allItems.length * 100)
        : 0
    };
  }, [pedidos]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!metricas) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Sem dados de produção para análise.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = metricas.statusDistribution.map((item, index) => ({
    name: item.label,
    quantidade: item.count,
    fill: COLORS[index % COLORS.length]
  }));

  return (
    <div className="space-y-6">
      <TipBanner
        id="relatorio-producao-tip"
        title="Relatório de Produtividade"
        variant="info"
      >
        Acompanhe métricas de tempo, identifique gargalos e otimize seu processo produtivo.
        Os dados são calculados com base no histórico de movimentação dos itens.
      </TipBanner>

      {/* KPIs principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total em Produção</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.totalItens}</div>
            <p className="text-xs text-muted-foreground">
              {metricas.totalPedidos} pedidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lead Time Médio</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricas.leadTimeMedio !== null ? `${metricas.leadTimeMedio} dias` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Da entrada até pronto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Eficiência</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.eficiencia}%</div>
            <Progress value={metricas.eficiencia} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Itens prontos
            </p>
          </CardContent>
        </Card>

        <Card className={cn(metricas.atrasados > 0 && "border-destructive")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
            <AlertTriangle className={cn("h-4 w-4", metricas.atrasados > 0 ? "text-destructive" : "text-muted-foreground")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", metricas.atrasados > 0 && "text-destructive")}>
              {metricas.atrasados}
            </div>
            <p className="text-xs text-muted-foreground">
              Pedidos após previsão
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tempo médio por etapa e Gargalo */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tempo Médio por Etapa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Corte</span>
              <Badge variant="outline">
                {metricas.tempoMedioPorEtapa.corte !== null 
                  ? `${metricas.tempoMedioPorEtapa.corte}h` 
                  : 'Sem dados'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Costura</span>
              <Badge variant="outline">
                {metricas.tempoMedioPorEtapa.costura !== null 
                  ? `${metricas.tempoMedioPorEtapa.costura}h` 
                  : 'Sem dados'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              * Baseado em itens com datas de início e fim registradas
            </p>
          </CardContent>
        </Card>

        <Card className={cn(metricas.gargalo && metricas.gargalo.percentage > 40 && "border-orange-500")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Gargalo Identificado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metricas.gargalo ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">{metricas.gargalo.label}</span>
                  <Badge variant="secondary">
                    {metricas.gargalo.count} itens
                  </Badge>
                </div>
                <Progress value={metricas.gargalo.percentage} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {metricas.gargalo.percentage.toFixed(1)}% dos itens estão nesta etapa
                </p>
                {metricas.gargalo.percentage > 40 && (
                  <p className="text-sm text-orange-600">
                    ⚠️ Considere alocar mais recursos para esta etapa
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum gargalo identificado</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="quantidade" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prioridades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metricas.prioridadeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {metricas.prioridadeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status detalhado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Detalhamento por Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            {metricas.statusDistribution.map((item, index) => (
              <div 
                key={item.status}
                className="p-3 rounded-lg border text-center"
                style={{ borderColor: COLORS[index % COLORS.length] }}
              >
                <div className="text-2xl font-bold">{item.count}</div>
                <div className="text-sm text-muted-foreground">{item.label}</div>
                <div className="text-xs text-muted-foreground">
                  {item.percentage.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
