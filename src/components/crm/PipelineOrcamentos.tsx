import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
  MapPin
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
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

type ViewType = 'kanban' | 'lista' | 'grafico' | 'resumo';

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
  contato?: {
    id: string;
    nome: string;
    telefone: string | null;
    cidade: string | null;
  } | null;
}

// Usar apenas status mais relevantes no pipeline
const STATUS_PIPELINE_VISIVEL = STATUS_PIPELINE_CONFIG.filter(s => 
  ['rascunho', 'finalizado', 'enviado', 'sem_resposta', 'pago_40', 'pago_60', 'pago', 'recusado'].includes(s.id)
);

interface PipelineOrcamentosProps {
  onVerOrcamento?: (orcamentoId: string) => void;
  onVerContato?: (contatoId: string) => void;
}

export function PipelineOrcamentos({ onVerOrcamento, onVerContato }: PipelineOrcamentosProps) {
  const [viewType, setViewType] = useState<ViewType>('kanban');
  const [draggedId, setDraggedId] = useState<string | null>(null);

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
          contato:contatos(id, nome, telefone, cidade)
        `)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as OrcamentoPipeline[];
    }
  });

  // Agrupar orçamentos por status
  const orcamentosPorStatus = useMemo(() => {
    if (!orcamentos) return {};
    return STATUS_PIPELINE_VISIVEL.reduce((acc, status) => {
      acc[status.id] = orcamentos.filter(o => o.status === status.id);
      return acc;
    }, {} as Record<string, OrcamentoPipeline[]>);
  }, [orcamentos]);

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
    if (draggedId) {
      const { error } = await supabase
        .from('orcamentos')
        .update({ status: novoStatus })
        .eq('id', draggedId);
      
      if (!error) {
        refetch();
      }
    }
    setDraggedId(null);
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

  // Totais
  const totalPipeline = orcamentos?.reduce((sum, o) => sum + (o.total_com_desconto || o.total_geral || 0), 0) || 0;
  const totalOrcamentos = orcamentos?.length || 0;

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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Pipeline de Orçamentos
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {totalOrcamentos} orçamentos • {formatCurrency(totalPipeline)} no pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button 
              variant={viewType === 'kanban' ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setViewType('kanban')}
              title="Kanban"
            >
              <Kanban className="h-4 w-4" />
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
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* VISÃO KANBAN */}
        {viewType === 'kanban' && (
          <ScrollArea className="w-full">
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
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
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
    </Card>
  );
}