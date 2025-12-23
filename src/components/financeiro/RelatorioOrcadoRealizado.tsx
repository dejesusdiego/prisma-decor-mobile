import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  Target,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  FileText,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
  Legend,
  ReferenceLine
} from 'recharts';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

type Periodo = '3m' | '6m' | '12m' | 'all';

interface ComparacaoOrcamento {
  id: string;
  codigo: string;
  cliente_nome: string;
  created_at: string;
  status: string;
  // Orçado
  receitaOrcada: number;
  custoOrcado: number;
  lucroOrcado: number;
  margemOrcada: number;
  // Realizado
  receitaRealizada: number;
  custoRealizado: number;
  lucroRealizado: number;
  margemRealizada: number;
  // Variação
  variacaoReceita: number;
  variacaoCusto: number;
  variacaoLucro: number;
  percentualRecebido: number;
  // Status financeiro
  temContaReceber: boolean;
  temContasPagar: boolean;
}

interface NavigateProps {
  onVisualizarOrcamento?: (id: string) => void;
}

export function RelatorioOrcadoRealizado({ onVisualizarOrcamento }: NavigateProps) {
  const [periodo, setPeriodo] = useState<Periodo>('6m');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  const meses = periodo === '3m' ? 3 : periodo === '6m' ? 6 : periodo === '12m' ? 12 : 120;
  const dataInicio = startOfMonth(subMonths(new Date(), meses - 1));
  const dataFim = endOfMonth(new Date());

  // Buscar orçamentos
  const { data: orcamentos = [], isLoading } = useQuery({
    queryKey: ['orcamentos-orcado-realizado', periodo],
    queryFn: async () => {
      let query = supabase
        .from('orcamentos')
        .select('*')
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

  // Buscar contas a receber
  const { data: contasReceber = [] } = useQuery({
    queryKey: ['contas-receber-orcado', orcamentos.map(o => o.id)],
    queryFn: async () => {
      if (orcamentos.length === 0) return [];
      
      const { data, error } = await supabase
        .from('contas_receber')
        .select('*')
        .in('orcamento_id', orcamentos.map(o => o.id));
      
      if (error) throw error;
      return data;
    },
    enabled: orcamentos.length > 0
  });

  // Buscar contas a pagar
  const { data: contasPagar = [] } = useQuery({
    queryKey: ['contas-pagar-orcado', orcamentos.map(o => o.id)],
    queryFn: async () => {
      if (orcamentos.length === 0) return [];
      
      const { data, error } = await supabase
        .from('contas_pagar')
        .select('*')
        .in('orcamento_id', orcamentos.map(o => o.id));
      
      if (error) throw error;
      return data;
    },
    enabled: orcamentos.length > 0
  });

  // Calcular comparação
  const comparacoes: ComparacaoOrcamento[] = orcamentos.map(orc => {
    const contaReceber = contasReceber.find(c => c.orcamento_id === orc.id);
    const custosPagar = contasPagar.filter(c => c.orcamento_id === orc.id);
    
    // ORÇADO (valores do orçamento original)
    const receitaOrcada = Number(orc.total_com_desconto ?? orc.total_geral) || 0;
    const custoOrcado = Number(orc.custo_total) || 0;
    const lucroOrcado = receitaOrcada - custoOrcado;
    const margemOrcada = receitaOrcada > 0 ? (lucroOrcado / receitaOrcada) * 100 : 0;
    
    // REALIZADO (valores efetivamente recebidos/pagos)
    const receitaRealizada = contaReceber ? Number(contaReceber.valor_pago) || 0 : 0;
    const custoRealizado = custosPagar
      .filter(c => c.status === 'pago')
      .reduce((acc, c) => acc + Number(c.valor), 0);
    const lucroRealizado = receitaRealizada - custoRealizado;
    const margemRealizada = receitaRealizada > 0 ? (lucroRealizado / receitaRealizada) * 100 : 0;
    
    // VARIAÇÃO (realizado - orçado)
    const variacaoReceita = receitaRealizada - receitaOrcada;
    const variacaoCusto = custoRealizado - custoOrcado;
    const variacaoLucro = lucroRealizado - lucroOrcado;
    
    // Percentual de recebimento
    const percentualRecebido = receitaOrcada > 0 ? (receitaRealizada / receitaOrcada) * 100 : 0;

    return {
      id: orc.id,
      codigo: orc.codigo,
      cliente_nome: orc.cliente_nome,
      created_at: orc.created_at,
      status: orc.status,
      receitaOrcada,
      custoOrcado,
      lucroOrcado,
      margemOrcada,
      receitaRealizada,
      custoRealizado,
      lucroRealizado,
      margemRealizada,
      variacaoReceita,
      variacaoCusto,
      variacaoLucro,
      percentualRecebido,
      temContaReceber: !!contaReceber,
      temContasPagar: custosPagar.length > 0
    };
  });

  // Filtrar
  const comparacoesFiltradas = comparacoes.filter(c => {
    const matchesSearch = c.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (filtroStatus === 'concluido') {
      matchesStatus = c.percentualRecebido >= 100;
    } else if (filtroStatus === 'em_andamento') {
      matchesStatus = c.percentualRecebido > 0 && c.percentualRecebido < 100;
    } else if (filtroStatus === 'pendente') {
      matchesStatus = c.percentualRecebido === 0 && c.temContaReceber;
    } else if (filtroStatus === 'sem_financeiro') {
      matchesStatus = !c.temContaReceber;
    }
    
    return matchesSearch && matchesStatus;
  });

  // Totais
  const totais = comparacoesFiltradas.reduce((acc, c) => ({
    receitaOrcada: acc.receitaOrcada + c.receitaOrcada,
    receitaRealizada: acc.receitaRealizada + c.receitaRealizada,
    custoOrcado: acc.custoOrcado + c.custoOrcado,
    custoRealizado: acc.custoRealizado + c.custoRealizado,
    lucroOrcado: acc.lucroOrcado + c.lucroOrcado,
    lucroRealizado: acc.lucroRealizado + c.lucroRealizado
  }), { receitaOrcada: 0, receitaRealizada: 0, custoOrcado: 0, custoRealizado: 0, lucroOrcado: 0, lucroRealizado: 0 });

  // Dados para gráfico comparativo
  const dadosGrafico = [
    { 
      nome: 'Receita', 
      orcado: totais.receitaOrcada, 
      realizado: totais.receitaRealizada,
      variacao: totais.receitaRealizada - totais.receitaOrcada
    },
    { 
      nome: 'Custos', 
      orcado: totais.custoOrcado, 
      realizado: totais.custoRealizado,
      variacao: totais.custoRealizado - totais.custoOrcado
    },
    { 
      nome: 'Lucro', 
      orcado: totais.lucroOrcado, 
      realizado: totais.lucroRealizado,
      variacao: totais.lucroRealizado - totais.lucroOrcado
    }
  ];

  const getStatusBadge = (c: ComparacaoOrcamento) => {
    if (c.percentualRecebido >= 100) {
      return <Badge className="bg-green-500/10 text-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Concluído</Badge>;
    }
    if (c.percentualRecebido > 0) {
      return <Badge className="bg-blue-500/10 text-blue-600">Em Andamento</Badge>;
    }
    if (c.temContaReceber) {
      return <Badge className="bg-amber-500/10 text-amber-600">Pendente</Badge>;
    }
    return <Badge variant="outline">Sem Financeiro</Badge>;
  };

  const getVariacaoIcon = (variacao: number, inverso = false) => {
    const isPositive = inverso ? variacao < 0 : variacao > 0;
    if (variacao === 0) return null;
    return isPositive ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orçado vs Realizado</h1>
          <p className="text-muted-foreground">Compare o planejado com o efetivamente executado</p>
        </div>
        <div className="flex gap-2">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="concluido">Concluídos</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="sem_financeiro">Sem Financeiro</SelectItem>
            </SelectContent>
          </Select>
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">Últimos 3 meses</SelectItem>
              <SelectItem value="6m">Últimos 6 meses</SelectItem>
              <SelectItem value="12m">Últimos 12 meses</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de resumo comparativo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Orçado</span>
                <span className="font-medium">{formatCurrency(totais.receitaOrcada)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Realizado</span>
                <span className="font-bold text-green-600">{formatCurrency(totais.receitaRealizada)}</span>
              </div>
              <Progress 
                value={totais.receitaOrcada > 0 ? (totais.receitaRealizada / totais.receitaOrcada) * 100 : 0} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground text-right">
                {totais.receitaOrcada > 0 
                  ? ((totais.receitaRealizada / totais.receitaOrcada) * 100).toFixed(1) 
                  : 0}% realizado
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Custos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Orçado</span>
                <span className="font-medium">{formatCurrency(totais.custoOrcado)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Realizado</span>
                <span className={`font-bold ${totais.custoRealizado <= totais.custoOrcado ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totais.custoRealizado)}
                </span>
              </div>
              <Progress 
                value={totais.custoOrcado > 0 ? (totais.custoRealizado / totais.custoOrcado) * 100 : 0} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground text-right">
                {totais.custoOrcado > 0 
                  ? ((totais.custoRealizado / totais.custoOrcado) * 100).toFixed(1) 
                  : 0}% pago
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Lucro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Orçado</span>
                <span className="font-medium">{formatCurrency(totais.lucroOrcado)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Realizado</span>
                <span className={`font-bold ${totais.lucroRealizado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totais.lucroRealizado)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground">Variação:</span>
                <div className="flex items-center gap-1">
                  {getVariacaoIcon(totais.lucroRealizado - totais.lucroOrcado)}
                  <span className={`text-sm font-medium ${(totais.lucroRealizado - totais.lucroOrcado) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totais.lucroRealizado - totais.lucroOrcado)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Comparativo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Comparativo Orçado vs Realizado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosGrafico} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="nome" />
                <YAxis tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                <Bar dataKey="orcado" name="Orçado" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="realizado" name="Realizado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div>
              <CardTitle>Detalhamento por Orçamento</CardTitle>
              <CardDescription>Comparação individual de cada orçamento</CardDescription>
            </div>
            <Input
              placeholder="Buscar por cliente ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-[300px]"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Receita Orç.</TableHead>
                  <TableHead className="text-right">Receita Real.</TableHead>
                  <TableHead className="text-right">Lucro Orç.</TableHead>
                  <TableHead className="text-right">Lucro Real.</TableHead>
                  <TableHead className="text-center">Progresso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : comparacoesFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Nenhum orçamento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  comparacoesFiltradas.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.codigo}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{item.cliente_nome}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(item)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.receitaOrcada)}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(item.receitaRealizada)}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.lucroOrcado)}</TableCell>
                      <TableCell className={`text-right font-bold ${item.lucroRealizado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(item.lucroRealizado)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={Math.min(item.percentualRecebido, 100)} 
                            className="h-2 w-16"
                          />
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {item.percentualRecebido.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {onVisualizarOrcamento && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onVisualizarOrcamento(item.id)}
                            title="Ver Orçamento"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
