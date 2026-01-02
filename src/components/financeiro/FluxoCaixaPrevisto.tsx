import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, addMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  Repeat,
  Receipt,
  Wallet,
  Calendar,
  Target,
  AlertTriangle,
  Sparkles,
  Info,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { BreadcrumbsFinanceiro } from './BreadcrumbsFinanceiro';
import { AlertaFluxoNegativo } from './AlertaFluxoNegativo';
import { useHistoricoPagamentos } from '@/hooks/useHistoricoPagamentos';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  ReferenceLine,
  LineChart,
  Line
} from 'recharts';

interface FluxoCaixaPrevistoProps {
  onNavigate?: (view: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const FREQUENCIAS_MESES: Record<string, number> = {
  semanal: 0.25,
  quinzenal: 0.5,
  mensal: 1,
  bimestral: 2,
  trimestral: 3,
  semestral: 6,
  anual: 12,
};

// Fatores para cenários
const CENARIOS = {
  otimista: {
    entradas: 1.15, // 15% a mais de recebimentos
    saidas: 0.90,   // 10% menos de gastos
  },
  pessimista: {
    entradas: 0.70, // 30% a menos (inadimplência)
    saidas: 1.20,   // 20% a mais de gastos imprevistos
  }
};

export function FluxoCaixaPrevisto({ onNavigate }: FluxoCaixaPrevistoProps) {
  const [cenarioSelecionado, setCenarioSelecionado] = useState<'realista' | 'otimista' | 'pessimista'>('realista');

  // Hook de histórico de pagamentos para análise inteligente
  const { metricas: metricasHistorico } = useHistoricoPagamentos();

  // Buscar saldo atual (soma de todos os lançamentos)
  const { data: saldoAtual = 0 } = useQuery({
    queryKey: ['saldo-atual-caixa'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .select('tipo, valor');
      
      if (error) throw error;
      
      return (data || []).reduce((acc, l) => {
        return acc + (l.tipo === 'entrada' ? Number(l.valor) : -Number(l.valor));
      }, 0);
    }
  });

  // Buscar contas a pagar pendentes
  const { data: contasPagar = [] } = useQuery({
    queryKey: ['contas-pagar-previsao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_pagar')
        .select('*')
        .in('status', ['pendente', 'atrasado'])
        .gte('data_vencimento', format(new Date(), 'yyyy-MM-dd'))
        .lte('data_vencimento', format(addMonths(new Date(), 3), 'yyyy-MM-dd'))
        .order('data_vencimento');
      
      if (error) throw error;
      return data;
    }
  });

  // Buscar contas recorrentes
  const { data: contasRecorrentes = [] } = useQuery({
    queryKey: ['contas-recorrentes-previsao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_pagar')
        .select('*')
        .eq('recorrente', true)
        .not('frequencia_recorrencia', 'is', null);
      
      if (error) throw error;
      return data;
    }
  });

  // Buscar parcelas a receber
  const { data: parcelasReceber = [] } = useQuery({
    queryKey: ['parcelas-receber-previsao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parcelas_receber')
        .select(`
          *,
          conta_receber:contas_receber(cliente_nome)
        `)
        .eq('status', 'pendente')
        .gte('data_vencimento', format(new Date(), 'yyyy-MM-dd'))
        .lte('data_vencimento', format(addMonths(new Date(), 3), 'yyyy-MM-dd'))
        .order('data_vencimento');
      
      if (error) throw error;
      return data;
    }
  });

  // Calcular fluxo de caixa diário previsto com saldo inicial e cenários (próximos 30 dias)
  const fluxoDiario = useMemo(() => {
    const hoje = new Date();
    const dias: { 
      data: string; 
      entradas: number; 
      saidas: number; 
      saldo: number; 
      acumuladoRealista: number;
      acumuladoOtimista: number;
      acumuladoPessimista: number;
    }[] = [];
    
    let acumuladoRealista = saldoAtual;
    let acumuladoOtimista = saldoAtual;
    let acumuladoPessimista = saldoAtual;

    for (let i = 0; i < 30; i++) {
      const dia = addDays(hoje, i);
      const diaStr = format(dia, 'yyyy-MM-dd');
      const diaLabel = format(dia, 'dd/MM');

      // Entradas do dia
      const entradasDia = parcelasReceber
        .filter(p => p.data_vencimento === diaStr)
        .reduce((acc, p) => acc + Number(p.valor), 0);

      // Saídas do dia (contas a pagar)
      const saidasDia = contasPagar
        .filter(c => c.data_vencimento === diaStr)
        .reduce((acc, c) => acc + Number(c.valor), 0);

      const saldo = entradasDia - saidasDia;
      
      // Cenário realista
      acumuladoRealista += saldo;
      
      // Cenário otimista
      acumuladoOtimista += (entradasDia * CENARIOS.otimista.entradas) - (saidasDia * CENARIOS.otimista.saidas);
      
      // Cenário pessimista
      acumuladoPessimista += (entradasDia * CENARIOS.pessimista.entradas) - (saidasDia * CENARIOS.pessimista.saidas);

      dias.push({
        data: diaLabel,
        entradas: entradasDia,
        saidas: saidasDia,
        saldo,
        acumuladoRealista,
        acumuladoOtimista,
        acumuladoPessimista
      });
    }

    return dias;
  }, [contasPagar, parcelasReceber, saldoAtual]);

  // Calcular fluxo de caixa mensal previsto com cenários (próximos 3 meses)
  const fluxoMensal = useMemo(() => {
    const hoje = new Date();
    const meses: { 
      mes: string; 
      entradas: number; 
      saidasFixas: number; 
      saidasRecorrentes: number;
      totalRealista: number;
      totalOtimista: number;
      totalPessimista: number;
      acumuladoRealista: number;
      acumuladoOtimista: number;
      acumuladoPessimista: number;
    }[] = [];

    let acumuladoRealista = saldoAtual;
    let acumuladoOtimista = saldoAtual;
    let acumuladoPessimista = saldoAtual;

    for (let i = 0; i < 3; i++) {
      const mesData = addMonths(hoje, i);
      const mesInicio = startOfMonth(mesData);
      const mesFim = endOfMonth(mesData);
      const mesLabel = format(mesData, 'MMM/yy', { locale: ptBR });

      // Entradas do mês
      const entradasMes = parcelasReceber
        .filter(p => {
          const dataVenc = parseISO(p.data_vencimento);
          return isWithinInterval(dataVenc, { start: mesInicio, end: mesFim });
        })
        .reduce((acc, p) => acc + Number(p.valor), 0);

      // Saídas fixas (contas a pagar não recorrentes)
      const saidasFixasMes = contasPagar
        .filter(c => {
          const dataVenc = parseISO(c.data_vencimento);
          return isWithinInterval(dataVenc, { start: mesInicio, end: mesFim }) && !c.recorrente;
        })
        .reduce((acc, c) => acc + Number(c.valor), 0);

      // Saídas recorrentes projetadas
      let saidasRecorrentesMes = 0;
      contasRecorrentes.forEach(conta => {
        const freq = conta.frequencia_recorrencia || 'mensal';
        const mesesIntervalo = FREQUENCIAS_MESES[freq] || 1;
        
        if (mesesIntervalo < 1) {
          saidasRecorrentesMes += Number(conta.valor) * (1 / mesesIntervalo);
        } else if (i % mesesIntervalo === 0) {
          saidasRecorrentesMes += Number(conta.valor);
        }
      });

      const totalSaidas = saidasFixasMes + saidasRecorrentesMes;
      
      // Cenário realista
      const totalRealista = entradasMes - totalSaidas;
      acumuladoRealista += totalRealista;
      
      // Cenário otimista
      const totalOtimista = (entradasMes * CENARIOS.otimista.entradas) - (totalSaidas * CENARIOS.otimista.saidas);
      acumuladoOtimista += totalOtimista;
      
      // Cenário pessimista
      const totalPessimista = (entradasMes * CENARIOS.pessimista.entradas) - (totalSaidas * CENARIOS.pessimista.saidas);
      acumuladoPessimista += totalPessimista;

      meses.push({
        mes: mesLabel,
        entradas: entradasMes,
        saidasFixas: saidasFixasMes,
        saidasRecorrentes: saidasRecorrentesMes,
        totalRealista,
        totalOtimista,
        totalPessimista,
        acumuladoRealista,
        acumuladoOtimista,
        acumuladoPessimista
      });
    }

    return meses;
  }, [contasPagar, contasRecorrentes, parcelasReceber, saldoAtual]);

  // Totais com cenários
  const totais = useMemo(() => {
    const totalEntradas = fluxoMensal.reduce((acc, m) => acc + m.entradas, 0);
    const totalSaidasFixas = fluxoMensal.reduce((acc, m) => acc + m.saidasFixas, 0);
    const totalRecorrentes = fluxoMensal.reduce((acc, m) => acc + m.saidasRecorrentes, 0);
    const totalSaidas = totalSaidasFixas + totalRecorrentes;
    
    return {
      totalEntradas,
      totalSaidasFixas,
      totalRecorrentes,
      totalSaidas,
      saldoRealista: saldoAtual + totalEntradas - totalSaidas,
      saldoOtimista: saldoAtual + (totalEntradas * CENARIOS.otimista.entradas) - (totalSaidas * CENARIOS.otimista.saidas),
      saldoPessimista: saldoAtual + (totalEntradas * CENARIOS.pessimista.entradas) - (totalSaidas * CENARIOS.pessimista.saidas),
    };
  }, [fluxoMensal, saldoAtual]);

  // Lista de próximos vencimentos
  const proximosVencimentos = useMemo(() => {
    const itens: { 
      tipo: 'entrada' | 'saida'; 
      descricao: string; 
      valor: number; 
      data: string;
      recorrente?: boolean;
    }[] = [];

    // Adicionar parcelas a receber
    parcelasReceber.slice(0, 5).forEach(p => {
      itens.push({
        tipo: 'entrada',
        descricao: `${p.conta_receber?.cliente_nome || 'Parcela'} - Parcela ${p.numero_parcela}`,
        valor: Number(p.valor),
        data: p.data_vencimento
      });
    });

    // Adicionar contas a pagar
    contasPagar.slice(0, 5).forEach(c => {
      itens.push({
        tipo: 'saida',
        descricao: c.descricao,
        valor: Number(c.valor),
        data: c.data_vencimento,
        recorrente: c.recorrente
      });
    });

    // Ordenar por data
    return itens
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .slice(0, 10);
  }, [contasPagar, parcelasReceber]);

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <BreadcrumbsFinanceiro currentView="finFluxoPrevisto" onNavigate={onNavigate} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fluxo de Caixa Previsto</h1>
          <p className="text-muted-foreground">Visão consolidada de entradas e saídas futuras</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Cenário:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setCenarioSelecionado('pessimista')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                cenarioSelecionado === 'pessimista' 
                  ? "bg-destructive text-destructive-foreground" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Pessimista
            </button>
            <button
              onClick={() => setCenarioSelecionado('realista')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                cenarioSelecionado === 'realista' 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Target className="h-3.5 w-3.5" />
              Realista
            </button>
            <button
              onClick={() => setCenarioSelecionado('otimista')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                cenarioSelecionado === 'otimista' 
                  ? "bg-emerald-600 text-white" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Otimista
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de Fluxo Negativo Inteligente */}
      <AlertaFluxoNegativo
        saldoAtual={saldoAtual}
        saldoPrevisto={
          cenarioSelecionado === 'otimista' ? totais.saldoOtimista :
          cenarioSelecionado === 'pessimista' ? totais.saldoPessimista :
          totais.saldoRealista
        }
        cenario={cenarioSelecionado}
        valorEmRisco={metricasHistorico.valorEmRisco}
        clientesRisco={metricasHistorico.clientesRisco}
        onNavigateContasReceber={() => onNavigate?.('finContasReceber')}
        onNavigateContasPagar={() => onNavigate?.('finContasPagar')}
      />

      {/* Card de Métricas de Inadimplência */}
      {metricasHistorico.taxaInadimplencia > 5 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-500" />
              Análise de Inadimplência (Histórico Real)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Taxa de Atraso</p>
                <p className={cn(
                  "text-lg font-bold",
                  metricasHistorico.taxaInadimplencia > 15 ? "text-destructive" : "text-amber-600"
                )}>
                  {metricasHistorico.taxaInadimplencia.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dias Atraso Médio</p>
                <p className="text-lg font-bold text-foreground">
                  {metricasHistorico.diasAtrasoMedioGeral.toFixed(0)} dias
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor em Risco</p>
                <p className="text-lg font-bold text-destructive">
                  {formatCurrency(metricasHistorico.valorEmRisco)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fator Projeção Sugerido</p>
                <p className="text-lg font-bold text-foreground">
                  {(metricasHistorico.fatorInadimplenciaSugerido * 100).toFixed(0)}%
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    (vs 30% padrão)
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Saldo Atual */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-500" />
              Saldo Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn(
              "text-2xl font-bold",
              saldoAtual >= 0 ? "text-blue-600 dark:text-blue-400" : "text-destructive"
            )}>
              {formatCurrency(saldoAtual)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Base para projeções</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Entradas Previstas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totais.totalEntradas)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Próximos 3 meses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4 text-amber-500" />
              Saídas Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(totais.totalSaidas)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Fixas + Recorrentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Repeat className="h-4 w-4 text-purple-500" />
              Despesas Recorrentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(totais.totalRecorrentes)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Projeção automática</p>
          </CardContent>
        </Card>

        <Card className={cn(
          cenarioSelecionado === 'realista' && totais.saldoRealista >= 0 && "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20",
          cenarioSelecionado === 'realista' && totais.saldoRealista < 0 && "bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20",
          cenarioSelecionado === 'otimista' && "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
          cenarioSelecionado === 'pessimista' && "bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {cenarioSelecionado === 'otimista' && <Sparkles className="h-4 w-4 text-emerald-500" />}
              {cenarioSelecionado === 'realista' && <Target className="h-4 w-4" />}
              {cenarioSelecionado === 'pessimista' && <AlertTriangle className="h-4 w-4 text-destructive" />}
              Saldo Previsto
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-1">Cenários de projeção:</p>
                  <p className="text-xs">• Otimista: +15% entradas, -10% saídas</p>
                  <p className="text-xs">• Realista: valores previstos</p>
                  <p className="text-xs">• Pessimista: -30% entradas, +20% saídas</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn(
              "text-2xl font-bold",
              cenarioSelecionado === 'realista' && (totais.saldoRealista >= 0 ? 'text-primary' : 'text-destructive'),
              cenarioSelecionado === 'otimista' && 'text-emerald-600 dark:text-emerald-400',
              cenarioSelecionado === 'pessimista' && 'text-destructive'
            )}>
              {formatCurrency(
                cenarioSelecionado === 'realista' ? totais.saldoRealista :
                cenarioSelecionado === 'otimista' ? totais.saldoOtimista :
                totais.saldoPessimista
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Cenário {cenarioSelecionado}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="mensal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mensal" className="gap-2">
            <Calendar className="h-4 w-4" />
            Visão Mensal
          </TabsTrigger>
          <TabsTrigger value="cenarios" className="gap-2">
            <Target className="h-4 w-4" />
            Cenários
          </TabsTrigger>
          <TabsTrigger value="diario" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Fluxo Diário
          </TabsTrigger>
        </TabsList>

        {/* Visão Mensal */}
        <TabsContent value="mensal" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico de barras mensal */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Projeção Mensal de Fluxo de Caixa</CardTitle>
                <CardDescription>Entradas vs Saídas (fixas + recorrentes)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fluxoMensal}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="mes" className="text-xs" />
                      <YAxis tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} className="text-xs" />
                      <RechartsTooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                      <Bar 
                        dataKey="entradas" 
                        name="Entradas"
                        fill="hsl(142.1 76.2% 36.3%)" 
                        radius={[4, 4, 0, 0]} 
                      />
                      <Bar 
                        dataKey="saidasFixas" 
                        name="Saídas Fixas"
                        fill="hsl(var(--chart-4))" 
                        radius={[4, 4, 0, 0]} 
                      />
                      <Bar 
                        dataKey="saidasRecorrentes" 
                        name="Recorrentes"
                        fill="hsl(var(--chart-5))" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Próximos Vencimentos */}
            <Card>
              <CardHeader>
                <CardTitle>Próximos Vencimentos</CardTitle>
                <CardDescription>Entradas e saídas agendadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {proximosVencimentos.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-full ${
                          item.tipo === 'entrada' 
                            ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                            : 'bg-red-100 dark:bg-red-900/30'
                        }`}>
                          {item.tipo === 'entrada' ? (
                            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.descricao}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(item.data), 'dd/MM')}
                            </span>
                            {item.recorrente && (
                              <Badge variant="secondary" className="text-xs px-1">
                                <Repeat className="h-3 w-3" />
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className={`font-medium text-sm ${
                        item.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {item.tipo === 'entrada' ? '+' : '-'}{formatCurrency(item.valor)}
                      </span>
                    </div>
                  ))}
                  {proximosVencimentos.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum vencimento próximo
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cards por mês */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fluxoMensal.map((mes) => (
              <Card key={mes.mes}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg capitalize">{mes.mes}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Entradas</span>
                    <span className="font-medium text-emerald-600">{formatCurrency(mes.entradas)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Saídas Fixas</span>
                    <span className="font-medium text-amber-600">{formatCurrency(mes.saidasFixas)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Repeat className="h-3 w-3" /> Recorrentes
                    </span>
                    <span className="font-medium text-purple-600">{formatCurrency(mes.saidasRecorrentes)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="text-sm font-medium">Saldo</span>
                    <span className={cn(
                      "font-bold",
                      cenarioSelecionado === 'realista' && (mes.totalRealista >= 0 ? 'text-primary' : 'text-destructive'),
                      cenarioSelecionado === 'otimista' && (mes.totalOtimista >= 0 ? 'text-emerald-600' : 'text-destructive'),
                      cenarioSelecionado === 'pessimista' && (mes.totalPessimista >= 0 ? 'text-primary' : 'text-destructive')
                    )}>
                      {formatCurrency(
                        cenarioSelecionado === 'realista' ? mes.totalRealista :
                        cenarioSelecionado === 'otimista' ? mes.totalOtimista :
                        mes.totalPessimista
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Cenários */}
        <TabsContent value="cenarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comparativo de Cenários</CardTitle>
              <CardDescription>Projeção de saldo acumulado nos próximos 3 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fluxoMensal}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mes" className="text-xs" />
                    <YAxis tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} className="text-xs" />
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    <Line 
                      type="monotone"
                      dataKey="acumuladoOtimista" 
                      name="Otimista"
                      stroke="hsl(142.1 76.2% 36.3%)"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(142.1 76.2% 36.3%)' }}
                    />
                    <Line 
                      type="monotone"
                      dataKey="acumuladoRealista" 
                      name="Realista"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                    <Line 
                      type="monotone"
                      dataKey="acumuladoPessimista" 
                      name="Pessimista"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--destructive))' }}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Cards comparativo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-emerald-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  Cenário Otimista
                </CardTitle>
                <CardDescription>+15% entradas, -10% saídas</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totais.saldoOtimista)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Saldo previsto em 3 meses
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Cenário Realista
                </CardTitle>
                <CardDescription>Valores previstos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className={cn(
                  "text-3xl font-bold",
                  totais.saldoRealista >= 0 ? "text-primary" : "text-destructive"
                )}>
                  {formatCurrency(totais.saldoRealista)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Saldo previsto em 3 meses
                </p>
              </CardContent>
            </Card>

            <Card className="border-destructive/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Cenário Pessimista
                </CardTitle>
                <CardDescription>-30% entradas, +20% saídas</CardDescription>
              </CardHeader>
              <CardContent>
                <p className={cn(
                  "text-3xl font-bold",
                  totais.saldoPessimista >= 0 ? "text-primary" : "text-destructive"
                )}>
                  {formatCurrency(totais.saldoPessimista)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Saldo previsto em 3 meses
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Diferença entre cenários */}
          <Card>
            <CardHeader>
              <CardTitle>Análise de Risco</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Diferença Otimista vs Realista</p>
                  <p className="text-xl font-bold text-emerald-600">
                    +{formatCurrency(totais.saldoOtimista - totais.saldoRealista)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Diferença Pessimista vs Realista</p>
                  <p className="text-xl font-bold text-destructive">
                    {formatCurrency(totais.saldoPessimista - totais.saldoRealista)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fluxo Diário */}
        <TabsContent value="diario" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa Diário (30 dias)</CardTitle>
              <CardDescription>Saldo acumulado por cenário</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={fluxoDiario}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="data" className="text-xs" />
                    <YAxis tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} className="text-xs" />
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    <Area 
                      type="monotone" 
                      dataKey="acumuladoOtimista" 
                      name="Otimista"
                      stroke="hsl(142.1 76.2% 36.3%)" 
                      fill="hsl(142.1 76.2% 36.3%)"
                      fillOpacity={0.1}
                      strokeWidth={1}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="acumuladoRealista" 
                      name="Realista"
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="acumuladoPessimista" 
                      name="Pessimista"
                      stroke="hsl(var(--destructive))" 
                      fill="hsl(var(--destructive))"
                      fillOpacity={0.1}
                      strokeWidth={1}
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de movimentações diárias com valores */}
          <Card>
            <CardHeader>
              <CardTitle>Movimentações por Dia</CardTitle>
              <CardDescription>Dias com entradas ou saídas previstas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {fluxoDiario.filter(d => d.entradas > 0 || d.saidas > 0).map((dia) => (
                  <div 
                    key={dia.data} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <span className="font-medium">{dia.data}</span>
                    <div className="flex items-center gap-4">
                      {dia.entradas > 0 && (
                        <span className="text-sm text-emerald-600">
                          +{formatCurrency(dia.entradas)}
                        </span>
                      )}
                      {dia.saidas > 0 && (
                        <span className="text-sm text-red-600">
                          -{formatCurrency(dia.saidas)}
                        </span>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className={cn(
                        "font-medium",
                        dia.acumuladoRealista >= 0 ? 'text-primary' : 'text-destructive'
                      )}>
                        {formatCurrency(dia.acumuladoRealista)}
                      </span>
                    </div>
                  </div>
                ))}
                {fluxoDiario.filter(d => d.entradas > 0 || d.saidas > 0).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma movimentação prevista nos próximos 30 dias
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}