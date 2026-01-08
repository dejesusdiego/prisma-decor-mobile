import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Package, CheckCircle2, Clock, Boxes } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MaterialPedido {
  id: string;
  pedido_id: string;
  material_id: string;
  nome_material: string;
  categoria: string;
  quantidade_necessaria: number;
  unidade: string;
  recebido: boolean;
  data_recebimento: string | null;
  observacoes: string | null;
}

interface ListaMateriaisPedidoProps {
  pedidoId: string;
  statusPedido: string;
}

const CATEGORIA_COLORS: Record<string, string> = {
  'Tecido': 'bg-blue-500',
  'Forro': 'bg-purple-500',
  'Trilho': 'bg-amber-500',
  'Persiana': 'bg-green-500',
  'Acessorio': 'bg-gray-500',
};

export function ListaMateriaisPedido({ pedidoId, statusPedido }: ListaMateriaisPedidoProps) {
  const { user } = useAuth();
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();

  const { data: materiais, isLoading } = useQuery({
    queryKey: ['materiais-pedido', pedidoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materiais_pedido')
        .select('*')
        .eq('pedido_id', pedidoId)
        .order('categoria', { ascending: true });
      
      if (error) throw error;
      return data as MaterialPedido[];
    },
    enabled: !!pedidoId,
  });

  const marcarRecebidoMutation = useMutation({
    mutationFn: async ({ materialId, recebido }: { materialId: string; recebido: boolean }) => {
      const { error } = await supabase
        .from('materiais_pedido')
        .update({ 
          recebido,
          data_recebimento: recebido ? new Date().toISOString() : null,
          recebido_por: recebido ? user?.id : null
        })
        .eq('id', materialId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais-pedido', pedidoId] });
      queryClient.invalidateQueries({ queryKey: ['pedidos', organizationId] });
      toast.success('Material atualizado');
    },
    onError: () => {
      toast.error('Erro ao atualizar material');
    },
  });

  const marcarTodosMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('materiais_pedido')
        .update({ 
          recebido: true,
          data_recebimento: new Date().toISOString(),
          recebido_por: user?.id
        })
        .eq('pedido_id', pedidoId)
        .eq('recebido', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais-pedido', pedidoId] });
      queryClient.invalidateQueries({ queryKey: ['pedidos', organizationId] });
      toast.success('Todos materiais marcados como recebidos');
    },
    onError: () => {
      toast.error('Erro ao atualizar materiais');
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!materiais || materiais.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Boxes className="h-5 w-5" />
            Lista de Materiais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Nenhum material registrado para este pedido
          </p>
        </CardContent>
      </Card>
    );
  }

  const recebidos = materiais.filter(m => m.recebido).length;
  const total = materiais.length;
  const progresso = total > 0 ? (recebidos / total) * 100 : 0;
  const todosRecebidos = recebidos === total;

  // Agrupar por categoria
  const porCategoria = materiais.reduce((acc, mat) => {
    if (!acc[mat.categoria]) acc[mat.categoria] = [];
    acc[mat.categoria].push(mat);
    return acc;
  }, {} as Record<string, MaterialPedido[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Boxes className="h-5 w-5" />
            Lista de Materiais
            <Badge variant="secondary">{recebidos} / {total}</Badge>
          </CardTitle>
          {!todosRecebidos && statusPedido === 'aguardando_materiais' && (
            <Button 
              size="sm" 
              onClick={() => marcarTodosMutation.mutate()}
              disabled={marcarTodosMutation.isPending}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Marcar Todos
            </Button>
          )}
        </div>
        
        <div className="mt-2">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Progresso de recebimento</span>
            <span className="font-medium">{Math.round(progresso)}%</span>
          </div>
          <Progress value={progresso} className="h-2" />
        </div>

        {todosRecebidos && (
          <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Todos os materiais foram recebidos!
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {Object.entries(porCategoria).map(([categoria, items]) => (
          <div key={categoria}>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("w-3 h-3 rounded-full", CATEGORIA_COLORS[categoria] || 'bg-gray-400')} />
              <h4 className="font-medium text-sm">{categoria}</h4>
              <Badge variant="outline" className="text-xs">
                {items.filter(i => i.recebido).length}/{items.length}
              </Badge>
            </div>
            
            <div className="space-y-2 ml-5">
              {items.map(material => (
                <div 
                  key={material.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors",
                    material.recebido ? "bg-green-50 border-green-200" : "bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={material.recebido}
                      onCheckedChange={(checked) => 
                        marcarRecebidoMutation.mutate({ 
                          materialId: material.id, 
                          recebido: !!checked 
                        })
                      }
                      disabled={marcarRecebidoMutation.isPending}
                    />
                    <div>
                      <p className={cn(
                        "font-medium text-sm",
                        material.recebido && "line-through text-muted-foreground"
                      )}>
                        {material.nome_material}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {material.quantidade_necessaria} {material.unidade}
                      </p>
                    </div>
                  </div>
                  
                  {material.recebido ? (
                    <Badge variant="secondary" className="text-green-700 bg-green-100">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Recebido
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-700">
                      <Clock className="h-3 w-3 mr-1" />
                      Pendente
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
