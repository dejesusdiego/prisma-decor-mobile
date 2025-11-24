import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, GripVertical } from 'lucide-react';
import { CortinaCard } from './CortinaCard';
import { PersianaCard } from './PersianaCard';
import { OutrosCard } from './OutrosCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Cortina } from '@/types/orcamento';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface EtapaProdutosProps {
  orcamentoId: string;
  produtosIniciais: Cortina[];
  onAvancar: (produtos: Cortina[]) => void;
  onVoltar: () => void;
}

interface SortableProductItemProps {
  id: string;
  produto: Cortina;
  index: number;
  orcamentoId: string;
  onUpdate: (index: number, produto: Cortina) => void;
  onRemove: (index: number) => void;
  onDuplicate: (index: number) => void;
}

function SortableProductItem({
  id,
  produto,
  index,
  orcamentoId,
  onUpdate,
  onRemove,
  onDuplicate,
}: SortableProductItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="pl-8">
        {produto.tipoProduto === 'cortina' ? (
          <CortinaCard
            cortina={produto}
            orcamentoId={orcamentoId}
            onUpdate={(p) => onUpdate(index, p)}
            onRemove={() => onRemove(index)}
            onDuplicate={() => onDuplicate(index)}
          />
        ) : produto.tipoProduto === 'persiana' ? (
          <PersianaCard
            persiana={produto}
            orcamentoId={orcamentoId}
            onUpdate={(p) => onUpdate(index, p)}
            onRemove={() => onRemove(index)}
          />
        ) : (
          <OutrosCard
            outro={produto}
            orcamentoId={orcamentoId}
            onUpdate={(p) => onUpdate(index, p)}
            onRemove={() => onRemove(index)}
            onDuplicate={() => onDuplicate(index)}
          />
        )}
      </div>
    </div>
  );
}

export function EtapaProdutos({
  orcamentoId,
  produtosIniciais,
  onAvancar,
  onVoltar,
}: EtapaProdutosProps) {
  const [produtos, setProdutos] = useState<Cortina[]>(produtosIniciais);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (orcamentoId && produtosIniciais.length === 0) {
      carregarProdutos();
    }
  }, [orcamentoId]);

  const carregarProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('cortina_items')
        .select('*')
        .eq('orcamento_id', orcamentoId);

      if (error) throw error;

      if (data && data.length > 0) {
        const produtosCarregados: Cortina[] = data.map((item) => ({
          id: item.id,
          nomeIdentificacao: item.nome_identificacao,
          largura: Number(item.largura),
          altura: Number(item.altura),
          quantidade: item.quantidade,
          tipoProduto: (item.tipo_produto as 'cortina' | 'persiana') || 'cortina',
          tipoCortina: item.tipo_cortina as any,
          tecidoId: item.tecido_id || undefined,
          forroId: item.forro_id || undefined,
          trilhoId: item.trilho_id || undefined,
          materialPrincipalId: item.material_principal_id || undefined,
          precisaInstalacao: item.precisa_instalacao,
          pontosInstalacao: item.pontos_instalacao || undefined,
        }));
        setProdutos(produtosCarregados);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const adicionarCortina = () => {
    const novaCortina: Cortina = {
      nomeIdentificacao: `Cortina ${produtos.filter(p => p.tipoProduto === 'cortina').length + 1}`,
      largura: 0,
      altura: 0,
      quantidade: 1,
      tipoProduto: 'cortina',
      tipoCortina: 'wave',
      tecidoId: '',
      trilhoId: '',
      precisaInstalacao: false,
    };
    setProdutos([...produtos, novaCortina]);
  };

  const adicionarPersiana = () => {
    const novaPersiana: Cortina = {
      nomeIdentificacao: `Persiana ${produtos.filter(p => p.tipoProduto === 'persiana').length + 1}`,
      largura: 0,
      altura: 0,
      quantidade: 1,
      tipoProduto: 'persiana',
      tipoCortina: 'horizontal',
      precisaInstalacao: false,
    };
    setProdutos([...produtos, novaPersiana]);
  };

  const adicionarOutro = () => {
    const novoOutro: Cortina = {
      nomeIdentificacao: `Outro ${produtos.filter(p => p.tipoProduto === 'outro').length + 1}`,
      largura: 0,
      altura: 0,
      quantidade: 1,
      tipoProduto: 'outro',
      tipoCortina: 'outro',
      precoUnitario: undefined,
      precisaInstalacao: false,
    };
    setProdutos([...produtos, novoOutro]);
  };

  const removerProduto = async (index: number) => {
    const produto = produtos[index];
    
    if (produto.id) {
      try {
        const { error } = await supabase
          .from('cortina_items')
          .delete()
          .eq('id', produto.id);

        if (error) throw error;
      } catch (error) {
        console.error('Erro ao remover produto:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível remover o produto',
          variant: 'destructive',
        });
        return;
      }
    }

    const novosProdutos = produtos.filter((_, i) => i !== index);
    setProdutos(novosProdutos);
  };

  const duplicarProduto = (index: number) => {
    const produto = { ...produtos[index] };
    delete produto.id;
    produto.nomeIdentificacao = `${produto.nomeIdentificacao} (Cópia)`;
    setProdutos([...produtos, produto]);
  };

  const atualizarProduto = (index: number, produto: Cortina) => {
    const novosProdutos = [...produtos];
    novosProdutos[index] = produto;
    setProdutos(novosProdutos);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setProdutos((items) => {
        const oldIndex = items.findIndex((item, idx) => 
          (item.id || `temp-${idx}`) === active.id
        );
        const newIndex = items.findIndex((item, idx) => 
          (item.id || `temp-${idx}`) === over.id
        );

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAvancar = async () => {
    if (produtos.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Adicione pelo menos um produto antes de avançar',
        variant: 'destructive',
      });
      return;
    }

    // Validar campos obrigatórios
    const produtosInvalidos = produtos.filter((p) => {
      if (!p.nomeIdentificacao || p.largura <= 0 || p.altura <= 0 || p.quantidade <= 0) {
        return true;
      }
      if (p.tipoProduto === 'cortina') {
        return !p.tecidoId || !p.trilhoId;
      }
      if (p.tipoProduto === 'persiana') {
        return !p.materialPrincipalId;
      }
      if (p.tipoProduto === 'outro') {
        return !p.precoUnitario || p.precoUnitario <= 0;
      }
      return false;
    });

    if (produtosInvalidos.length > 0) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios (*) de todos os produtos antes de avançar',
        variant: 'destructive',
      });
      return;
    }

    // Verificar se todos os produtos foram salvos
    const produtosNaoSalvos = produtos.filter((p) => !p.id);
    if (produtosNaoSalvos.length > 0) {
      toast({
        title: 'Produtos não salvos',
        description: 'Salve todos os produtos antes de avançar',
        variant: 'destructive',
      });
      return;
    }

    onAvancar(produtos);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Etapa 2 - Produtos</h2>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={adicionarCortina}
          >
            <Plus className="mr-2 h-4 w-4" />
            Cortina
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={adicionarPersiana}
          >
            <Plus className="mr-2 h-4 w-4" />
            Persiana
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={adicionarOutro}
          >
            <Plus className="mr-2 h-4 w-4" />
            Outros
          </Button>
        </div>
      </div>

      {produtos.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p>Nenhum produto adicionado ainda.</p>
          <p className="text-sm mt-2">Clique em "Adicionar Cortina" ou "Adicionar Persiana" para começar.</p>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={produtos.map((p, idx) => p.id || `temp-${idx}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {produtos.map((produto, index) => (
                <SortableProductItem
                  key={produto.id || `temp-${index}`}
                  id={produto.id || `temp-${index}`}
                  produto={produto}
                  index={index}
                  orcamentoId={orcamentoId}
                  onUpdate={atualizarProduto}
                  onRemove={removerProduto}
                  onDuplicate={duplicarProduto}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onVoltar}>
          Voltar
        </Button>
        <Button type="button" onClick={handleAvancar} disabled={loading} className="flex-1">
          Avançar para Resumo
        </Button>
      </div>
    </div>
  );
}
