import { useState } from 'react';
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
  Plus, 
  Target,
  Flame,
  Thermometer,
  Snowflake,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
  List,
  BarChart3,
  Kanban,
  LayoutGrid,
  FileText,
  DollarSign
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useOportunidades, useUpdateOportunidade, useDeleteOportunidade, Oportunidade } from '@/hooks/useCRMData';
import { DialogOportunidade } from './DialogOportunidade';
import { format } from 'date-fns';
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
  ETAPAS_CONFIG, 
  TEMPERATURA_CONFIG, 
  formatCurrency,
  getOrigemConfig 
} from '@/lib/mapearStatusEtapa';

type ViewType = 'kanban' | 'lista' | 'grafico' | 'resumo';

const TEMPERATURA_ICONS = {
  quente: Flame,
  morno: Thermometer,
  frio: Snowflake,
};

interface PipelineUnificadoProps {
  onVerOrcamento?: (orcamentoId: string) => void;
}

export function PipelineUnificado({ onVerOrcamento }: PipelineUnificadoProps) {
  const { data: oportunidades, isLoading } = useOportunidades();
  const updateOportunidade = useUpdateOportunidade();
  const deleteOportunidade = useDeleteOportunidade();
  
  const [viewType, setViewType] = useState<ViewType>('kanban');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [oportunidadeSelecionada, setOportunidadeSelecionada] = useState<Oportunidade | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [oportunidadeParaExcluir, setOportunidadeParaExcluir] = useState<Oportunidade | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, oportunidadeId: string) => {
    setDraggedId(oportunidadeId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, etapaId: string) => {
    e.preventDefault();
    if (draggedId) {
      await updateOportunidade.mutateAsync({
        id: draggedId,
        etapa: etapaId
      });
    }
    setDraggedId(null);
  };

  const handleNovaOportunidade = () => {
    setOportunidadeSelecionada(null);
    setDialogOpen(true);
  };

  const handleEditarOportunidade = (oportunidade: Oportunidade) => {
    setOportunidadeSelecionada(oportunidade);
    setDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (oportunidadeParaExcluir) {
      await deleteOportunidade.mutateAsync(oportunidadeParaExcluir.id);
      setDeleteDialogOpen(false);
      setOportunidadeParaExcluir(null);
    }
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

  const oportunidadesPorEtapa = ETAPAS_CONFIG.reduce((acc, etapa) => {
    acc[etapa.id] = oportunidades?.filter(o => o.etapa === etapa.id) || [];
    return acc;
  }, {} as Record<string, Oportunidade[]>);

  // Dados para gráfico
  const dadosGrafico = ETAPAS_CONFIG.map(etapa => {
    const ops = oportunidadesPorEtapa[etapa.id] || [];
    return {
      etapa: etapa.label,
      quantidade: ops.length,
      valor: ops.reduce((sum, o) => sum + (o.valor_estimado || 0), 0),
      color: etapa.color
    };
  });

  // Dados para resumo
  const resumoPorEtapa = ETAPAS_CONFIG.map(etapa => {
    const ops = oportunidadesPorEtapa[etapa.id] || [];
    const valorTotal = ops.reduce((sum, o) => sum + (o.valor_estimado || 0), 0);
    const quentes = ops.filter(o => o.temperatura === 'quente').length;
    const mornos = ops.filter(o => o.temperatura === 'morno').length;
    const frios = ops.filter(o => o.temperatura === 'frio').length;
    return { ...etapa, quantidade: ops.length, valorTotal, quentes, mornos, frios };
  });

  const renderOportunidadeCard = (oportunidade: Oportunidade, draggable = false) => {
    const temp = TEMPERATURA_CONFIG[oportunidade.temperatura as keyof typeof TEMPERATURA_CONFIG] || TEMPERATURA_CONFIG.morno;
    const TempIcon = TEMPERATURA_ICONS[oportunidade.temperatura as keyof typeof TEMPERATURA_ICONS] || Thermometer;
    const origemConfig = getOrigemConfig(oportunidade.origem);
    
    return (
      <div
        key={oportunidade.id}
        draggable={draggable}
        onDragStart={draggable ? (e) => handleDragStart(e, oportunidade.id) : undefined}
        className={cn(
          "bg-card rounded-lg border p-3 shadow-sm hover:shadow transition-shadow",
          draggable && "cursor-grab active:cursor-grabbing",
          draggedId === oportunidade.id && "opacity-50"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {draggable && <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />}
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">
                {oportunidade.titulo}
              </p>
              {oportunidade.contato && (
                <p className="text-xs text-muted-foreground truncate">
                  {oportunidade.contato.nome}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditarOportunidade(oportunidade)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              {oportunidade.orcamento_id && onVerOrcamento && (
                <DropdownMenuItem onClick={() => onVerOrcamento(oportunidade.orcamento_id!)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Ver Orçamento
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => {
                  setOportunidadeParaExcluir(oportunidade);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Origem e indicadores */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {oportunidade.origem && (
            <Badge variant="outline" className={cn("text-xs", origemConfig.color)}>
              {origemConfig.label}
            </Badge>
          )}
          {oportunidade.orcamento_id && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
              <FileText className="h-3 w-3 mr-1" />
              Orçamento
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm font-medium flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {formatCurrency(oportunidade.valor_estimado)}
          </span>
          <div className="flex items-center gap-2">
            {oportunidade.data_previsao_fechamento && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(oportunidade.data_previsao_fechamento), 'dd/MM', { locale: ptBR })}
              </span>
            )}
            <TempIcon className={cn("h-4 w-4", temp.color)} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Pipeline de Vendas
          </CardTitle>
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
            <Button onClick={handleNovaOportunidade} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Oportunidade
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* VISÃO KANBAN */}
          {viewType === 'kanban' && (
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
                {ETAPAS_CONFIG.map((etapa) => {
                  const itens = oportunidadesPorEtapa[etapa.id] || [];
                  const valorTotal = itens.reduce((sum, o) => sum + (o.valor_estimado || 0), 0);
                  
                  return (
                    <div
                      key={etapa.id}
                      className="w-72 shrink-0"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, etapa.id)}
                    >
                      {/* Header da coluna */}
                      <div className={cn(
                        "rounded-t-lg px-3 py-2 text-white font-medium flex items-center justify-between",
                        etapa.bgClass
                      )}>
                        <span>{etapa.label}</span>
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
                            Arraste oportunidades aqui
                          </p>
                        ) : (
                          itens.map((oportunidade) => renderOportunidadeCard(oportunidade, true))
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
                    <TableHead>Oportunidade</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Temp.</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Previsão</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {oportunidades?.map((oportunidade) => {
                    const temp = TEMPERATURA_CONFIG[oportunidade.temperatura as keyof typeof TEMPERATURA_CONFIG] || TEMPERATURA_CONFIG.morno;
                    const TempIcon = TEMPERATURA_ICONS[oportunidade.temperatura as keyof typeof TEMPERATURA_ICONS] || Thermometer;
                    const etapaConfig = ETAPAS_CONFIG.find(e => e.id === oportunidade.etapa);
                    const origemConfig = getOrigemConfig(oportunidade.origem);
                    
                    return (
                      <TableRow key={oportunidade.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{oportunidade.titulo}</span>
                            {oportunidade.orcamento_id && (
                              <FileText className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {oportunidade.contato?.nome || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            style={{ backgroundColor: etapaConfig?.color }}
                            className="text-white"
                          >
                            {etapaConfig?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <TempIcon className={cn("h-4 w-4", temp.color)} />
                          </div>
                        </TableCell>
                        <TableCell>
                          {oportunidade.origem && (
                            <Badge variant="outline" className={cn("text-xs", origemConfig.color)}>
                              {origemConfig.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(oportunidade.valor_estimado)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {oportunidade.data_previsao_fechamento
                            ? format(new Date(oportunidade.data_previsao_fechamento), 'dd/MM/yyyy', { locale: ptBR })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditarOportunidade(oportunidade)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              {oportunidade.orcamento_id && onVerOrcamento && (
                                <DropdownMenuItem onClick={() => onVerOrcamento(oportunidade.orcamento_id!)}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Ver Orçamento
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  setOportunidadeParaExcluir(oportunidade);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!oportunidades || oportunidades.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhuma oportunidade cadastrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* VISÃO GRÁFICO */}
          {viewType === 'grafico' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-4">Quantidade por Etapa</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dadosGrafico}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="etapa" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="quantidade" name="Quantidade" radius={[4, 4, 0, 0]}>
                        {dadosGrafico.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-4">Valor por Etapa</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dadosGrafico}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="etapa" tick={{ fontSize: 11 }} />
                      <YAxis 
                        tick={{ fontSize: 11 }} 
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Bar dataKey="valor" name="Valor" radius={[4, 4, 0, 0]}>
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

          {/* VISÃO RESUMO/CARDS */}
          {viewType === 'resumo' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {resumoPorEtapa.map((etapa) => (
                <Card key={etapa.id} className="border-t-4" style={{ borderTopColor: etapa.color }}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{etapa.label}</h4>
                      <Badge variant="secondary">{etapa.quantidade}</Badge>
                    </div>
                    <p className="text-lg font-bold mb-3">{formatCurrency(etapa.valorTotal)}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-red-500" />
                        {etapa.quentes}
                      </div>
                      <div className="flex items-center gap-1">
                        <Thermometer className="h-3 w-3 text-amber-500" />
                        {etapa.mornos}
                      </div>
                      <div className="flex items-center gap-1">
                        <Snowflake className="h-3 w-3 text-blue-500" />
                        {etapa.frios}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DialogOportunidade 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        oportunidade={oportunidadeSelecionada}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir oportunidade?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a oportunidade "{oportunidadeParaExcluir?.titulo}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
