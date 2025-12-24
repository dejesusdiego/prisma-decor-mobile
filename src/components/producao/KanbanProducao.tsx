import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ChevronRight,
  ChevronLeft,
  Package,
  Scissors,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  User,
  GripVertical
} from 'lucide-react';
import { useProducaoData, STATUS_ITEM_LABELS, PRIORIDADE_LABELS, ItemPedido, Pedido } from '@/hooks/useProducaoData';
import { TipBanner } from '@/components/ui/TipBanner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
const KANBAN_COLUMNS = [
  { id: 'fila', label: 'Na Fila', icon: Package, color: 'bg-gray-500' },
  { id: 'corte', label: 'Corte', icon: Scissors, color: 'bg-orange-500' },
  { id: 'costura', label: 'Costura', icon: Layers, color: 'bg-blue-500' },
  { id: 'acabamento', label: 'Acabamento', icon: Sparkles, color: 'bg-indigo-500' },
  { id: 'qualidade', label: 'Qualidade', icon: Search, color: 'bg-purple-500' },
  { id: 'pronto', label: 'Pronto', icon: CheckCircle2, color: 'bg-green-500' },
];

interface ItemWithPedido extends ItemPedido {
  pedidoInfo: Pedido;
}

export function KanbanProducao() {
  const { pedidos, isLoading, atualizarStatusItem, isUpdating, refetch } = useProducaoData();
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todas');

  // Real-time subscription for item status changes
  useEffect(() => {
    const channel = supabase
      .channel('kanban-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'itens_pedido',
        },
        (payload) => {
          const oldStatus = payload.old?.status_item;
          const newStatus = payload.new?.status_item;
          
          if (oldStatus && newStatus && oldStatus !== newStatus) {
            const oldLabel = STATUS_ITEM_LABELS[oldStatus] || oldStatus;
            const newLabel = STATUS_ITEM_LABELS[newStatus] || newStatus;
            
            toast.success(`Item movido: ${oldLabel} → ${newLabel}`, {
              description: 'O quadro foi atualizado automaticamente',
              duration: 3000,
            });
            
            // Refresh data
            refetch();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Flatten items from all pedidos
  const allItems: ItemWithPedido[] = pedidos
    .filter(p => !['entregue', 'cancelado'].includes(p.status_producao))
    .filter(p => filtroPrioridade === 'todas' || p.prioridade === filtroPrioridade)
    .flatMap(pedido => 
      (pedido.itens_pedido || []).map(item => ({
        ...item,
        pedidoInfo: pedido
      }))
    );

  const getItemsByStatus = (status: string) => 
    allItems.filter(item => item.status_item === status);

  const handleMoveItem = (itemId: string, novoStatus: string) => {
    atualizarStatusItem({ itemId, novoStatus });
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const itemId = active.id as string;
    const targetColumnId = over.id as string;

    // Find the item and check if it's moving to a different column
    const item = allItems.find(i => i.id === itemId);
    if (item && item.status_item !== targetColumnId && KANBAN_COLUMNS.some(c => c.id === targetColumnId)) {
      handleMoveItem(itemId, targetColumnId);
    }
  };

  const activeItem = activeId ? allItems.find(i => i.id === activeId) : null;

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map(col => (
          <Skeleton key={col.id} className="min-w-[280px] h-[500px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TipBanner
        id="kanban-producao-tip"
        title="Kanban de Produção"
        variant="info"
      >
        Arraste os itens entre colunas ou use as setas para mover. 
        Cada card representa um item de um pedido. O histórico de movimentação é registrado automaticamente.
      </TipBanner>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Prioridade:</span>
          <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="urgente">Urgente</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {allItems.length} item(s) em produção
        </div>
      </div>

      {/* Kanban Board with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((column, colIndex) => {
            const items = getItemsByStatus(column.id);
            const ColIcon = column.icon;
            
            return (
              <DroppableColumn key={column.id} id={column.id}>
                <Card className="flex-1 min-h-[400px]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", column.color)} />
                      <ColIcon className="h-4 w-4" />
                      {column.label}
                      <Badge variant="secondary" className="ml-auto">
                        {items.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {items.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Arraste itens aqui
                      </p>
                    ) : (
                      items.map(item => {
                        const prevCol = KANBAN_COLUMNS[colIndex - 1];
                        const nextCol = KANBAN_COLUMNS[colIndex + 1];
                        
                        return (
                          <DraggableCard 
                            key={item.id} 
                            item={item}
                            prevCol={prevCol}
                            nextCol={nextCol}
                            isUpdating={isUpdating}
                            onMove={handleMoveItem}
                          />
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </DroppableColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeItem && (
            <div className="p-3 rounded-lg border bg-card shadow-lg opacity-90 w-[280px]">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm truncate">
                  {activeItem.cortina_item?.nome_identificacao || 'Item'}
                </span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Legenda */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-6 flex-wrap text-sm">
            <span className="text-muted-foreground">Prioridades:</span>
            {Object.entries(PRIORIDADE_LABELS).map(([key, info]) => (
              <div key={key} className="flex items-center gap-1">
                <div className={cn("w-3 h-3 rounded-full", info.color)} />
                <span>{info.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Droppable Column Component
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  
  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "min-w-[300px] flex flex-col transition-all",
        isOver && "ring-2 ring-primary ring-offset-2 rounded-lg"
      )}
    >
      {children}
    </div>
  );
}

// Draggable Card Component
function DraggableCard({ 
  item, 
  prevCol, 
  nextCol, 
  isUpdating, 
  onMove 
}: { 
  item: ItemWithPedido;
  prevCol?: typeof KANBAN_COLUMNS[0];
  nextCol?: typeof KANBAN_COLUMNS[0];
  isUpdating: boolean;
  onMove: (itemId: string, novoStatus: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
  });

  const prioridadeInfo = PRIORIDADE_LABELS[item.pedidoInfo.prioridade];

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-3 rounded-lg border bg-card hover:shadow-md transition-all cursor-grab active:cursor-grabbing",
        item.pedidoInfo.prioridade === 'urgente' && "border-red-500/50 bg-red-500/5",
        item.pedidoInfo.prioridade === 'alta' && "border-orange-500/50 bg-orange-500/5",
        isDragging && "opacity-50 shadow-lg"
      )}
      {...attributes}
      {...listeners}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              {item.pedidoInfo.numero_pedido}
            </span>
            <Badge 
              variant="outline" 
              className={cn("text-[10px] h-4", prioridadeInfo.color, "text-white border-0")}
            >
              {prioridadeInfo.label}
            </Badge>
          </div>
          <p className="font-medium text-sm truncate">
            {item.cortina_item?.nome_identificacao || 'Item sem nome'}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="text-xs text-muted-foreground space-y-1 mb-3">
        <p>
          {item.cortina_item?.tipo_cortina} - {item.cortina_item?.tipo_produto}
        </p>
        <p>
          {item.cortina_item?.largura}m × {item.cortina_item?.altura}m
          {item.cortina_item?.quantidade && item.cortina_item.quantidade > 1 && (
            <span className="ml-1">(×{item.cortina_item.quantidade})</span>
          )}
        </p>
        <p className="truncate">
          <User className="h-3 w-3 inline mr-1" />
          {item.pedidoInfo.orcamento?.cliente_nome}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={!prevCol || isUpdating}
          onClick={(e) => {
            e.stopPropagation();
            prevCol && onMove(item.id, prevCol.id);
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {item.responsavel && (
          <span className="text-xs text-muted-foreground">
            {item.responsavel}
          </span>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={!nextCol || isUpdating}
          onClick={(e) => {
            e.stopPropagation();
            nextCol && onMove(item.id, nextCol.id);
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
