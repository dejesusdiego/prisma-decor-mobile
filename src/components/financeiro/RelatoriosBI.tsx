import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  BarChart3,
  TrendingUp,
  PieChart,
  DollarSign,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

type Periodo = '3m' | '6m' | '12m';

export function RelatoriosBI() {
  const [periodo, setPeriodo] = useState<Periodo>('6m');
  
  const meses = periodo === '3m' ? 3 : periodo === '6m' ? 6 : 12;
  const dataInicio = startOfMonth(subMonths(new Date(), meses - 1));
  const dataFim = endOfMonth(new Date());

  const { data: lancamentos = [] } = useQuery({
    queryKey: ['lancamentos-relatorio', periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .select(`
          *,
          categoria:categorias_financeiras(nome, cor, tipo)
        `)
        .gte('data_lancamento', format(dataInicio, 'yyyy-MM-dd'))
        .lte('data_lancamento', format(dataFim, 'yyyy-MM-dd'))
        .order('data_lancamento', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: orcamentos = [] } = useQuery({
    queryKey: ['orcamentos-relatorio', periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('*')
        .gte('created_at', format(dataInicio, 'yyyy-MM-dd'))
        .lte('created_at', format(dataFim, 'yyyy-MM-dd'));
      
      if (error) throw error;
      return data;
    }
  });

  // DRE Simplificado
  const dreData = (() => {
    const entradas = lancamentos.filter(l => l.tipo === 'entrada').reduce((acc, l) => acc + Number(l.valor), 0);
    const saidas = lancamentos.filter(l => l.tipo === 'saida').reduce((acc, l) => acc + Number(l.valor), 0);
    const lucro = entradas - saidas;
    const margem = entradas > 0 ? (lucro / entradas) * 100 : 0;
    
    return { entradas, saidas, lucro, margem };
  })();

  // Margem por mês
  const margemMensal = (() => {
    const mesesData: { [key: string]: { entradas: number; saidas: number } } = {};
    
    lancamentos.forEach(l => {
      const mes = format(new Date(l.data_lancamento), 'MMM/yy', { locale: ptBR });
      if (!mesesData[mes]) {
        mesesData[mes] = { entradas: 0, saidas: 0 };
      }
      if (l.tipo === 'entrada') {
        mesesData[mes].entradas += Number(l.valor);
      } else {
        mesesData[mes].saidas += Number(l.valor);
      }
    });
    
    return Object.entries(mesesData).map(([mes, data]) => ({
      mes,
      receita: data.entradas,
      despesa: data.saidas,
      lucro: data.entradas - data.saidas,
      margem: data.entradas > 0 ? ((data.entradas - data.saidas) / data.entradas) * 100 : 0
    }));
  })();

  // Despesas por categoria
  const despesasPorCategoria = (() => {
    const categorias: { [key: string]: { valor: number; cor: string } } = {};
    
    lancamentos
      .filter(l => l.tipo === 'saida' && l.categoria)
      .forEach(l => {
        const nome = l.categoria.nome;
        if (!categorias[nome]) {
          categorias[nome] = { valor: 0, cor: l.categoria.cor || '#6B7280' };
        }
        categorias[nome].valor += Number(l.valor);
      });
    
    const total = Object.values(categorias).reduce((acc, c) => acc + c.valor, 0);
    
    return Object.entries(categorias)
      .map(([nome, data]) => ({
        nome,
        valor: data.valor,
        cor: data.cor,
        percentual: total > 0 ? (data.valor / total) * 100 : 0
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  })();

  // Faturamento por mês
  const faturamentoMensal = (() => {
    const mesesData: { [key: string]: number } = {};
    
    orcamentos
      .filter(o => o.status === 'aprovado')
      .forEach(o => {
        const mes = format(new Date(o.created_at), 'MMM/yy', { locale: ptBR });
        if (!mesesData[mes]) {
          mesesData[mes] = 0;
        }
        mesesData[mes] += Number(o.total_geral || 0);
      });
    
    return Object.entries(mesesData).map(([mes, valor]) => ({
      mes,
      valor
    }));
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análise de desempenho financeiro</p>
        </div>
        <div className="flex gap-2">
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">Últimos 3 meses</SelectItem>
              <SelectItem value="6m">Últimos 6 meses</SelectItem>
              <SelectItem value="12m">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="dre" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-[600px]">
          <TabsTrigger value="dre" className="gap-2">
            <DollarSign className="h-4 w-4" />
            DRE
          </TabsTrigger>
          <TabsTrigger value="margem" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Margem
          </TabsTrigger>
          <TabsTrigger value="categorias" className="gap-2">
            <PieChart className="h-4 w-4" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="faturamento" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Faturamento
          </TabsTrigger>
        </TabsList>

        {/* DRE Simplificado */}
        <TabsContent value="dre" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Receitas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(dreData.entradas)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(dreData.saidas)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Líquido</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${dreData.lucro >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {formatCurrency(dreData.lucro)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Margem Líquida</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${dreData.margem >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {dreData.margem.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Receitas vs Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={margemMensal}>
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
                    <Bar dataKey="receita" name="Receitas" fill="hsl(142.1 76.2% 36.3%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesa" name="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Margem por Período */}
        <TabsContent value="margem" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Evolução da Margem de Lucro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={margemMensal}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mes" className="text-xs" />
                    <YAxis 
                      yAxisId="left"
                      tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} 
                      className="text-xs" 
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(v) => `${v.toFixed(0)}%`} 
                      className="text-xs" 
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => 
                        name === 'margem' ? `${value.toFixed(1)}%` : formatCurrency(value)
                      }
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="lucro" 
                      name="Lucro (R$)"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="margem" 
                      name="Margem (%)"
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--chart-2))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Despesas por Categoria */}
        <TabsContent value="categorias" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={despesasPorCategoria}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ nome, percentual }) => `${nome}: ${percentual.toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="valor"
                      >
                        {despesasPorCategoria.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cor || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 5 Categorias de Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {despesasPorCategoria.map((cat, index) => (
                    <div key={cat.nome} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{cat.nome}</span>
                        <span className="text-muted-foreground">{formatCurrency(cat.valor)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${cat.percentual}%`,
                            backgroundColor: cat.cor || COLORS[index % COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Faturamento Mensal */}
        <TabsContent value="faturamento" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Faturamento Mensal (Orçamentos Aprovados)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={faturamentoMensal}>
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
                    <Bar 
                      dataKey="valor" 
                      name="Faturamento"
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
