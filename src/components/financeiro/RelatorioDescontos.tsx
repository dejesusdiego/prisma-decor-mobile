import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Percent,
  TrendingDown,
  Calendar,
  User,
  FileText,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

type Periodo = '1m' | '3m' | '6m' | '12m';

interface HistoricoDesconto {
  id: string;
  orcamento_id: string;
  desconto_tipo_anterior: string | null;
  desconto_valor_anterior: number | null;
  desconto_tipo_novo: string | null;
  desconto_valor_novo: number | null;
  motivo: string | null;
  usuario_id: string;
  usuario_nome: string;
  created_at: string;
}

interface OrcamentoComDesconto {
  id: string;
  codigo: string;
  cliente_nome: string;
  total_geral: number | null;
  desconto_tipo: string | null;
  desconto_valor: number | null;
  total_com_desconto: number | null;
  created_at: string;
  status: string;
}

export function RelatorioDescontos() {
  const [periodo, setPeriodo] = useState<Periodo>('3m');
  
  const meses = periodo === '1m' ? 1 : periodo === '3m' ? 3 : periodo === '6m' ? 6 : 12;
  const dataInicio = startOfMonth(subMonths(new Date(), meses - 1));
  const dataFim = endOfMonth(new Date());

  // Buscar histórico de descontos
  const { data: historico = [], isLoading: isLoadingHistorico } = useQuery({
    queryKey: ['historico-descontos', periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('historico_descontos')
        .select('*')
        .gte('created_at', format(dataInicio, 'yyyy-MM-dd'))
        .lte('created_at', format(dataFim, 'yyyy-MM-dd\'T\'23:59:59'))
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as HistoricoDesconto[];
    }
  });

  // Buscar orçamentos com desconto
  const { data: orcamentosComDesconto = [], isLoading: isLoadingOrcamentos } = useQuery({
    queryKey: ['orcamentos-com-desconto', periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('id, codigo, cliente_nome, total_geral, desconto_tipo, desconto_valor, total_com_desconto, created_at, status')
        .gte('created_at', format(dataInicio, 'yyyy-MM-dd'))
        .lte('created_at', format(dataFim, 'yyyy-MM-dd\'T\'23:59:59'))
        .gt('desconto_valor', 0)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as OrcamentoComDesconto[];
    }
  });

  // Buscar total de orçamentos no período para comparação
  const { data: totalOrcamentos = 0 } = useQuery({
    queryKey: ['total-orcamentos-periodo', periodo],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('orcamentos')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', format(dataInicio, 'yyyy-MM-dd'))
        .lte('created_at', format(dataFim, 'yyyy-MM-dd\'T\'23:59:59'));
      
      if (error) throw error;
      return count || 0;
    }
  });

  const isLoading = isLoadingHistorico || isLoadingOrcamentos;

  // Calcular estatísticas
  const estatisticas = (() => {
    const totalDescontosAplicados = orcamentosComDesconto.length;
    const percentualComDesconto = totalOrcamentos > 0 
      ? (totalDescontosAplicados / totalOrcamentos) * 100 
      : 0;

    let valorTotalDescontos = 0;
    let valorTotalOriginal = 0;

    orcamentosComDesconto.forEach(orc => {
      const valorOriginal = orc.total_geral || 0;
      const valorComDesconto = orc.total_com_desconto || valorOriginal;
      valorTotalOriginal += valorOriginal;
      valorTotalDescontos += (valorOriginal - valorComDesconto);
    });

    const descontoMedio = totalDescontosAplicados > 0 
      ? valorTotalDescontos / totalDescontosAplicados 
      : 0;

    const percentualDescontoMedio = valorTotalOriginal > 0 
      ? (valorTotalDescontos / valorTotalOriginal) * 100 
      : 0;

    return {
      totalDescontosAplicados,
      percentualComDesconto,
      valorTotalDescontos,
      descontoMedio,
      percentualDescontoMedio,
      totalAlteracoes: historico.length
    };
  })();

  // Descontos por mês
  const descontosPorMes = (() => {
    const mesesData: { [key: string]: { quantidade: number; valorTotal: number } } = {};
    
    orcamentosComDesconto.forEach(orc => {
      const mes = format(new Date(orc.created_at), 'MMM/yy', { locale: ptBR });
      if (!mesesData[mes]) {
        mesesData[mes] = { quantidade: 0, valorTotal: 0 };
      }
      mesesData[mes].quantidade += 1;
      const valorOriginal = orc.total_geral || 0;
      const valorComDesconto = orc.total_com_desconto || valorOriginal;
      mesesData[mes].valorTotal += (valorOriginal - valorComDesconto);
    });
    
    return Object.entries(mesesData).map(([mes, data]) => ({
      mes,
      quantidade: data.quantidade,
      valor: data.valorTotal
    }));
  })();

  // Descontos por tipo
  const descontosPorTipo = (() => {
    const tipos: { [key: string]: number } = { percentual: 0, fixo: 0 };
    
    orcamentosComDesconto.forEach(orc => {
      const tipo = orc.desconto_tipo || 'percentual';
      tipos[tipo] = (tipos[tipo] || 0) + 1;
    });
    
    return [
      { nome: 'Percentual', valor: tipos.percentual, fill: COLORS[0] },
      { nome: 'Valor Fixo', valor: tipos.fixo, fill: COLORS[1] }
    ].filter(t => t.valor > 0);
  })();

  // Descontos por usuário
  const descontosPorUsuario = (() => {
    const usuarios: { [key: string]: { quantidade: number; valorTotal: number } } = {};
    
    historico.forEach(h => {
      if (!usuarios[h.usuario_nome]) {
        usuarios[h.usuario_nome] = { quantidade: 0, valorTotal: 0 };
      }
      usuarios[h.usuario_nome].quantidade += 1;
      usuarios[h.usuario_nome].valorTotal += h.desconto_valor_novo || 0;
    });
    
    return Object.entries(usuarios)
      .map(([nome, data]) => ({
        nome,
        quantidade: data.quantidade,
        valorTotal: data.valorTotal
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
  })();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatório de Descontos</h1>
          <p className="text-muted-foreground">Análise de descontos aplicados em orçamentos</p>
        </div>
        <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">Último mês</SelectItem>
            <SelectItem value="3m">Últimos 3 meses</SelectItem>
            <SelectItem value="6m">Últimos 6 meses</SelectItem>
            <SelectItem value="12m">Últimos 12 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Orçamentos com Desconto
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.totalDescontosAplicados}</div>
            <p className="text-xs text-muted-foreground">
              {estatisticas.percentualComDesconto.toFixed(1)}% do total ({totalOrcamentos} orç.)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total em Descontos
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(estatisticas.valorTotalDescontos)}
            </div>
            <p className="text-xs text-muted-foreground">
              {estatisticas.percentualDescontoMedio.toFixed(1)}% do valor original
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Desconto Médio
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(estatisticas.descontoMedio)}
            </div>
            <p className="text-xs text-muted-foreground">
              por orçamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alterações de Desconto
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.totalAlteracoes}</div>
            <p className="text-xs text-muted-foreground">
              modificações registradas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolução Mensal */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Descontos por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            {descontosPorMes.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={descontosPorMes}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mes" className="text-xs" />
                    <YAxis yAxisId="left" tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} className="text-xs" />
                    <YAxis yAxisId="right" orientation="right" className="text-xs" />
                    <Tooltip 
                      formatter={(value: number, name: string) => 
                        name === 'valor' ? formatCurrency(value) : value
                      }
                      labelFormatter={(label) => `Mês: ${label}`}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="valor" name="Valor (R$)" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="quantidade" name="Quantidade" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum desconto registrado no período
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tipos de Desconto */}
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Desconto</CardTitle>
          </CardHeader>
          <CardContent>
            {descontosPorTipo.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={descontosPorTipo}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ nome, valor }) => `${nome}: ${valor}`}
                      outerRadius={80}
                      dataKey="valor"
                    >
                      {descontosPorTipo.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Descontos por Usuário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Descontos por Usuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            {descontosPorUsuario.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {descontosPorUsuario.slice(0, 5).map((usuario) => (
                    <TableRow key={usuario.nome}>
                      <TableCell className="font-medium">{usuario.nome}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{usuario.quantidade}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Nenhuma alteração registrada
              </div>
            )}
          </CardContent>
        </Card>

        {/* Últimos Descontos Aplicados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Últimos Descontos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orcamentosComDesconto.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Orçamento</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Desconto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orcamentosComDesconto.slice(0, 5).map((orc) => {
                    const valorDesconto = (orc.total_geral || 0) - (orc.total_com_desconto || orc.total_geral || 0);
                    return (
                      <TableRow key={orc.id}>
                        <TableCell>
                          <div className="font-medium">{orc.codigo}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(orc.created_at), 'dd/MM/yy', { locale: ptBR })}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate" title={orc.cliente_nome}>
                          {orc.cliente_nome}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="destructive">
                            {orc.desconto_tipo === 'percentual' 
                              ? `${orc.desconto_valor}%`
                              : formatCurrency(valorDesconto)
                            }
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Nenhum desconto aplicado no período
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Histórico Detalhado */}
      {historico.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Alterações</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Desconto Anterior</TableHead>
                  <TableHead>Novo Desconto</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.slice(0, 10).map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>
                      {format(new Date(h.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{h.usuario_nome}</TableCell>
                    <TableCell>
                      {h.desconto_valor_anterior 
                        ? h.desconto_tipo_anterior === 'percentual'
                          ? `${h.desconto_valor_anterior}%`
                          : formatCurrency(h.desconto_valor_anterior)
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {h.desconto_valor_novo 
                          ? h.desconto_tipo_novo === 'percentual'
                            ? `${h.desconto_valor_novo}%`
                            : formatCurrency(h.desconto_valor_novo)
                          : '-'
                        }
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {h.motivo || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
