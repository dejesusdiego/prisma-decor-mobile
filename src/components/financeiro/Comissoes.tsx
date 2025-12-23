import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  ExternalLink,
  TrendingUp,
  BarChart3,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { DialogComissao } from './dialogs/DialogComissao';
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
  Legend
} from 'recharts';

type StatusFilter = 'todos' | 'pendente' | 'pago';
type Periodo = '3m' | '6m' | '12m' | 'all';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const COLORS = ['hsl(var(--primary))', 'hsl(142.1 76.2% 36.3%)', 'hsl(221.2 83.2% 53.3%)', 'hsl(47.9 95.8% 53.1%)', 'hsl(262.1 83.3% 57.8%)', 'hsl(24.6 95% 53.1%)'];

interface ComissoesProps {
  onVisualizarOrcamento?: (orcamentoId: string) => void;
}

export function Comissoes({ onVisualizarOrcamento }: ComissoesProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [vendedorFilter, setVendedorFilter] = useState<string>('todos');
  const [periodo, setPeriodo] = useState<Periodo>('6m');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [comissaoEditando, setComissaoEditando] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const meses = periodo === '3m' ? 3 : periodo === '6m' ? 6 : periodo === '12m' ? 12 : 120;
  const dataInicio = startOfMonth(subMonths(new Date(), meses - 1));
  const dataFim = endOfMonth(new Date());

  const { data: comissoes = [], isLoading } = useQuery({
    queryKey: ['comissoes', periodo],
    queryFn: async () => {
      let query = supabase
        .from('comissoes')
        .select(`
          *,
          orcamento:orcamentos(id, codigo, cliente_nome, total_geral)
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

  // Lista única de vendedores
  const vendedores = useMemo(() => {
    const nomes = new Set(comissoes.map(c => c.vendedor_nome));
    return Array.from(nomes).sort();
  }, [comissoes]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('comissoes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      toast.success('Comissão excluída com sucesso');
    },
    onError: () => {
      toast.error('Erro ao excluir comissão');
    }
  });

  const pagarMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('comissoes')
        .update({ status: 'pago', data_pagamento: new Date().toISOString().split('T')[0] })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      toast.success('Comissão marcada como paga');
    },
    onError: () => {
      toast.error('Erro ao pagar comissão');
    }
  });

  // Filtros combinados
  const filteredComissoes = useMemo(() => {
    return comissoes.filter(comissao => {
      const matchesSearch = 
        comissao.vendedor_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comissao.orcamento?.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comissao.orcamento?.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'todos' || comissao.status === statusFilter;
      const matchesVendedor = vendedorFilter === 'todos' || comissao.vendedor_nome === vendedorFilter;

      return matchesSearch && matchesStatus && matchesVendedor;
    });
  }, [comissoes, searchTerm, statusFilter, vendedorFilter]);

  // Totais gerais
  const totais = useMemo(() => ({
    pendente: filteredComissoes.filter(c => c.status === 'pendente').reduce((acc, c) => acc + Number(c.valor_comissao), 0),
    pago: filteredComissoes.filter(c => c.status === 'pago').reduce((acc, c) => acc + Number(c.valor_comissao), 0),
    total: filteredComissoes.reduce((acc, c) => acc + Number(c.valor_comissao), 0),
    quantidade: filteredComissoes.length,
    percentualMedio: filteredComissoes.length > 0 
      ? filteredComissoes.reduce((acc, c) => acc + Number(c.percentual), 0) / filteredComissoes.length 
      : 0
  }), [filteredComissoes]);

  // Dados para gráfico de barras - por vendedor
  const dadosPorVendedor = useMemo(() => {
    const porVendedor: Record<string, { pendente: number; pago: number; total: number; count: number }> = {};
    
    filteredComissoes.forEach(c => {
      if (!porVendedor[c.vendedor_nome]) {
        porVendedor[c.vendedor_nome] = { pendente: 0, pago: 0, total: 0, count: 0 };
      }
      const valor = Number(c.valor_comissao);
      porVendedor[c.vendedor_nome].total += valor;
      porVendedor[c.vendedor_nome].count += 1;
      if (c.status === 'pago') {
        porVendedor[c.vendedor_nome].pago += valor;
      } else {
        porVendedor[c.vendedor_nome].pendente += valor;
      }
    });

    return Object.entries(porVendedor)
      .map(([nome, valores]) => ({ nome, ...valores }))
      .sort((a, b) => b.total - a.total);
  }, [filteredComissoes]);

  // Dados para gráfico de pizza - status
  const dadosStatus = useMemo(() => [
    { name: 'Pago', value: totais.pago, color: 'hsl(142.1 76.2% 36.3%)' },
    { name: 'Pendente', value: totais.pendente, color: 'hsl(47.9 95.8% 53.1%)' }
  ].filter(d => d.value > 0), [totais]);

  // Dados para gráfico de evolução mensal
  const dadosMensal = useMemo(() => {
    const porMes: Record<string, { mes: string; pago: number; pendente: number }> = {};
    
    filteredComissoes.forEach(c => {
      const mesKey = format(new Date(c.created_at), 'yyyy-MM');
      const mesLabel = format(new Date(c.created_at), 'MMM/yy', { locale: ptBR });
      
      if (!porMes[mesKey]) {
        porMes[mesKey] = { mes: mesLabel, pago: 0, pendente: 0 };
      }
      
      const valor = Number(c.valor_comissao);
      if (c.status === 'pago') {
        porMes[mesKey].pago += valor;
      } else {
        porMes[mesKey].pendente += valor;
      }
    });

    return Object.entries(porMes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [filteredComissoes]);

  const handleEdit = (comissao: any) => {
    setComissaoEditando(comissao);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setComissaoEditando(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comissões</h1>
          <p className="text-muted-foreground">Dashboard e gestão de comissões dos vendedores</p>
        </div>
        <div className="flex gap-2">
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
            <SelectTrigger className="w-[140px]">
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
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Comissão
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-primary">{formatCurrency(totais.total)}</p>
            <p className="text-xs text-muted-foreground">{totais.quantidade} comissões</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totais.pago)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-yellow-600">{formatCurrency(totais.pendente)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Vendedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{vendedores.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              % Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{totais.percentualMedio.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Dashboard / Lista */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="lista" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Lista
          </TabsTrigger>
        </TabsList>

        {/* Tab Dashboard */}
        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico por vendedor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Comissões por Vendedor
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dadosPorVendedor.length > 0 ? (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosPorVendedor} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
                        <YAxis dataKey="nome" type="category" width={100} className="text-xs" />
                        <RechartsTooltip 
                          formatter={(value: number, name: string) => [formatCurrency(value), name === 'pago' ? 'Pago' : 'Pendente']}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="pago" name="Pago" stackId="a" fill="hsl(142.1 76.2% 36.3%)" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="pendente" name="Pendente" stackId="a" fill="hsl(47.9 95.8% 53.1%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                    Sem dados para exibir
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráfico de status (pizza) e evolução mensal */}
            <div className="space-y-4">
              {/* Distribuição por status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Distribuição por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {dadosStatus.length > 0 ? (
                    <div className="h-[120px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dadosStatus}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={50}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {dadosStatus.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Legend 
                            formatter={(value, entry: any) => (
                              <span className="text-xs">{value}: {formatCurrency(entry.payload.value)}</span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm">
                      Sem dados
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Evolução mensal */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Evolução Mensal</CardTitle>
                </CardHeader>
                <CardContent>
                  {dadosMensal.length > 0 ? (
                    <div className="h-[120px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dadosMensal}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="mes" className="text-[10px]" />
                          <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} className="text-[10px]" />
                          <RechartsTooltip 
                            formatter={(value: number, name: string) => [formatCurrency(value), name === 'pago' ? 'Pago' : 'Pendente']}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Bar dataKey="pago" name="Pago" stackId="a" fill="hsl(142.1 76.2% 36.3%)" />
                          <Bar dataKey="pendente" name="Pendente" stackId="a" fill="hsl(47.9 95.8% 53.1%)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm">
                      Sem dados
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Ranking de vendedores */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ranking de Vendedores</CardTitle>
              <CardDescription>Ordenado por valor total de comissões</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead className="text-right">Pago</TableHead>
                    <TableHead className="text-right">Pendente</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dadosPorVendedor.slice(0, 5).map((v, i) => (
                    <TableRow key={v.nome}>
                      <TableCell className="font-medium">
                        <Badge variant={i === 0 ? 'default' : 'outline'}>
                          {i + 1}º
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{v.nome}</TableCell>
                      <TableCell className="text-center">{v.count}</TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(v.pago)}</TableCell>
                      <TableCell className="text-right text-yellow-600">{formatCurrency(v.pendente)}</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(v.total)}</TableCell>
                    </TableRow>
                  ))}
                  {dadosPorVendedor.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        Nenhum vendedor com comissões no período
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Lista */}
        <TabsContent value="lista" className="space-y-4 mt-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por vendedor, orçamento ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={vendedorFilter} onValueChange={setVendedorFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Users className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos vendedores</SelectItem>
                {vendedores.map(v => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Orçamento</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Base</TableHead>
                    <TableHead className="text-center">%</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : filteredComissoes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-8 w-8" />
                          <p>Nenhuma comissão encontrada</p>
                          <Button variant="outline" size="sm" onClick={handleNew}>
                            <Plus className="h-4 w-4 mr-2" />
                            Criar primeira comissão
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredComissoes.map((comissao) => (
                      <TableRow key={comissao.id}>
                        <TableCell className="font-medium">
                          {comissao.vendedor_nome}
                        </TableCell>
                        <TableCell>
                          {comissao.orcamento ? (
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs">{comissao.orcamento.codigo}</span>
                              {onVisualizarOrcamento && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5"
                                        onClick={() => onVisualizarOrcamento(comissao.orcamento_id)}
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Ver orçamento</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{comissao.orcamento?.cliente_nome || '-'}</TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(Number(comissao.valor_base))}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs">{comissao.percentual}%</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatCurrency(Number(comissao.valor_comissao))}
                        </TableCell>
                        <TableCell>
                          {comissao.status === 'pago' ? (
                            <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Pago
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Pendente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {comissao.status === 'pendente' && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => pagarMutation.mutate(comissao.id)}
                                    >
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Marcar como pago</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEdit(comissao)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => deleteMutation.mutate(comissao.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DialogComissao
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        comissao={comissaoEditando}
      />
    </div>
  );
}