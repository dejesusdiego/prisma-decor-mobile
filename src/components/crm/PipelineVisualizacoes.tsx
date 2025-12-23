import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Kanban, 
  List, 
  BarChart3, 
  Calendar,
  Flame,
  Thermometer,
  Snowflake,
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus
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
import { useOportunidades, useDeleteOportunidade, Oportunidade } from '@/hooks/useCRMData';
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

const formatCurrency = (value: number | null) => {
  if (!value) return 'R$ 0';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const ETAPAS = [
  { id: 'prospeccao', label: 'Prospecção', color: '#3b82f6' },
  { id: 'qualificacao', label: 'Qualificação', color: '#8b5cf6' },
  { id: 'proposta', label: 'Proposta', color: '#f59e0b' },
  { id: 'negociacao', label: 'Negociação', color: '#f97316' },
  { id: 'fechado_ganho', label: 'Ganho ✓', color: '#22c55e' },
  { id: 'fechado_perdido', label: 'Perdido ✗', color: '#ef4444' }
];

const TEMPERATURA_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  quente: { icon: Flame, color: 'text-red-500', label: 'Quente' },
  morno: { icon: Thermometer, color: 'text-amber-500', label: 'Morno' },
  frio: { icon: Snowflake, color: 'text-blue-500', label: 'Frio' }
};

type ViewType = 'lista' | 'grafico' | 'resumo';

export function PipelineVisualizacoes() {
  const { data: oportunidades, isLoading } = useOportunidades();
  const deleteOportunidade = useDeleteOportunidade();
  
  const [viewType, setViewType] = useState<ViewType>('lista');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [oportunidadeSelecionada, setOportunidadeSelecionada] = useState<Oportunidade | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [oportunidadeParaExcluir, setOportunidadeParaExcluir] = useState<Oportunidade | null>(null);

  const handleEditarOportunidade = (oportunidade: Oportunidade) => {
    setOportunidadeSelecionada(oportunidade);
    setDialogOpen(true);
  };

  const handleNovaOportunidade = () => {
    setOportunidadeSelecionada(null);
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
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Dados para gráfico
  const dadosGrafico = ETAPAS.map(etapa => {
    const ops = oportunidades?.filter(o => o.etapa === etapa.id) || [];
    return {
      etapa: etapa.label,
      quantidade: ops.length,
      valor: ops.reduce((sum, o) => sum + (o.valor_estimado || 0), 0),
      color: etapa.color
    };
  });

  // Dados para resumo
  const resumoPorEtapa = ETAPAS.map(etapa => {
    const ops = oportunidades?.filter(o => o.etapa === etapa.id) || [];
    const valorTotal = ops.reduce((sum, o) => sum + (o.valor_estimado || 0), 0);
    const quentes = ops.filter(o => o.temperatura === 'quente').length;
    const mornos = ops.filter(o => o.temperatura === 'morno').length;
    const frios = ops.filter(o => o.temperatura === 'frio').length;
    return { ...etapa, quantidade: ops.length, valorTotal, quentes, mornos, frios };
  });

  const getEtapaLabel = (etapaId: string) => ETAPAS.find(e => e.id === etapaId)?.label || etapaId;
  const getEtapaColor = (etapaId: string) => ETAPAS.find(e => e.id === etapaId)?.color || '#6b7280';

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Kanban className="h-5 w-5" />
            Pipeline - Visualizações
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg p-1">
              <Button 
                variant={viewType === 'lista' ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => setViewType('lista')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewType === 'grafico' ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => setViewType('grafico')}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewType === 'resumo' ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => setViewType('resumo')}
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleNovaOportunidade} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* VISÃO LISTA */}
          {viewType === 'lista' && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Oportunidade</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Temperatura</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Previsão</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {oportunidades?.map((oportunidade) => {
                    const temp = TEMPERATURA_CONFIG[oportunidade.temperatura || 'morno'];
                    const TempIcon = temp?.icon || Thermometer;
                    
                    return (
                      <TableRow key={oportunidade.id}>
                        <TableCell className="font-medium">
                          {oportunidade.titulo}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {oportunidade.contato?.nome || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            style={{ backgroundColor: getEtapaColor(oportunidade.etapa) }}
                            className="text-white"
                          >
                            {getEtapaLabel(oportunidade.etapa)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <TempIcon className={cn("h-4 w-4", temp?.color)} />
                            <span className="text-sm">{temp?.label}</span>
                          </div>
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
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
