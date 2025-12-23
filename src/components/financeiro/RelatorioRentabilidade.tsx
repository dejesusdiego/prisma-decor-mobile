import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Eye,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

type Periodo = '3m' | '6m' | '12m' | 'all';

interface RentabilidadeOrcamento {
  id: string;
  codigo: string;
  cliente_nome: string;
  created_at: string;
  status: string;
  receita: number; // total_geral
  custoMateriais: number;
  custoCostura: number;
  custoInstalacao: number;
  custoTotal: number;
  valorRecebido: number;
  valorPendente: number;
  comissoes: number;
  lucroLiquido: number;
  margemLucro: number;
  vendedores: string[];
}

interface NavigateProps {
  onVisualizarOrcamento?: (id: string) => void;
}

export function RelatorioRentabilidade({ onVisualizarOrcamento }: NavigateProps) {
  const [periodo, setPeriodo] = useState<Periodo>('6m');
  const [searchTerm, setSearchTerm] = useState('');
  const [vendedorFilter, setVendedorFilter] = useState<string>('todos');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const meses = periodo === '3m' ? 3 : periodo === '6m' ? 6 : periodo === '12m' ? 12 : 120;
  const dataInicio = startOfMonth(subMonths(new Date(), meses - 1));
  const dataFim = endOfMonth(new Date());

  // Buscar orçamentos com custos
  const { data: orcamentos = [], isLoading } = useQuery({
    queryKey: ['orcamentos-rentabilidade', periodo],
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

  // Buscar contas a receber vinculadas
  const { data: contasReceber = [] } = useQuery({
    queryKey: ['contas-receber-rentabilidade', orcamentos.map(o => o.id)],
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

  // Buscar comissões
  const { data: comissoes = [] } = useQuery({
    queryKey: ['comissoes-rentabilidade', orcamentos.map(o => o.id)],
    queryFn: async () => {
      if (orcamentos.length === 0) return [];
      
      const { data, error } = await supabase
        .from('comissoes')
        .select('*')
        .in('orcamento_id', orcamentos.map(o => o.id));
      
      if (error) throw error;
      return data;
    },
    enabled: orcamentos.length > 0
  });

  // Calcular rentabilidade por orçamento
  const rentabilidade: RentabilidadeOrcamento[] = orcamentos.map(orc => {
    const contaReceber = contasReceber.find(c => c.orcamento_id === orc.id);
    const comissoesOrc = comissoes.filter(c => c.orcamento_id === orc.id);
    
    const receita = Number(orc.total_geral) || 0;
    const custoMateriais = Number(orc.subtotal_materiais) || 0;
    const custoCostura = Number(orc.subtotal_mao_obra_costura) || 0;
    const custoInstalacao = Number(orc.subtotal_instalacao) || 0;
    const custoTotal = Number(orc.custo_total) || 0;
    const valorRecebido = contaReceber ? Number(contaReceber.valor_pago) || 0 : 0;
    const valorPendente = contaReceber ? (Number(contaReceber.valor_total) - Number(contaReceber.valor_pago)) || 0 : receita;
    const totalComissoes = comissoesOrc.reduce((acc, c) => acc + Number(c.valor_comissao), 0);
    
    // Vendedores vinculados a este orçamento
    const vendedoresOrc = [...new Set(comissoesOrc.map(c => c.vendedor_nome))];
    
    const lucroLiquido = receita - custoTotal - totalComissoes;
    const margemLucro = receita > 0 ? (lucroLiquido / receita) * 100 : 0;

    return {
      id: orc.id,
      codigo: orc.codigo,
      cliente_nome: orc.cliente_nome,
      created_at: orc.created_at,
      status: orc.status,
      receita,
      custoMateriais,
      custoCostura,
      custoInstalacao,
      custoTotal,
      valorRecebido,
      valorPendente,
      comissoes: totalComissoes,
      lucroLiquido,
      margemLucro,
      vendedores: vendedoresOrc
    };
  });

  // Lista de todos os vendedores
  const todosVendedores = useMemo(() => {
    const nomes = new Set(comissoes.map(c => c.vendedor_nome));
    return Array.from(nomes).sort();
  }, [comissoes]);

  // Filtrar por busca e vendedor
  const rentabilidadeFiltrada = rentabilidade.filter(r => {
    const matchesSearch = r.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVendedor = vendedorFilter === 'todos' || r.vendedores.includes(vendedorFilter);
    
    return matchesSearch && matchesVendedor;
  });

  // Totais
  const totais = rentabilidadeFiltrada.reduce((acc, r) => ({
    receita: acc.receita + r.receita,
    custoTotal: acc.custoTotal + r.custoTotal,
    comissoes: acc.comissoes + r.comissoes,
    lucroLiquido: acc.lucroLiquido + r.lucroLiquido,
    valorRecebido: acc.valorRecebido + r.valorRecebido,
    valorPendente: acc.valorPendente + r.valorPendente
  }), { receita: 0, custoTotal: 0, comissoes: 0, lucroLiquido: 0, valorRecebido: 0, valorPendente: 0 });

  const margemMedia = totais.receita > 0 ? (totais.lucroLiquido / totais.receita) * 100 : 0;

  // Dados para gráfico - Top 10 por lucro
  const topLucro = [...rentabilidadeFiltrada]
    .sort((a, b) => b.lucroLiquido - a.lucroLiquido)
    .slice(0, 10)
    .map(r => ({
      nome: r.codigo,
      lucro: r.lucroLiquido,
      margem: r.margemLucro
    }));

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getMargemBadge = (margem: number) => {
    if (margem >= 50) return <Badge className="bg-green-500/10 text-green-600">Excelente</Badge>;
    if (margem >= 30) return <Badge className="bg-blue-500/10 text-blue-600">Boa</Badge>;
    if (margem >= 15) return <Badge className="bg-yellow-500/10 text-yellow-600">Regular</Badge>;
    if (margem >= 0) return <Badge className="bg-orange-500/10 text-orange-600">Baixa</Badge>;
    return <Badge variant="destructive">Prejuízo</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rentabilidade por Orçamento</h1>
          <p className="text-muted-foreground">Análise de lucro: Receita - Custos - Comissões</p>
        </div>
        <div className="flex gap-2">
          {todosVendedores.length > 0 && (
            <Select value={vendedorFilter} onValueChange={setVendedorFilter}>
              <SelectTrigger className="w-[160px]">
                <Users className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos vendedores</SelectItem>
                {todosVendedores.map(v => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatCurrency(totais.receita)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Custos Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-destructive">{formatCurrency(totais.custoTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Comissões</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-orange-600">{formatCurrency(totais.comissoes)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Lucro Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-xl font-bold ${totais.lucroLiquido >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {formatCurrency(totais.lucroLiquido)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Margem Média</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-xl font-bold ${margemMedia >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {margemMedia.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Orçamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{rentabilidadeFiltrada.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Top 10 */}
      {topLucro.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top 10 Orçamentos por Lucro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topLucro} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
                  <YAxis dataKey="nome" type="category" width={100} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="lucro" name="Lucro" radius={[0, 4, 4, 0]}>
                    {topLucro.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.lucro >= 0 ? 'hsl(142.1 76.2% 36.3%)' : 'hsl(var(--destructive))'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtro e tabela */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div>
              <CardTitle>Detalhamento por Orçamento</CardTitle>
              <CardDescription>Clique para expandir e ver detalhes</CardDescription>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Custos</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
                <TableHead className="text-center">Margem</TableHead>
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
              ) : rentabilidadeFiltrada.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum orçamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                rentabilidadeFiltrada.map((item) => (
                  <Collapsible key={item.id} asChild open={expandedRows.has(item.id)}>
                    <>
                      <TableRow 
                        className="cursor-pointer hover:bg-muted/50" 
                        onClick={() => toggleRow(item.id)}
                      >
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              {expandedRows.has(item.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell className="font-medium">{item.codigo}</TableCell>
                        <TableCell>{item.cliente_nome}</TableCell>
                        <TableCell>
                          {format(new Date(item.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.receita)}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          {formatCurrency(item.custoTotal)}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${item.lucroLiquido >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                          {formatCurrency(item.lucroLiquido)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getMargemBadge(item.margemLucro)}
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({item.margemLucro.toFixed(1)}%)
                          </span>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
                      <CollapsibleContent asChild>
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={9} className="p-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Materiais</p>
                                <p className="font-medium">{formatCurrency(item.custoMateriais)}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Costura</p>
                                <p className="font-medium">{formatCurrency(item.custoCostura)}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Instalação</p>
                                <p className="font-medium">{formatCurrency(item.custoInstalacao)}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Comissões</p>
                                <p className="font-medium text-orange-600">{formatCurrency(item.comissoes)}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Valor Recebido</p>
                                <p className="font-medium text-green-600">{formatCurrency(item.valorRecebido)}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Valor Pendente</p>
                                <p className="font-medium text-yellow-600">{formatCurrency(item.valorPendente)}</p>
                              </div>
                              <div className="col-span-2 space-y-1 bg-primary/5 p-3 rounded-lg">
                                <p className="text-xs text-muted-foreground">Fórmula do Lucro</p>
                                <p className="text-sm">
                                  {formatCurrency(item.receita)} - {formatCurrency(item.custoTotal)} - {formatCurrency(item.comissoes)} = 
                                  <span className={`ml-2 font-bold ${item.lucroLiquido >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                                    {formatCurrency(item.lucroLiquido)}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
