import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
  Calendar
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
  { id: 'prospeccao', label: 'Prospecção', color: 'bg-blue-500' },
  { id: 'qualificacao', label: 'Qualificação', color: 'bg-purple-500' },
  { id: 'proposta', label: 'Proposta', color: 'bg-amber-500' },
  { id: 'negociacao', label: 'Negociação', color: 'bg-orange-500' },
  { id: 'fechado_ganho', label: 'Ganho ✓', color: 'bg-emerald-500' },
  { id: 'fechado_perdido', label: 'Perdido ✗', color: 'bg-red-500' }
];

const TEMPERATURA_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  quente: { icon: Flame, color: 'text-red-500' },
  morno: { icon: Thermometer, color: 'text-amber-500' },
  frio: { icon: Snowflake, color: 'text-blue-500' }
};

export function KanbanOportunidades() {
  const { data: oportunidades, isLoading } = useOportunidades();
  const updateOportunidade = useUpdateOportunidade();
  const deleteOportunidade = useDeleteOportunidade();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [oportunidadeSelecionada, setOportunidadeSelecionada] = useState<Oportunidade | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [oportunidadeParaExcluir, setOportunidadeParaExcluir] = useState<Oportunidade | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

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

  const oportunidadesPorEtapa = ETAPAS.reduce((acc, etapa) => {
    acc[etapa.id] = oportunidades?.filter(o => o.etapa === etapa.id) || [];
    return acc;
  }, {} as Record<string, typeof oportunidades>);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Pipeline de Oportunidades
          </CardTitle>
          <Button onClick={handleNovaOportunidade} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Oportunidade
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
              {ETAPAS.map((etapa) => {
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
                      etapa.color
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
                        itens.map((oportunidade) => {
                          const temp = TEMPERATURA_ICONS[oportunidade.temperatura || 'morno'];
                          const TempIcon = temp?.icon || Thermometer;
                          
                          return (
                            <div
                              key={oportunidade.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, oportunidade.id)}
                              className={cn(
                                "bg-card rounded-lg border p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow transition-shadow",
                                draggedId === oportunidade.id && "opacity-50"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
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
                              
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-sm font-medium">
                                  {formatCurrency(oportunidade.valor_estimado)}
                                </span>
                                <div className="flex items-center gap-2">
                                  {oportunidade.data_previsao_fechamento && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {format(new Date(oportunidade.data_previsao_fechamento), 'dd/MM', { locale: ptBR })}
                                    </span>
                                  )}
                                  <TempIcon className={cn("h-4 w-4", temp?.color)} />
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
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
