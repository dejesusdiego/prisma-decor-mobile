import { useState } from 'react';
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
  Clock
} from 'lucide-react';
import { useProducaoData, STATUS_ITEM_LABELS, PRIORIDADE_LABELS, ItemPedido, Pedido } from '@/hooks/useProducaoData';
import { TipBanner } from '@/components/ui/TipBanner';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { cn } from '@/lib/utils';

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
  const { pedidos, isLoading, atualizarStatusItem, isUpdating } = useProducaoData();
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todas');

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

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((column, colIndex) => {
          const items = getItemsByStatus(column.id);
          const ColIcon = column.icon;
          
          return (
            <div 
              key={column.id}
              className="min-w-[300px] flex flex-col"
            >
              <Card className="flex-1">
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
                      Nenhum item
                    </p>
                  ) : (
                    items.map(item => {
                      const prioridadeInfo = PRIORIDADE_LABELS[item.pedidoInfo.prioridade];
                      const prevCol = KANBAN_COLUMNS[colIndex - 1];
                      const nextCol = KANBAN_COLUMNS[colIndex + 1];
                      
                      return (
                        <div 
                          key={item.id}
                          className={cn(
                            "p-3 rounded-lg border bg-card hover:shadow-md transition-all",
                            item.pedidoInfo.prioridade === 'urgente' && "border-red-500/50 bg-red-500/5",
                            item.pedidoInfo.prioridade === 'alta' && "border-orange-500/50 bg-orange-500/5"
                          )}
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2 mb-2">
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
                              onClick={() => prevCol && handleMoveItem(item.id, prevCol.id)}
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
                              onClick={() => nextCol && handleMoveItem(item.id, nextCol.id)}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

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
