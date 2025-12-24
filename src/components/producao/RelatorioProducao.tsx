import { useMemo, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  Zap,
  Download,
  CalendarIcon,
  Filter
} from 'lucide-react';
import { useProducaoData, STATUS_ITEM_LABELS, PRIORIDADE_LABELS } from '@/hooks/useProducaoData';
import { TipBanner } from '@/components/ui/TipBanner';
import { cn } from '@/lib/utils';
import { differenceInHours, differenceInDays, parseISO, format, isWithinInterval, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

const COLORS = ['#6b7280', '#f97316', '#3b82f6', '#6366f1', '#8b5cf6', '#22c55e'];

export function RelatorioProducao() {
  const { pedidos, isLoading } = useProducaoData();
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(new Date()),
  });
  const [isExporting, setIsExporting] = useState(false);

  // Filter pedidos by date range
  const pedidosFiltrados = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return pedidos;
    
    return pedidos.filter(p => {
      const dataEntrada = parseISO(p.data_entrada);
      return isWithinInterval(dataEntrada, { start: dateRange.from!, end: dateRange.to! });
    });
  }, [pedidos, dateRange]);

  // Calculate metrics
  const metricas = useMemo(() => {
    if (!pedidosFiltrados.length) return null;

    const allItems = pedidosFiltrados.flatMap(p => p.itens_pedido || []);
    
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
    const prioridadeDistribution = pedidosFiltrados.reduce((acc, p) => {
      acc[p.prioridade] = (acc[p.prioridade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Overdue orders
    const hoje = new Date();
    const atrasados = pedidosFiltrados.filter(p => {
      if (!p.previsao_entrega || p.status_producao === 'entregue') return false;
      return parseISO(p.previsao_entrega) < hoje;
    });

    return {
      totalItens: allItems.length,
      totalPedidos: pedidosFiltrados.length,
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
  }, [pedidosFiltrados]);

  // Export to PDF function
  const exportarPDF = async () => {
    if (!metricas) return;
    
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(30, 64, 175);
      doc.text('Relatório de Produtividade', pageWidth / 2, 20, { align: 'center' });
      
      // Date range
      doc.setFontSize(10);
      doc.setTextColor(100);
      const periodoTexto = dateRange.from && dateRange.to 
        ? `Período: ${format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} a ${format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}`
        : 'Todos os períodos';
      doc.text(periodoTexto, pageWidth / 2, 28, { align: 'center' });
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, 34, { align: 'center' });
      
      // KPIs section
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Indicadores Principais', 14, 48);
      
      autoTable(doc, {
        startY: 52,
        head: [['Indicador', 'Valor']],
        body: [
          ['Total em Produção', `${metricas.totalItens} itens (${metricas.totalPedidos} pedidos)`],
          ['Lead Time Médio', metricas.leadTimeMedio !== null ? `${metricas.leadTimeMedio} dias` : 'N/A'],
          ['Eficiência (Prontos)', `${metricas.eficiencia}%`],
          ['Pedidos Atrasados', `${metricas.atrasados}`],
          ['Tempo Médio Corte', metricas.tempoMedioPorEtapa.corte !== null ? `${metricas.tempoMedioPorEtapa.corte}h` : 'Sem dados'],
          ['Tempo Médio Costura', metricas.tempoMedioPorEtapa.costura !== null ? `${metricas.tempoMedioPorEtapa.costura}h` : 'Sem dados'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
      });
      
      // Bottleneck section
      const tableEndY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text('Gargalo Identificado', 14, tableEndY);
      
      if (metricas.gargalo) {
        autoTable(doc, {
          startY: tableEndY + 4,
          head: [['Etapa', 'Itens', 'Percentual']],
          body: [[
            metricas.gargalo.label,
            `${metricas.gargalo.count}`,
            `${metricas.gargalo.percentage.toFixed(1)}%`
          ]],
          theme: 'striped',
          headStyles: { fillColor: [249, 115, 22] },
        });
      }
      
      // Status distribution
      const bottleneckEndY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text('Distribuição por Status', 14, bottleneckEndY);
      
      autoTable(doc, {
        startY: bottleneckEndY + 4,
        head: [['Status', 'Quantidade', 'Percentual']],
        body: metricas.statusDistribution.map(item => [
          item.label,
          `${item.count}`,
          `${item.percentage.toFixed(1)}%`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });
      
      // Priority distribution
      const statusEndY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text('Distribuição por Prioridade', 14, statusEndY);
      
      autoTable(doc, {
        startY: statusEndY + 4,
        head: [['Prioridade', 'Quantidade']],
        body: metricas.prioridadeDistribution.map(item => [
          item.name,
          `${item.value}`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246] },
      });
      
      // Save
      const fileName = `relatorio-producao-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    } finally {
      setIsExporting(false);
    }
  };

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

      {/* Filtros e Ações */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Período:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from && dateRange.to ? (
                  <>
                    {format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} - {format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}
                  </>
                ) : (
                  <span>Selecione o período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <Button onClick={exportarPDF} disabled={isExporting || !metricas}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Exportando...' : 'Exportar PDF'}
        </Button>
      </div>

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
