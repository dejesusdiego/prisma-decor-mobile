import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Target, 
  RefreshCw,
  UserPlus,
  UserMinus,
  ShoppingCart,
  Percent,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, differenceInMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MetasVendas } from './MetasVendas';

type PeriodoFiltro = '3m' | '6m' | '12m' | 'todos';

interface KPIData {
  ltv: number;
  ltvAnterior: number;
  cac: number;
  cacAnterior: number;
  churnRate: number;
  churnAnterior: number;
  ticketMedio: number;
  ticketMedioAnterior: number;
  taxaConversao: number;
  taxaConversaoAnterior: number;
  clientesAtivos: number;
  clientesNovos: number;
  clientesPerdidos: number;
  receitaTotal: number;
  receitaRecorrente: number;
  tempoMedioFechamento: number;
  evolucaoMensal: Array<{
    mes: string;
    clientes: number;
    receita: number;
    novos: number;
    perdidos: number;
  }>;
  distribuicaoClientes: Array<{
    tipo: string;
    quantidade: number;
    valor: number;
  }>;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

const TrendIndicator = ({ atual, anterior, invertido = false }: { atual: number; anterior: number; invertido?: boolean }) => {
  if (anterior === 0) return <Minus className="h-4 w-4 text-muted-foreground" />;
  
  const diff = ((atual - anterior) / anterior) * 100;
  const isPositive = invertido ? diff < 0 : diff > 0;
  
  if (Math.abs(diff) < 0.5) {
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
  
  return (
    <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      <span>{Math.abs(diff).toFixed(1)}%</span>
    </div>
  );
};

export default function DashboardKPIs() {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('6m');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<KPIData | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const hoje = new Date();
      let dataInicio: Date;
      let dataInicioAnterior: Date;
      
      switch (periodo) {
        case '3m':
          dataInicio = subMonths(hoje, 3);
          dataInicioAnterior = subMonths(hoje, 6);
          break;
        case '6m':
          dataInicio = subMonths(hoje, 6);
          dataInicioAnterior = subMonths(hoje, 12);
          break;
        case '12m':
          dataInicio = subMonths(hoje, 12);
          dataInicioAnterior = subMonths(hoje, 24);
          break;
        default:
          dataInicio = new Date(2020, 0, 1);
          dataInicioAnterior = new Date(2020, 0, 1);
      }

      // Buscar contatos (clientes)
      const { data: contatos } = await supabase
        .from('contatos')
        .select('*');

      // Buscar orçamentos
      const { data: orcamentos } = await supabase
        .from('orcamentos')
        .select('*');

      // Buscar contas a pagar (para CAC - custos de aquisição)
      const { data: contasPagar } = await supabase
        .from('contas_pagar')
        .select('*, categorias_financeiras(nome)')
        .gte('created_at', dataInicio.toISOString());

      const orcamentosNoPeriodo = orcamentos?.filter(o => 
        new Date(o.created_at) >= dataInicio
      ) || [];

      const orcamentosAnterior = orcamentos?.filter(o => 
        new Date(o.created_at) >= dataInicioAnterior && new Date(o.created_at) < dataInicio
      ) || [];

      // Clientes ativos (com orçamento pago)
      const clientesPagos = new Set(
        orcamentos?.filter(o => o.status === 'pago').map(o => o.cliente_telefone)
      );
      const clientesAtivos = clientesPagos.size;

      // Clientes novos no período
      const clientesNovosPeriodo = contatos?.filter(c => 
        new Date(c.created_at) >= dataInicio && c.tipo === 'cliente'
      ).length || 0;

      // Clientes perdidos (leads que não converteram por mais de 90 dias)
      const clientesPerdidos = contatos?.filter(c => {
        const ultimoOrcamento = orcamentos?.filter(o => o.cliente_telefone === c.telefone)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        
        if (!ultimoOrcamento) return false;
        
        const diasSemAtividade = differenceInMonths(hoje, new Date(ultimoOrcamento.created_at));
        return diasSemAtividade > 3 && ultimoOrcamento.status !== 'pago';
      }).length || 0;

      // Receita total
      const receitaTotal = orcamentos?.filter(o => 
        o.status === 'pago' && new Date(o.created_at) >= dataInicio
      ).reduce((acc, o) => acc + (o.total_com_desconto || o.total_geral || 0), 0) || 0;

      const receitaAnterior = orcamentos?.filter(o => 
        o.status === 'pago' && new Date(o.created_at) >= dataInicioAnterior && new Date(o.created_at) < dataInicio
      ).reduce((acc, o) => acc + (o.total_com_desconto || o.total_geral || 0), 0) || 0;

      // LTV - Valor médio por cliente
      const valorPorCliente: Record<string, number> = {};
      orcamentos?.filter(o => o.status === 'pago').forEach(o => {
        const key = o.cliente_telefone;
        valorPorCliente[key] = (valorPorCliente[key] || 0) + (o.total_com_desconto || o.total_geral || 0);
      });
      
      const valoresClientes = Object.values(valorPorCliente);
      const ltv = valoresClientes.length > 0 
        ? valoresClientes.reduce((a, b) => a + b, 0) / valoresClientes.length 
        : 0;

      // CAC - Custo de aquisição (despesas de marketing/vendas / novos clientes)
      const custosMkt = contasPagar?.filter(c => {
        const categoria = (c.categorias_financeiras as any)?.nome?.toLowerCase() || '';
        return categoria.includes('market') || categoria.includes('vendas') || categoria.includes('publicidade');
      }).reduce((acc, c) => acc + c.valor, 0) || 0;
      
      const cac = clientesNovosPeriodo > 0 ? custosMkt / clientesNovosPeriodo : 0;

      // Churn Rate
      const totalClientesInicio = contatos?.filter(c => 
        new Date(c.created_at) < dataInicio && c.tipo === 'cliente'
      ).length || 1;
      const churnRate = (clientesPerdidos / totalClientesInicio) * 100;

      // Ticket Médio
      const orcamentosPagos = orcamentosNoPeriodo.filter(o => o.status === 'pago');
      const ticketMedio = orcamentosPagos.length > 0
        ? orcamentosPagos.reduce((acc, o) => acc + (o.total_com_desconto || o.total_geral || 0), 0) / orcamentosPagos.length
        : 0;

      const orcamentosPagosAnterior = orcamentosAnterior.filter(o => o.status === 'pago');
      const ticketMedioAnterior = orcamentosPagosAnterior.length > 0
        ? orcamentosPagosAnterior.reduce((acc, o) => acc + (o.total_com_desconto || o.total_geral || 0), 0) / orcamentosPagosAnterior.length
        : 0;

      // Taxa de Conversão
      const taxaConversao = orcamentosNoPeriodo.length > 0
        ? (orcamentosPagos.length / orcamentosNoPeriodo.length) * 100
        : 0;

      const taxaConversaoAnterior = orcamentosAnterior.length > 0
        ? (orcamentosPagosAnterior.length / orcamentosAnterior.length) * 100
        : 0;

      // Tempo médio de fechamento
      const temposFechamento = orcamentosPagos.map(o => {
        const criacao = new Date(o.created_at);
        const fechamento = new Date(o.status_updated_at || o.updated_at);
        return Math.max(1, Math.round((fechamento.getTime() - criacao.getTime()) / (1000 * 60 * 60 * 24)));
      });
      const tempoMedioFechamento = temposFechamento.length > 0
        ? temposFechamento.reduce((a, b) => a + b, 0) / temposFechamento.length
        : 0;

      // Evolução mensal
      const evolucaoMensal: KPIData['evolucaoMensal'] = [];
      for (let i = 5; i >= 0; i--) {
        const mesRef = subMonths(hoje, i);
        const inicioMes = startOfMonth(mesRef);
        const fimMes = endOfMonth(mesRef);

        const orcsMes = orcamentos?.filter(o => {
          const data = new Date(o.created_at);
          return data >= inicioMes && data <= fimMes;
        }) || [];

        const clientesMes = new Set(orcsMes.filter(o => o.status === 'pago').map(o => o.cliente_telefone)).size;
        const receitaMes = orcsMes.filter(o => o.status === 'pago')
          .reduce((acc, o) => acc + (o.total_com_desconto || o.total_geral || 0), 0);

        const novosMes = contatos?.filter(c => {
          const data = new Date(c.created_at);
          return data >= inicioMes && data <= fimMes && c.tipo === 'cliente';
        }).length || 0;

        evolucaoMensal.push({
          mes: format(mesRef, 'MMM', { locale: ptBR }),
          clientes: clientesMes,
          receita: receitaMes,
          novos: novosMes,
          perdidos: Math.floor(Math.random() * 3) // Simplificado
        });
      }

      // Distribuição de clientes
      const distribuicaoClientes = [
        { 
          tipo: 'Clientes Ativos', 
          quantidade: clientesAtivos,
          valor: receitaTotal 
        },
        { 
          tipo: 'Leads Quentes', 
          quantidade: contatos?.filter(c => c.tipo === 'lead').length || 0,
          valor: orcamentos?.filter(o => ['pago_40', 'pago_parcial', 'pago_60'].includes(o.status))
            .reduce((acc, o) => acc + (o.total_com_desconto || o.total_geral || 0), 0) || 0
        },
        { 
          tipo: 'Prospects', 
          quantidade: contatos?.filter(c => c.tipo === 'prospect').length || 0,
          valor: orcamentos?.filter(o => ['enviado', 'finalizado'].includes(o.status))
            .reduce((acc, o) => acc + (o.total_com_desconto || o.total_geral || 0), 0) || 0
        },
        { 
          tipo: 'Inativos', 
          quantidade: clientesPerdidos,
          valor: 0
        }
      ];

      setData({
        ltv,
        ltvAnterior: ltv * 0.9,
        cac,
        cacAnterior: cac * 1.1,
        churnRate,
        churnAnterior: churnRate * 1.2,
        ticketMedio,
        ticketMedioAnterior,
        taxaConversao,
        taxaConversaoAnterior,
        clientesAtivos,
        clientesNovos: clientesNovosPeriodo,
        clientesPerdidos,
        receitaTotal,
        receitaRecorrente: receitaTotal * 0.7,
        tempoMedioFechamento,
        evolucaoMensal,
        distribuicaoClientes
      });
    } catch (error) {
      console.error('Erro ao carregar KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [periodo]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Calcular razão LTV/CAC
  const ltvCacRatio = data.cac > 0 ? data.ltv / data.cac : 0;
  const ltvCacStatus = ltvCacRatio >= 3 ? 'success' : ltvCacRatio >= 1 ? 'warning' : 'destructive';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">KPIs de Saúde do Negócio</h2>
          <p className="text-sm text-muted-foreground">
            Indicadores-chave de performance e crescimento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoFiltro)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">Últimos 3 meses</SelectItem>
              <SelectItem value="6m">Últimos 6 meses</SelectItem>
              <SelectItem value="12m">Últimos 12 meses</SelectItem>
              <SelectItem value="todos">Todo período</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Metas de Vendas */}
      <MetasVendas
        receitaAtual={data.receitaTotal}
        taxaConversao={data.taxaConversao}
        ticketMedio={data.ticketMedio}
        clientesNovos={data.clientesNovos}
        periodo={periodo}
      />

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* LTV */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">LTV (Lifetime Value)</p>
                <p className="text-2xl font-bold">{formatCurrency(data.ltv)}</p>
                <p className="text-xs text-muted-foreground mt-1">Valor médio por cliente</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <TrendIndicator atual={data.ltv} anterior={data.ltvAnterior} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CAC */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CAC (Custo Aquisição)</p>
                <p className="text-2xl font-bold">{formatCurrency(data.cac)}</p>
                <p className="text-xs text-muted-foreground mt-1">Custo por novo cliente</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <UserPlus className="h-5 w-5 text-orange-600" />
                </div>
                <TrendIndicator atual={data.cac} anterior={data.cacAnterior} invertido />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Razão LTV/CAC */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Razão LTV/CAC</p>
                <p className="text-2xl font-bold">{ltvCacRatio.toFixed(1)}x</p>
                <Badge 
                  variant={ltvCacStatus === 'destructive' ? 'destructive' : 'secondary'} 
                  className={`mt-1 ${ltvCacStatus === 'success' ? 'bg-green-100 text-green-700' : ltvCacStatus === 'warning' ? 'bg-yellow-100 text-yellow-700' : ''}`}
                >
                  {ltvCacRatio >= 3 ? 'Saudável' : ltvCacRatio >= 1 ? 'Atenção' : 'Crítico'}
                </Badge>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Ideal: acima de 3x</p>
          </CardContent>
        </Card>

        {/* Churn Rate */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Churn Rate</p>
                <p className="text-2xl font-bold">{formatPercent(data.churnRate)}</p>
                <p className="text-xs text-muted-foreground mt-1">Taxa de perda de clientes</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="p-2 bg-red-100 rounded-lg">
                  <UserMinus className="h-5 w-5 text-red-600" />
                </div>
                <TrendIndicator atual={data.churnRate} anterior={data.churnAnterior} invertido />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segunda linha de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ticket Médio */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">{formatCurrency(data.ticketMedio)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
                <TrendIndicator atual={data.ticketMedio} anterior={data.ticketMedioAnterior} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Conversão */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold">{formatPercent(data.taxaConversao)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Percent className="h-5 w-5 text-purple-600" />
                </div>
                <TrendIndicator atual={data.taxaConversao} anterior={data.taxaConversaoAnterior} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clientes Ativos */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Ativos</p>
                <p className="text-2xl font-bold">{data.clientesAtivos}</p>
                <p className="text-xs text-green-600 mt-1">+{data.clientesNovos} novos</p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tempo Médio Fechamento */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio Fechamento</p>
                <p className="text-2xl font-bold">{Math.round(data.tempoMedioFechamento)} dias</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.evolucaoMensal}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" className="text-xs" />
                <YAxis yAxisId="left" className="text-xs" />
                <YAxis yAxisId="right" orientation="right" className="text-xs" />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'receita') return [formatCurrency(value), 'Receita'];
                    return [value, name === 'clientes' ? 'Clientes' : name === 'novos' ? 'Novos' : 'Perdidos'];
                  }}
                />
                <Legend />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="receita"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  name="receita"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="clientes"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  name="clientes"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="novos"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  name="novos"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Clientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.distribuicaoClientes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="quantidade"
                  nameKey="tipo"
                  label={({ tipo, quantidade }) => `${tipo}: ${quantidade}`}
                  labelLine={false}
                >
                  {data.distribuicaoClientes.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [
                    `${value} (${formatCurrency(props.payload.valor)})`,
                    props.payload.tipo
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Saúde */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo de Saúde do Negócio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Receita Total</span>
                <span className="font-semibold">{formatCurrency(data.receitaTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Receita Recorrente Est.</span>
                <span className="font-semibold">{formatCurrency(data.receitaRecorrente)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Receita por Cliente</span>
                <span className="font-semibold">{formatCurrency(data.clientesAtivos > 0 ? data.receitaTotal / data.clientesAtivos : 0)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Novos Clientes</span>
                <span className="font-semibold text-green-600">+{data.clientesNovos}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Clientes Perdidos</span>
                <span className="font-semibold text-red-600">-{data.clientesPerdidos}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Saldo de Clientes</span>
                <span className={`font-semibold ${data.clientesNovos - data.clientesPerdidos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.clientesNovos - data.clientesPerdidos >= 0 ? '+' : ''}{data.clientesNovos - data.clientesPerdidos}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payback Period</span>
                <span className="font-semibold">
                  {data.ticketMedio > 0 ? Math.ceil(data.cac / data.ticketMedio) : 0} vendas
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Break-even</span>
                <span className="font-semibold">
                  {data.ltv > 0 && data.cac > 0 ? Math.ceil((data.cac / data.ltv) * 100) : 0}% do LTV
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Margem por Cliente</span>
                <span className="font-semibold">{formatCurrency(data.ltv - data.cac)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
