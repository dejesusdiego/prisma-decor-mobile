import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollAreaTopBar } from '@/components/ui/scroll-area';
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
import { 
  Target,
  GripVertical,
  MoreHorizontal,
  Eye,
  Calendar,
  List,
  BarChart3,
  Kanban,
  LayoutGrid,
  FileText,
  DollarSign,
  User,
  Phone,
  MapPin,
  Filter,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  STATUS_PIPELINE_CONFIG,
  getStatusConfig,
  formatCurrency 
} from '@/lib/mapearStatusEtapa';

import { PipelineCompacto } from './visualizacoes/PipelineCompacto';
import { FunilPipeline } from './visualizacoes/FunilPipeline';
import { ListaInteligente } from './visualizacoes/ListaInteligente';
import { GridPipeline } from './visualizacoes/GridPipeline';
import { DialogCondicoesPagamento } from '@/components/financeiro/dialogs/DialogCondicoesPagamento';

type ViewType = 'kanban' | 'compacto' | 'funil' | 'lista' | 'grid' | 'grafico' | 'resumo';

// Status que indicam pagamento - requerem Dialog de Condições
const STATUS_PAGAMENTO = ['pago_40', 'pago_parcial', 'pago_60', 'pago'];

interface OrcamentoPipeline {
  id: string;
  codigo: string;
  cliente_nome: string;
  cliente_telefone: string;
  cidade: string | null;
  status: string;
  total_com_desconto: number | null;
  total_geral: number | null;
  created_at: string;
  updated_at: string;
  contato_id: string | null;
  created_by_user_id: string;
  contato?: {
    id: string;
    nome: string;
    telefone: string | null;
    cidade: string | null;
  } | null;
}

// Usar apenas status mais relevantes no pipeline
const STATUS_PIPELINE_VISIVEL = STATUS_PIPELINE_CONFIG.filter(s => 
  ['rascunho', 'finalizado', 'enviado', 'sem_resposta', 'pago_40', 'pago_parcial', 'pago_60', 'pago', 'recusado', 'cancelado'].includes(s.id)
);

// Períodos predefinidos
const PERIODOS = [
  { id: 'todos', label: 'Todos os períodos' },
  { id: 'mes_atual', label: 'Mês Atual' },
  { id: 'mes_passado', label: 'Mês Passado' },
  { id: 'ultimos_3_meses', label: 'Últimos 3 meses' },
  { id: 'ultimos_6_meses', label: 'Últimos 6 meses' },
];

interface PipelineOrcamentosProps {
  onVerOrcamento?: (orcamentoId: string) => void;
  onVerContato?: (contatoId: string) => void;
}

export function PipelineOrcamentos({ onVerOrcamento, onVerContato }: PipelineOrcamentosProps) {
  const [viewType, setViewType] = useState<ViewType>('kanban');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  
  // Filtros
  const [periodoFilter, setPeriodoFilter] = useState<string>('todos');
  const [cidadeFilter, setCidadeFilter] = useState<string>('todas');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Buscar orçamentos com contato vinculado
  const { data: orcamentos, isLoading, refetch } = useQuery({
    queryKey: ['orcamentos-pipeline'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orcamentos')
        .select(`
          id,
          codigo,
          cliente_nome,
          cliente_telefone,
          cidade,
          status,
          total_com_desconto,
          total_geral,
          created_at,
          updated_at,
          contato_id,
          created_by_user_id,
          contato:contatos(id, nome, telefone, cidade)
        `)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as OrcamentoPipeline[];
    }
  });

  // Extrair cidades únicas para filtro
  const cidadesUnicas = useMemo(() => {
    if (!orcamentos) return [];
    const cidades = orcamentos
      .map(o => o.cidade)
      .filter((c): c is string => !!c);
    return [...new Set(cidades)].sort();
  }, [orcamentos]);

  // Aplicar filtros
  const orcamentosFiltrados = useMemo(() => {
    if (!orcamentos) return [];
    
    return orcamentos.filter(o => {
      // Filtro de período
      if (periodoFilter !== 'todos') {
        const dataOrcamento = new Date(o.created_at);
        const hoje = new Date();
        
        switch (periodoFilter) {
          case 'mes_atual':
            if (dataOrcamento < startOfMonth(hoje) || dataOrcamento > endOfMonth(hoje)) return false;
            break;
          case 'mes_passado':
            const mesPassado = subMonths(hoje, 1);
            if (dataOrcamento < startOfMonth(mesPassado) || dataOrcamento > endOfMonth(mesPassado)) return false;
            break;
          case 'ultimos_3_meses':
            if (dataOrcamento < subMonths(hoje, 3)) return false;
            break;
          case 'ultimos_6_meses':
            if (dataOrcamento < subMonths(hoje, 6)) return false;
            break;
        }
      }
      
      // Filtro de cidade
      if (cidadeFilter !== 'todas' && o.cidade !== cidadeFilter) return false;
      
      return true;
    });
  }, [orcamentos, periodoFilter, cidadeFilter]);

  // Agrupar orçamentos filtrados por status
  const orcamentosPorStatus = useMemo(() => {
    return STATUS_PIPELINE_VISIVEL.reduce((acc, status) => {
      acc[status.id] = orcamentosFiltrados.filter(o => o.status === status.id);
      return acc;
    }, {} as Record<string, OrcamentoPipeline[]>);
  }, [orcamentosFiltrados]);

  // Verificar se há filtros ativos
  const temFiltrosAtivos = periodoFilter !== 'todos' || cidadeFilter !== 'todas';

  const limparFiltros = () => {
    setPeriodoFilter('todos');
    setCidadeFilter('todas');
  };

  // Estado para dialog de condições de pagamento
  const [dialogPagamentoOpen, setDialogPagamentoOpen] = useState(false);
  const [orcamentoParaPagamento, setOrcamentoParaPagamento] = useState<OrcamentoPipeline | null>(null);
  const [novoStatusPendente, setNovoStatusPendente] = useState<string>('');

  // Drag and drop - atualiza status do orçamento
  const handleDragStart = (e: React.DragEvent, orcamentoId: string) => {
    setDraggedId(orcamentoId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, novoStatus: string) => {
    e.preventDefault();
    if (!draggedId) {
      setDraggedId(null);
      return;
    }

    const orcamento = orcamentos?.find(o => o.id === draggedId);
    if (!orcamento) {
      setDraggedId(null);
      return;
    }

    const statusAtualEhPagamento = STATUS_PAGAMENTO.includes(orcamento.status);
    const novoStatusEhPagamento = STATUS_PAGAMENTO.includes(novoStatus);

    // Se está mudando para status de pagamento e NÃO estava em um status de pagamento
    // Abre o dialog para configurar condições de pagamento
    if (novoStatusEhPagamento && !statusAtualEhPagamento) {
      setOrcamentoParaPagamento(orcamento);
      setNovoStatusPendente(novoStatus);
      setDialogPagamentoOpen(true);
      setDraggedId(null);
      return;
    }

    // Atualização normal para outros status
    const { error } = await supabase
      .from('orcamentos')
      .update({ status: novoStatus })
      .eq('id', draggedId);
    
    if (!error) {
      refetch();
    }
    setDraggedId(null);
  };

  const handleDialogPagamentoSuccess = () => {
    setOrcamentoParaPagamento(null);
    setNovoStatusPendente('');
    refetch();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-96 w-72 shrink-0" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Dados para gráfico
  const dadosGrafico = STATUS_PIPELINE_VISIVEL.map(status => {
    const itens = orcamentosPorStatus[status.id] || [];
    return {
      status: status.label,
      quantidade: itens.length,
      valor: itens.reduce((sum, o) => sum + (o.total_com_desconto || o.total_geral || 0), 0),
      color: status.color
    };
  });

  // Totais (usando orçamentos filtrados)
  const totalPipeline = orcamentosFiltrados.reduce((sum, o) => sum + (o.total_com_desconto || o.total_geral || 0), 0);
  const totalOrcamentos = orcamentosFiltrados.length;

  const renderOrcamentoCard = (orcamento: OrcamentoPipeline, draggable = false) => {
    const valor = orcamento.total_com_desconto || orcamento.total_geral || 0;
    const statusConfig = getStatusConfig(orcamento.status);
    
    return (
      <div
        key={orcamento.id}
        draggable={draggable}
        onDragStart={draggable ? (e) => handleDragStart(e, orcamento.id) : undefined}
        className={cn(
          "bg-card rounded-lg border p-3 shadow-sm hover:shadow transition-shadow",
          draggable && "cursor-grab active:cursor-grabbing",
          draggedId === orcamento.id && "opacity-50"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {draggable && <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />}
            <div className="min-w-0">
              <p className="font-medium text-sm truncate flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {orcamento.codigo}
              </p>
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <User className="h-3 w-3" />
                {orcamento.cliente_nome}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onVerOrcamento && (
                <DropdownMenuItem onClick={() => onVerOrcamento(orcamento.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Orçamento
                </DropdownMenuItem>
              )}
              {orcamento.contato_id && onVerContato && (
                <DropdownMenuItem onClick={() => onVerContato(orcamento.contato_id!)}>
                  <User className="mr-2 h-4 w-4" />
                  Ver Contato
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Info do cliente */}
        <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-muted-foreground">
          {orcamento.cliente_telefone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {orcamento.cliente_telefone}
            </span>
          )}
          {orcamento.cidade && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {orcamento.cidade}
            </span>
          )}
        </div>

        {/* Contato vinculado */}
        {orcamento.contato && (
          <Badge variant="outline" className="mt-2 text-xs bg-emerald-50 text-emerald-700">
            <User className="h-3 w-3 mr-1" />
            Contato: {orcamento.contato.nome}
          </Badge>
        )}
        
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm font-semibold flex items-center gap-1 text-emerald-600">
            <DollarSign className="h-3 w-3" />
            {formatCurrency(valor)}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(orcamento.updated_at), { addSuffix: true, locale: ptBR })}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Pipeline de Orçamentos
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {totalOrcamentos} orçamentos • {formatCurrency(totalPipeline)} no pipeline
            {temFiltrosAtivos && (
              <span className="text-primary"> (filtrado)</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtros */}
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtros
                {temFiltrosAtivos && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                    {(periodoFilter !== 'todos' ? 1 : 0) + (cidadeFilter !== 'todas' ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filtros</h4>
                  {temFiltrosAtivos && (
                    <Button variant="ghost" size="sm" onClick={limparFiltros}>
                      <X className="h-4 w-4 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Período</label>
                  <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIODOS.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cidade</label>
                  <Select value={cidadeFilter} onValueChange={setCidadeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as cidades</SelectItem>
                      {cidadesUnicas.map(cidade => (
                        <SelectItem key={cidade} value={cidade}>{cidade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Seletor de visualização */}
          <div className="flex items-center border rounded-lg p-1 flex-wrap">
            <Button 
              variant={viewType === 'kanban' ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setViewType('kanban')}
              title="Kanban"
            >
              <Kanban className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewType === 'compacto' ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setViewType('compacto')}
              title="Compacto"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewType === 'funil' ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setViewType('funil')}
              title="Funil"
            >
              <Target className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewType === 'lista' ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setViewType('lista')}
              title="Lista"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewType === 'grid' ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setViewType('grid')}
              title="Grid"
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewType === 'grafico' ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setViewType('grafico')}
              title="Gráfico"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewType === 'resumo' ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setViewType('resumo')}
              title="Resumo"
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* VISÃO KANBAN */}
        {viewType === 'kanban' && (
          <ScrollAreaTopBar className="w-full">
            <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
              {STATUS_PIPELINE_VISIVEL.map((status) => {
                const itens = orcamentosPorStatus[status.id] || [];
                const valorTotal = itens.reduce((sum, o) => sum + (o.total_com_desconto || o.total_geral || 0), 0);
                
                return (
                  <div
                    key={status.id}
                    className="w-72 shrink-0"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, status.id)}
                  >
                    {/* Header da coluna */}
                    <div className={cn(
                      "rounded-t-lg px-3 py-2 text-white font-medium flex items-center justify-between",
                      status.bgClass
                    )}>
                      <span>{status.label}</span>
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        {itens.length}
                      </Badge>
                    </div>
                    
                    {/* Valor total da coluna */}
                    <div className="bg-muted/50 px-3 py-1 text-sm text-muted-foreground border-x">
                      {formatCurrency(valorTotal)}
                    </div>
                    
                    {/* Cards */}
                    <div className="border border-t-0 rounded-b-lg bg-muted/20 min-h-[300px] p-2 space-y-2">
                      {itens.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">
                          Arraste orçamentos aqui
                        </p>
                      ) : (
                        itens.map((orcamento) => renderOrcamentoCard(orcamento, true))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollAreaTopBar>
        )}

        {/* VISÃO COMPACTO */}
        {viewType === 'compacto' && (
          <PipelineCompacto
            orcamentosPorStatus={orcamentosPorStatus}
            statusConfig={STATUS_PIPELINE_VISIVEL}
            onVerOrcamento={onVerOrcamento}
            onVerContato={onVerContato}
          />
        )}

        {/* VISÃO FUNIL */}
        {viewType === 'funil' && (
          <FunilPipeline
            orcamentosPorStatus={orcamentosPorStatus}
            statusConfig={STATUS_PIPELINE_VISIVEL}
            onVerOrcamento={onVerOrcamento}
            onVerContato={onVerContato}
          />
        )}

        {/* VISÃO GRID */}
        {viewType === 'grid' && (
          <GridPipeline
            orcamentos={orcamentosFiltrados}
            statusConfig={STATUS_PIPELINE_VISIVEL}
            onVerOrcamento={onVerOrcamento}
            onVerContato={onVerContato}
          />
        )}

        {/* VISÃO LISTA */}
        {viewType === 'lista' && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orcamentos?.map((orcamento) => {
                  const statusConfig = getStatusConfig(orcamento.status);
                  const valor = orcamento.total_com_desconto || orcamento.total_geral || 0;
                  
                  return (
                    <TableRow key={orcamento.id}>
                      <TableCell>
                        <span className="font-medium">{orcamento.codigo}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {orcamento.cliente_nome}
                          {orcamento.contato && (
                            <Badge variant="outline" className="text-xs">
                              <User className="h-3 w-3 mr-1" />
                              CRM
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {orcamento.cliente_telefone}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {orcamento.cidade || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          style={{ backgroundColor: statusConfig.color }}
                          className="text-white"
                        >
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-emerald-600">
                        {formatCurrency(valor)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(orcamento.updated_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onVerOrcamento && (
                              <DropdownMenuItem onClick={() => onVerOrcamento(orcamento.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Orçamento
                              </DropdownMenuItem>
                            )}
                            {orcamento.contato_id && onVerContato && (
                              <DropdownMenuItem onClick={() => onVerContato(orcamento.contato_id!)}>
                                <User className="mr-2 h-4 w-4" />
                                Ver Contato
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* VISÃO GRÁFICO */}
        {viewType === 'grafico' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-4">Quantidade por Status</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="quantidade" name="Qtd">
                      {dadosGrafico.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-4">Valor por Status</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" fontSize={12} />
                    <YAxis 
                      fontSize={12} 
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="valor" name="Valor">
                      {dadosGrafico.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* VISÃO RESUMO */}
        {viewType === 'resumo' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATUS_PIPELINE_VISIVEL.map((status) => {
              const itens = orcamentosPorStatus[status.id] || [];
              const valorTotal = itens.reduce((sum, o) => sum + (o.total_com_desconto || o.total_geral || 0), 0);
              
              return (
                <Card key={status.id} className="overflow-hidden">
                  <div className={cn("h-2", status.bgClass)} />
                  <CardContent className="pt-4">
                    <h4 className="font-medium text-sm">{status.label}</h4>
                    <div className="mt-2 space-y-1">
                      <p className="text-2xl font-bold">{itens.length}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(valorTotal)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Dialog para condições de pagamento ao mover para status de pagamento */}
      <DialogCondicoesPagamento
        open={dialogPagamentoOpen}
        onOpenChange={setDialogPagamentoOpen}
        orcamento={orcamentoParaPagamento ? {
          id: orcamentoParaPagamento.id,
          codigo: orcamentoParaPagamento.codigo,
          cliente_nome: orcamentoParaPagamento.cliente_nome,
          cliente_telefone: orcamentoParaPagamento.cliente_telefone,
          total_geral: orcamentoParaPagamento.total_geral || 0,
          total_com_desconto: orcamentoParaPagamento.total_com_desconto
        } : null}
        novoStatus={novoStatusPendente}
        onSuccess={handleDialogPagamentoSuccess}
      />
    </Card>
  );
}