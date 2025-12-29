import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Award,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  ComposedChart,
  Area
} from 'recharts';
import { cn } from '@/lib/utils';
import { BreadcrumbsFinanceiro } from './BreadcrumbsFinanceiro';

type Periodo = '3m' | '6m' | '12m' | 'all';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatCompact = (value: number) => {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}K`;
  return formatCurrency(value);
};

const COLORS = [
  'hsl(var(--primary))',
  'hsl(142 70% 45%)',
  'hsl(221 83% 53%)',
  'hsl(47 95% 53%)',
  'hsl(262 83% 58%)',
  'hsl(24 95% 53%)',
  'hsl(340 82% 52%)',
  'hsl(180 70% 45%)'
];

interface VendedorStats {
  vendedor: string;
  totalOrcamentos: number;
  valorTotal: number;
  orcamentosPagos: number;
  valorPago: number;
  taxaConversao: number;
  comissaoTotal: number;
  comissaoPendente: number;
  comissaoPaga: number;
  ticketMedio: number;
}

interface RelatorioVendedoresProps {
  onVisualizarOrcamento?: (orcamentoId: string) => void;
  onNavigate?: (view: string) => void;
}

export function RelatorioVendedores({ onVisualizarOrcamento, onNavigate }: RelatorioVendedoresProps) {
  const [periodo, setPeriodo] = useState<Periodo>('6m');
  const [vendedorSelecionado, setVendedorSelecionado] = useState<string>('todos');

  const meses = periodo === '3m' ? 3 : periodo === '6m' ? 6 : periodo === '12m' ? 12 : 120;
  const dataInicio = startOfMonth(subMonths(new Date(), meses - 1));
  const dataFim = endOfMonth(new Date());

  // Buscar comissões
  const { data: comissoes = [], isLoading: loadingComissoes } = useQuery({
    queryKey: ['comissoes-relatorio', periodo],
    queryFn: async () => {
      let query = supabase
        .from('comissoes')
        .select(`
          *,
          orcamento:orcamentos(id, codigo, cliente_nome, total_geral, status, created_at)
        `)
        .order('created_at', { ascending: false });

      if (periodo !== 'all') {
        query = query
          .gte('created_at', format(dataInicio, 'yyyy-MM-dd'))
          .lte('created_at', format(dataFim, 'yyyy-MM-dd'));
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Buscar orçamentos para calcular conversão
  const { data: orcamentos = [], isLoading: loadingOrcamentos } = useQuery({
    queryKey: ['orcamentos-relatorio-vendedores', periodo],
    queryFn: async () => {
      let query = supabase
        .from('orcamentos')
        .select('id, codigo, cliente_nome, total_geral, total_com_desconto, custo_total, status, created_at')
        .order('created_at', { ascending: false });

      if (periodo !== 'all') {
        query = query
          .gte('created_at', format(dataInicio, 'yyyy-MM-dd'))
          .lte('created_at', format(dataFim, 'yyyy-MM-dd'));
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Calcular estatísticas por vendedor
  const vendedoresStats = useMemo<VendedorStats[]>(() => {
    const vendedorMap: Record<string, VendedorStats> = {};

    // Agrupar comissões por vendedor
    comissoes.forEach(c => {
      const vendedor = c.vendedor_nome;
      if (!vendedorMap[vendedor]) {
        vendedorMap[vendedor] = {
          vendedor,
          totalOrcamentos: 0,
          valorTotal: 0,
          orcamentosPagos: 0,
          valorPago: 0,
          taxaConversao: 0,
          comissaoTotal: 0,
          comissaoPendente: 0,
          comissaoPaga: 0,
          ticketMedio: 0
        };
      }

      vendedorMap[vendedor].comissaoTotal += Number(c.valor_comissao);
      vendedorMap[vendedor].totalOrcamentos += 1;
      vendedorMap[vendedor].valorTotal += Number(c.valor_base);

      if (c.status === 'pago') {
        vendedorMap[vendedor].comissaoPaga += Number(c.valor_comissao);
        vendedorMap[vendedor].orcamentosPagos += 1;
        vendedorMap[vendedor].valorPago += Number(c.valor_base);
      } else {
        vendedorMap[vendedor].comissaoPendente += Number(c.valor_comissao);
      }
    });

    // Calcular métricas derivadas
    return Object.values(vendedorMap)
      .map(v => ({
        ...v,
        taxaConversao: v.totalOrcamentos > 0 ? (v.orcamentosPagos / v.totalOrcamentos) * 100 : 0,
        ticketMedio: v.totalOrcamentos > 0 ? v.valorTotal / v.totalOrcamentos : 0
      }))
      .sort((a, b) => b.valorTotal - a.valorTotal);
  }, [comissoes]);

  // Dados filtrados
  const dadosFiltrados = useMemo(() => {
    if (vendedorSelecionado === 'todos') return vendedoresStats;
    return vendedoresStats.filter(v => v.vendedor === vendedorSelecionado);
  }, [vendedoresStats, vendedorSelecionado]);

  // Totais gerais
  const totais = useMemo(() => {
    const stats = vendedorSelecionado === 'todos' ? vendedoresStats : dadosFiltrados;
    return {
      vendedores: stats.length,
      valorTotal: stats.reduce((sum, v) => sum + v.valorTotal, 0),
      valorPago: stats.reduce((sum, v) => sum + v.valorPago, 0),
      comissaoTotal: stats.reduce((sum, v) => sum + v.comissaoTotal, 0),
      comissaoPaga: stats.reduce((sum, v) => sum + v.comissaoPaga, 0),
      comissaoPendente: stats.reduce((sum, v) => sum + v.comissaoPendente, 0),
      taxaConversaoMedia: stats.length > 0 
        ? stats.reduce((sum, v) => sum + v.taxaConversao, 0) / stats.length 
        : 0,
      ticketMedio: stats.length > 0 
        ? stats.reduce((sum, v) => sum + v.ticketMedio, 0) / stats.length 
        : 0
    };
  }, [vendedoresStats, dadosFiltrados, vendedorSelecionado]);

  // Dados para gráfico de barras - vendas por vendedor
  const dadosBarras = useMemo(() => {
    return vendedoresStats.slice(0, 8).map(v => ({
      nome: v.vendedor.length > 15 ? v.vendedor.substring(0, 15) + '...' : v.vendedor,
      nomeCompleto: v.vendedor,
      pago: v.valorPago,
      pendente: v.valorTotal - v.valorPago,
      comissao: v.comissaoTotal
    }));
  }, [vendedoresStats]);

  // Dados para gráfico de pizza - distribuição de comissões
  const dadosPizza = useMemo(() => {
    return vendedoresStats.slice(0, 6).map((v, i) => ({
      name: v.vendedor,
      value: v.comissaoTotal,
      color: COLORS[i % COLORS.length]
    }));
  }, [vendedoresStats]);

  // Dados para evolução mensal
  const dadosMensal = useMemo(() => {
    const porMes: Record<string, Record<string, number>> = {};
    
    comissoes.forEach(c => {
      const mesKey = format(new Date(c.created_at), 'yyyy-MM');
      const mesLabel = format(new Date(c.created_at), 'MMM/yy', { locale: ptBR });
      
      if (!porMes[mesKey]) {
        porMes[mesKey] = { mes: mesLabel } as any;
      }
      
      const vendedor = c.vendedor_nome;
      if (!porMes[mesKey][vendedor]) {
        porMes[mesKey][vendedor] = 0;
      }
      porMes[mesKey][vendedor] += Number(c.valor_comissao);
    });

    return Object.entries(porMes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [comissoes]);

  // Top vendedores para o gráfico de evolução
  const topVendedores = useMemo(() => {
    return vendedoresStats.slice(0, 4).map(v => v.vendedor);
  }, [vendedoresStats]);

  const isLoading = loadingComissoes || loadingOrcamentos;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <BreadcrumbsFinanceiro currentView="finVendedores" onNavigate={onNavigate} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Desempenho por Vendedor
          </h1>
          <p className="text-muted-foreground">Análise de conversão, vendas e comissões</p>
        </div>
        <div className="flex gap-2">
          <Select value={vendedorSelecionado} onValueChange={setVendedorSelecionado}>
            <SelectTrigger className="w-[180px]">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Vendedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos vendedores</SelectItem>
              {vendedoresStats.map(v => (
                <SelectItem key={v.vendedor} value={v.vendedor}>
                  {v.vendedor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
            <SelectTrigger className="w-[130px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">3 meses</SelectItem>
              <SelectItem value="6m">6 meses</SelectItem>
              <SelectItem value="12m">12 meses</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Vendedores Ativos</p>
                <p className="text-2xl font-bold">{totais.vendedores}</p>
              </div>
              <Users className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Valor Total Vendido</p>
                <p className="text-2xl font-bold text-primary">{formatCompact(totais.valorTotal)}</p>
                <p className="text-xs text-muted-foreground">{formatCompact(totais.valorPago)} pago</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Comissões Totais</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCompact(totais.comissaoTotal)}
                </p>
                <div className="flex gap-2 text-xs mt-1">
                  <span className="text-emerald-600">{formatCompact(totais.comissaoPaga)} pago</span>
                  <span className="text-amber-600">{formatCompact(totais.comissaoPendente)} pend.</span>
                </div>
              </div>
              <Award className="h-8 w-8 text-emerald-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Conversão Média</p>
                <p className="text-2xl font-bold">{totais.taxaConversaoMedia.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  Ticket: {formatCompact(totais.ticketMedio)}
                </p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por vendedor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Vendas por Vendedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dadosBarras.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosBarras} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={(v) => formatCompact(v)} />
                    <YAxis dataKey="nome" type="category" width={100} className="text-xs" />
                    <RechartsTooltip
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === 'pago' ? 'Valor Pago' : name === 'pendente' ? 'Pendente' : 'Comissão'
                      ]}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.nomeCompleto || label}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="pago" name="Pago" stackId="a" fill="hsl(142 70% 45%)" />
                    <Bar dataKey="pendente" name="Pendente" stackId="a" fill="hsl(47 95% 53%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados de vendedores
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuição de comissões */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="h-4 w-4" />
              Distribuição de Comissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dadosPizza.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosPizza}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {dadosPizza.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend 
                      formatter={(value, entry: any) => (
                        <span className="text-xs">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados de comissões
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Evolução mensal */}
      {dadosMensal.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Evolução Mensal de Comissões
            </CardTitle>
            <CardDescription>Top {topVendedores.length} vendedores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosMensal}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mes" className="text-xs" />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <RechartsTooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  {topVendedores.map((vendedor, i) => (
                    <Line
                      key={vendedor}
                      type="monotone"
                      dataKey={vendedor}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela detalhada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Ranking de Vendedores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-right">Orçamentos</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-right">Conversão</TableHead>
                <TableHead className="text-right">Ticket Médio</TableHead>
                <TableHead className="text-right">Comissão Total</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dadosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum vendedor encontrado
                  </TableCell>
                </TableRow>
              ) : (
                dadosFiltrados.map((v, index) => (
                  <TableRow key={v.vendedor}>
                    <TableCell>
                      {index < 3 ? (
                        <Badge 
                          variant={index === 0 ? 'default' : 'secondary'}
                          className={cn(
                            "w-6 h-6 flex items-center justify-center p-0",
                            index === 0 && "bg-amber-500 text-white",
                            index === 1 && "bg-slate-400 text-white",
                            index === 2 && "bg-amber-700 text-white"
                          )}
                        >
                          {index + 1}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">{index + 1}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{v.vendedor}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-emerald-600">{v.orcamentosPagos}</span>
                      <span className="text-muted-foreground">/{v.totalOrcamentos}</span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(v.valorTotal)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {v.taxaConversao >= 50 ? (
                          <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 text-amber-500" />
                        )}
                        <span className={cn(
                          v.taxaConversao >= 50 ? "text-emerald-600" : "text-amber-600"
                        )}>
                          {v.taxaConversao.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(v.ticketMedio)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-primary">
                      {formatCurrency(v.comissaoTotal)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {v.comissaoPaga > 0 && (
                          <Badge variant="default" className="text-[10px] bg-emerald-500">
                            {formatCompact(v.comissaoPaga)} pago
                          </Badge>
                        )}
                        {v.comissaoPendente > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {formatCompact(v.comissaoPendente)} pend.
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
