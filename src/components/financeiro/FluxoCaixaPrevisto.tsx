import { useMemo } from 'react';
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
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  ReferenceLine
} from 'recharts';

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

export function FluxoCaixaPrevisto() {
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

  // Calcular fluxo de caixa diário previsto (próximos 30 dias)
  const fluxoDiario = useMemo(() => {
    const hoje = new Date();
    const dias: { data: string; entradas: number; saidas: number; saldo: number; acumulado: number }[] = [];
    let acumulado = 0;

    for (let i = 0; i < 30; i++) {
      const dia = addDays(hoje, i);
      const diaStr = format(dia, 'yyyy-MM-dd');
      const diaLabel = format(dia, 'dd/MM');

      // Entradas do dia
      const entradasDia = parcelasReceber
        .filter(p => p.data_vencimento === diaStr)
        .reduce((acc, p) => acc + Number(p.valor), 0);

      // Saídas do dia (contas a pagar não recorrentes)
      const saidasDia = contasPagar
        .filter(c => c.data_vencimento === diaStr)
        .reduce((acc, c) => acc + Number(c.valor), 0);

      const saldo = entradasDia - saidasDia;
      acumulado += saldo;

      dias.push({
        data: diaLabel,
        entradas: entradasDia,
        saidas: saidasDia,
        saldo,
        acumulado
      });
    }

    return dias;
  }, [contasPagar, parcelasReceber]);

  // Calcular fluxo de caixa mensal previsto (próximos 3 meses)
  const fluxoMensal = useMemo(() => {
    const hoje = new Date();
    const meses: { 
      mes: string; 
      entradas: number; 
      saidasFixas: number; 
      saidasRecorrentes: number;
      total: number;
    }[] = [];

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
          // Semanal/quinzenal - múltiplas vezes por mês
          saidasRecorrentesMes += Number(conta.valor) * (1 / mesesIntervalo);
        } else if (i % mesesIntervalo === 0) {
          // Mensal ou mais - uma vez no intervalo
          saidasRecorrentesMes += Number(conta.valor);
        }
      });

      const total = entradasMes - saidasFixasMes - saidasRecorrentesMes;

      meses.push({
        mes: mesLabel,
        entradas: entradasMes,
        saidasFixas: saidasFixasMes,
        saidasRecorrentes: saidasRecorrentesMes,
        total
      });
    }

    return meses;
  }, [contasPagar, contasRecorrentes, parcelasReceber]);

  // Totais
  const totais = useMemo(() => {
    const totalEntradas = fluxoMensal.reduce((acc, m) => acc + m.entradas, 0);
    const totalSaidasFixas = fluxoMensal.reduce((acc, m) => acc + m.saidasFixas, 0);
    const totalRecorrentes = fluxoMensal.reduce((acc, m) => acc + m.saidasRecorrentes, 0);
    const saldoPrevisto = totalEntradas - totalSaidasFixas - totalRecorrentes;
    
    return {
      totalEntradas,
      totalSaidasFixas,
      totalRecorrentes,
      saldoPrevisto,
      totalSaidas: totalSaidasFixas + totalRecorrentes
    };
  }, [fluxoMensal]);

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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fluxo de Caixa Previsto</h1>
        <p className="text-muted-foreground">Visão consolidada de entradas e saídas futuras</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              Saídas Fixas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(totais.totalSaidasFixas)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Contas agendadas</p>
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

        <Card className={totais.saldoPrevisto >= 0 
          ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20" 
          : "bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20"
        }>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Saldo Previsto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totais.saldoPrevisto >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatCurrency(totais.saldoPrevisto)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {totais.saldoPrevisto >= 0 ? 'Superávit' : 'Déficit'} projetado
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
                      <Tooltip 
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
                    <span className={`font-bold ${mes.total >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {formatCurrency(mes.total)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Fluxo Diário */}
        <TabsContent value="diario" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa Diário (30 dias)</CardTitle>
              <CardDescription>Saldo acumulado ao longo do período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={fluxoDiario}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="data" className="text-xs" />
                    <YAxis tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} className="text-xs" />
                    <Tooltip 
                      formatter={(value: number, name: string) => [formatCurrency(value), 
                        name === 'acumulado' ? 'Acumulado' : 
                        name === 'entradas' ? 'Entradas' : 
                        name === 'saidas' ? 'Saídas' : name
                      ]}
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
                      dataKey="acumulado" 
                      name="Acumulado"
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary)/0.2)"
                      strokeWidth={2}
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
                      <span className={`font-medium ${dia.acumulado >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {formatCurrency(dia.acumulado)}
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