import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  FileText,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Target,
  Percent,
  AlertTriangle,
  Calendar,
  RefreshCw,
  ArrowRight,
  BarChart3,
  PieChart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFinanceiroData } from '@/hooks/useFinanceiroData';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getStatusConfig, getStatusLabel } from '@/lib/statusOrcamento';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { HelpTooltip, InfoIcon } from '@/components/ui/HelpTooltip';
import { TipBanner } from '@/components/ui/TipBanner';

type PeriodoFiltro = '7dias' | '30dias' | 'mesAtual' | 'mesAnterior' | '90dias';

interface OrcamentoStats {
  total: number;
  valorTotal: number;
  pagos: number;
  valorPago: number;
  pendentes: number;
  valorPendente: number;
  ticketMedio: number;
  taxaConversao: number;
  custoTotal: number;
  lucroProjetado: number;
}

interface FunilItem {
  status: string;
  label: string;
  quantidade: number;
  valor: number;
  cor: string;
}

interface DashboardUnificadoProps {
  onNavigate: (view: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatCompact = (value: number) => {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}K`;
  return formatCurrency(value);
};

export function DashboardUnificado({ onNavigate }: DashboardUnificadoProps) {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mesAtual');
  const [orcamentoStats, setOrcamentoStats] = useState<OrcamentoStats>({
    total: 0,
    valorTotal: 0,
    pagos: 0,
    valorPago: 0,
    pendentes: 0,
    valorPendente: 0,
    ticketMedio: 0,
    taxaConversao: 0,
    custoTotal: 0,
    lucroProjetado: 0
  });
  const [funil, setFunil] = useState<FunilItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const getDateRange = () => {
    const hoje = new Date();
    switch (periodo) {
      case '7dias':
        return { inicio: subDays(hoje, 7), fim: hoje };
      case '30dias':
        return { inicio: subDays(hoje, 30), fim: hoje };
      case 'mesAtual':
        return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) };
      case 'mesAnterior':
        const mesAnterior = subMonths(hoje, 1);
        return { inicio: startOfMonth(mesAnterior), fim: endOfMonth(mesAnterior) };
      case '90dias':
        return { inicio: subDays(hoje, 90), fim: hoje };
      default:
        return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) };
    }
  };

  const { inicio, fim } = getDateRange();
  const { 
    resumo, 
    fluxoCaixa,
    contasPagarPendentes,
    contasReceberPendentes,
    isLoading: financeiroLoading,
    refetch: refetchFinanceiro 
  } = useFinanceiroData(inicio, fim);

  const periodoLabel = () => {
    switch (periodo) {
      case '7dias': return 'Últimos 7 dias';
      case '30dias': return 'Últimos 30 dias';
      case 'mesAtual': return format(new Date(), 'MMMM yyyy', { locale: ptBR });
      case 'mesAnterior': return format(subMonths(new Date(), 1), 'MMMM yyyy', { locale: ptBR });
      case '90dias': return 'Últimos 90 dias';
      default: return '';
    }
  };

  useEffect(() => {
    loadOrcamentoStats();
  }, [periodo]);

  const loadOrcamentoStats = async () => {
    setLoading(true);
    try {
      const { inicio, fim } = getDateRange();
      
      const { data, error } = await supabase
        .from('orcamentos')
        .select('total_geral, custo_total, status, created_at')
        .gte('created_at', inicio.toISOString())
        .lte('created_at', fim.toISOString());

      if (error) throw error;

      const total = data?.length || 0;
      const valorTotal = data?.reduce((sum, o) => sum + (o.total_geral || 0), 0) || 0;
      const custoTotal = data?.reduce((sum, o) => sum + (o.custo_total || 0), 0) || 0;
      
      const statusPagos = ['pago', 'pago_parcial', 'pago_40', 'pago_60'];
      const pagos = data?.filter(o => statusPagos.includes(o.status)).length || 0;
      const valorPago = data?.filter(o => statusPagos.includes(o.status))
        .reduce((sum, o) => sum + (o.total_geral || 0), 0) || 0;
      
      const statusPendentes = ['enviado', 'sem_resposta', 'finalizado'];
      const pendentes = data?.filter(o => statusPendentes.includes(o.status)).length || 0;
      const valorPendente = data?.filter(o => statusPendentes.includes(o.status))
        .reduce((sum, o) => sum + (o.total_geral || 0), 0) || 0;

      const enviadosTotal = data?.filter(o => [...statusPagos, ...statusPendentes, 'recusado'].includes(o.status)).length || 0;
      const taxaConversao = enviadosTotal > 0 ? (pagos / enviadosTotal) * 100 : 0;
      const ticketMedio = total > 0 ? valorTotal / total : 0;
      const lucroProjetado = valorPago - (custoTotal * (pagos / (total || 1)));

      setOrcamentoStats({
        total,
        valorTotal,
        pagos,
        valorPago,
        pendentes,
        valorPendente,
        ticketMedio,
        taxaConversao,
        custoTotal,
        lucroProjetado
      });

      // Funil de vendas
      const statusMap = [
        { status: 'rascunho', label: 'Rascunho', cor: 'hsl(var(--muted-foreground))' },
        { status: 'finalizado', label: 'Finalizado', cor: 'hsl(270 60% 55%)' },
        { status: 'enviado', label: 'Enviado', cor: 'hsl(45 93% 47%)' },
        { status: 'sem_resposta', label: 'Sem Resposta', cor: 'hsl(25 95% 53%)' },
        { status: 'pago_parcial', label: 'Pagos', cor: 'hsl(142 70% 40%)' },
      ];

      const funilData = statusMap.map(s => {
        const items = data?.filter(o => {
          if (s.status === 'pago_parcial') {
            return ['pago', 'pago_parcial', 'pago_40', 'pago_60'].includes(o.status);
          }
          return o.status === s.status;
        }) || [];
        return {
          ...s,
          quantidade: items.length,
          valor: items.reduce((sum, o) => sum + (o.total_geral || 0), 0),
        };
      });
      setFunil(funilData);

    } catch (error) {
      console.error('Erro ao carregar stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadOrcamentoStats();
    refetchFinanceiro();
  };

  const isLoadingAll = loading || financeiroLoading;

  // Dados para gráfico de barras comparativo
  const dadosComparativos = [
    { nome: 'Entradas', valor: resumo.totalEntradas, cor: 'hsl(142 70% 45%)' },
    { nome: 'Saídas', valor: resumo.totalSaidas, cor: 'hsl(0 84% 60%)' },
    { nome: 'Orçamentos', valor: orcamentoStats.valorTotal, cor: 'hsl(217 91% 60%)' },
    { nome: 'Pagos', valor: orcamentoStats.valorPago, cor: 'hsl(142 70% 40%)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Dashboard Unificado
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Calendar className="h-4 w-4" />
            {periodoLabel()} • Orçamentos + Financeiro
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoFiltro)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7dias">Últimos 7 dias</SelectItem>
              <SelectItem value="30dias">Últimos 30 dias</SelectItem>
              <SelectItem value="mesAtual">Mês Atual</SelectItem>
              <SelectItem value="mesAnterior">Mês Anterior</SelectItem>
              <SelectItem value="90dias">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoadingAll}>
            <RefreshCw className={cn("h-4 w-4", isLoadingAll && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Dica inicial */}
      <TipBanner id="dashboard-dica-inicial" variant="info" title="Bem-vindo ao Dashboard!">
        Este painel unifica dados de <strong>Orçamentos</strong> e <strong>Financeiro</strong> em uma única visão. 
        Use o filtro de período para analisar diferentes intervalos de tempo.
      </TipBanner>

      {/* Seção Orçamentos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Orçamentos
          </h2>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('dashboard')}>
            Ver detalhes <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <HelpTooltip content="Quantidade de orçamentos criados no período selecionado">
                      Total Orçamentos
                    </HelpTooltip>
                  </p>
                  <p className="text-xl font-bold">{orcamentoStats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-primary/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <HelpTooltip content="Soma do valor de todos os orçamentos, independente do status">
                      Valor Total
                    </HelpTooltip>
                  </p>
                  <p className="text-xl font-bold">{formatCompact(orcamentoStats.valorTotal)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <HelpTooltip content="Orçamentos com status pago, pago_parcial, pago_40 ou pago_60">
                      Pagos
                    </HelpTooltip>
                  </p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {orcamentoStats.pagos}
                  </p>
                  <p className="text-xs text-emerald-600/70">{formatCompact(orcamentoStats.valorPago)}</p>
                </div>
                <Target className="h-8 w-8 text-emerald-500/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <HelpTooltip content="Percentual de orçamentos enviados que foram convertidos em venda (pagos)">
                      Conversão
                    </HelpTooltip>
                  </p>
                  <p className="text-xl font-bold">{orcamentoStats.taxaConversao.toFixed(1)}%</p>
                </div>
                <Percent className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seção Financeiro */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Financeiro
          </h2>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('finDashboard')}>
            Ver detalhes <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className={cn(
            "border-l-4",
            resumo.saldo >= 0 ? "border-l-emerald-500" : "border-l-red-500"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Saldo</p>
                  <p className={cn(
                    "text-xl font-bold",
                    resumo.saldo >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {formatCompact(resumo.saldo)}
                  </p>
                </div>
                {resumo.saldo >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-emerald-500/30" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-500/30" />
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Entradas</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCompact(resumo.totalEntradas)}
                  </p>
                  <p className="text-xs text-muted-foreground">{resumo.quantidadeEntradas} lançamentos</p>
                </div>
                <ArrowUpCircle className="h-8 w-8 text-emerald-500/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Saídas</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    {formatCompact(resumo.totalSaidas)}
                  </p>
                  <p className="text-xs text-muted-foreground">{resumo.quantidadeSaidas} lançamentos</p>
                </div>
                <ArrowDownCircle className="h-8 w-8 text-red-500/30" />
              </div>
            </CardContent>
          </Card>
          <Card className={cn(
            resumo.contasAtrasadas > 0 && "bg-amber-50/50 dark:bg-amber-950/20 border-amber-500/50"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pendências</p>
                  <p className="text-xl font-bold">
                    {resumo.contasPagarPendentes + resumo.contasReceberPendentes}
                  </p>
                  {resumo.contasAtrasadas > 0 && (
                    <p className="text-xs text-amber-600">{resumo.contasAtrasadas} atrasada(s)</p>
                  )}
                </div>
                <AlertTriangle className={cn(
                  "h-8 w-8",
                  resumo.contasAtrasadas > 0 ? "text-amber-500/50" : "text-muted-foreground/30"
                )} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Gráficos lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Comparativo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Visão Geral Financeira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dadosComparativos} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tickFormatter={(v) => formatCompact(v)} />
                <YAxis type="category" dataKey="nome" width={80} />
                <RechartsTooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                  {dadosComparativos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Funil de Vendas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Funil de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPie>
                <Pie
                  data={funil.filter(f => f.quantidade > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="quantidade"
                  nameKey="label"
                  label={({ label, quantidade }) => `${label}: ${quantidade}`}
                  labelLine={false}
                >
                  {funil.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: number, name: string, props: any) => [
                    `${value} orçamentos (${formatCurrency(props.payload.valor)})`,
                    props.payload.label
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cards de resumo integrado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Lucro Projetado */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lucro Projetado</p>
                <p className={cn(
                  "text-2xl font-bold mt-1",
                  orcamentoStats.lucroProjetado >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600"
                )}>
                  {formatCurrency(orcamentoStats.lucroProjetado)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Baseado nos orçamentos pagos
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        {/* A Receber */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate('finReceber')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contas a Receber</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                  {contasReceberPendentes.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(contasReceberPendentes.reduce((s, c) => s + c.valor, 0))} pendente
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* A Pagar */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate('finPagar')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contas a Pagar</p>
                <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">
                  {contasPagarPendentes.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(contasPagarPendentes.reduce((s, c) => s + c.valor, 0))} pendente
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Links rápidos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Acesso Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => onNavigate('novo')}
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs">Novo Orçamento</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => onNavigate('finLancamentos')}
            >
              <DollarSign className="h-5 w-5" />
              <span className="text-xs">Lançamentos</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => onNavigate('finRentabilidade')}
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs">Rentabilidade</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => onNavigate('finRelatorios')}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs">Relatórios BI</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
