import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, GripVertical, Wrench, Wallpaper, Zap, Package, Loader2, AlertTriangle, RefreshCw, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CortinaCard } from './CortinaCard';
import { PersianaCard } from './PersianaCard';
import { OutrosCard } from './OutrosCard';
import { AcessoriosCard } from './AcessoriosCard';
import { PapelCard } from './PapelCard';
import { MotorizadoCard } from './MotorizadoCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Cortina, ServicoConfeccao } from '@/types/orcamento';
import { useMateriaisMultiplas } from '@/hooks/useMateriais';
import { useQuery } from '@tanstack/react-query';
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
  materiais: ReturnType<typeof useMateriaisMultiplas>['materiais'];
  loadingMateriais: boolean;
  servicosConfeccao: ServicoConfeccao[];
  onUpdate: (index: number, produto: Cortina) => void;
  onRemove: (index: number) => void;
  onDuplicate: (index: number) => void;
}

function SortableProductItem({
  id,
  produto,
  index,
  orcamentoId,
  materiais,
  loadingMateriais,
  servicosConfeccao,
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
            materiais={{
              tecidos: materiais.tecido,
              forros: materiais.forro,
              trilhos: materiais.trilho,
            }}
            loadingMateriais={loadingMateriais}
            servicosConfeccao={servicosConfeccao}
            onUpdate={(p) => onUpdate(index, p)}
            onRemove={() => onRemove(index)}
            onDuplicate={() => onDuplicate(index)}
          />
        ) : produto.tipoProduto === 'persiana' ? (
          <PersianaCard
            persiana={produto}
            orcamentoId={orcamentoId}
            materiais={materiais.persiana}
            loadingMateriais={loadingMateriais}
            onUpdate={(p) => onUpdate(index, p)}
            onRemove={() => onRemove(index)}
            onDuplicate={() => onDuplicate(index)}
          />
        ) : produto.descricao === 'Acessórios' ? (
          <AcessoriosCard
            acessorio={produto}
            orcamentoId={orcamentoId}
            materiais={materiais.acessorio}
            loadingMateriais={loadingMateriais}
            onUpdate={(p) => onUpdate(index, p)}
            onRemove={() => onRemove(index)}
            onDuplicate={() => onDuplicate(index)}
          />
        ) : produto.descricao === 'Papel' ? (
          <PapelCard
            papel={produto}
            orcamentoId={orcamentoId}
            materiais={materiais.papel}
            loadingMateriais={loadingMateriais}
            onUpdate={(p) => onUpdate(index, p)}
            onRemove={() => onRemove(index)}
            onDuplicate={() => onDuplicate(index)}
          />
        ) : produto.descricao === 'Motorizado' ? (
          <MotorizadoCard
            motorizado={produto}
            orcamentoId={orcamentoId}
            materiais={materiais.motorizado}
            loadingMateriais={loadingMateriais}
            onUpdate={(p) => onUpdate(index, p)}
            onRemove={() => onRemove(index)}
            onDuplicate={() => onDuplicate(index)}
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
  const [salvandoTodos, setSalvandoTodos] = useState(false);
  const [dialogOutrosAberto, setDialogOutrosAberto] = useState(false);

  // Centralizar carregamento de materiais - UMA vez para todos os cards
  const { materiais, loading: loadingMateriais, error: errorMateriais, refetchAll } = useMateriaisMultiplas();

  // Centralizar carregamento de serviços de confecção - UMA vez para todos os CortinaCards
  const { data: servicosConfeccao = [] } = useQuery({
    queryKey: ['servicos-confeccao-ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicos_confeccao')
        .select('*')
        .eq('ativo', true)
        .order('nome_modelo');
      if (error) throw error;
      return (data || []) as ServicoConfeccao[];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

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
          barraCm: item.barra_cm || undefined,
          barraForroCm: item.barra_forro_cm || undefined,
          quantidade: item.quantidade,
          tipoProduto: (item.tipo_produto as 'cortina' | 'persiana' | 'outro') || 'cortina',
          tipoCortina: item.tipo_cortina as any,
          tecidoId: item.tecido_id || undefined,
          forroId: item.forro_id || undefined,
          trilhoId: item.trilho_id || undefined,
          materialPrincipalId: item.material_principal_id || undefined,
          descricao: item.descricao || undefined,
          fabrica: item.fabrica || undefined,
          motorizada: item.motorizada || false,
          ambiente: item.ambiente || undefined,
          precoUnitario: item.preco_unitario || undefined,
          valorInstalacao: item.custo_instalacao || undefined,
          precisaInstalacao: item.precisa_instalacao,
          pontosInstalacao: item.pontos_instalacao || undefined,
          observacoesInternas: item.observacoes_internas || undefined,
          custoTecido: item.custo_tecido || undefined,
          custoForro: item.custo_forro || undefined,
          custoTrilho: item.custo_trilho || undefined,
          custoCostura: item.custo_costura || undefined,
          custoInstalacao: item.custo_instalacao || undefined,
          custoTotal: item.custo_total || undefined,
          precoVenda: item.preco_venda || undefined,
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

  const adicionarOutro = (categoria: string) => {
    const novoOutro: Cortina = {
      nomeIdentificacao: `${categoria} ${produtos.filter(p => p.tipoProduto === 'outro').length + 1}`,
      largura: 0,
      altura: 0,
      quantidade: 1,
      tipoProduto: 'outro',
      tipoCortina: 'outro',
      precoUnitario: undefined,
      precisaInstalacao: false,
      descricao: categoria,
    };
    setProdutos([...produtos, novoOutro]);
    setDialogOutrosAberto(false);
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
    const produtoOriginal = produtos[index];
    const produto: Cortina = {
      ...produtoOriginal,
      id: undefined,
      nomeIdentificacao: `${produtoOriginal.nomeIdentificacao} (Cópia)`,
      tecidoId: produtoOriginal.tecidoId,
      forroId: produtoOriginal.forroId,
      trilhoId: produtoOriginal.trilhoId,
      barraCm: produtoOriginal.barraCm,
      barraForroCm: produtoOriginal.barraForroCm,
      custoTecido: produtoOriginal.custoTecido,
      custoForro: produtoOriginal.custoForro,
      custoTrilho: produtoOriginal.custoTrilho,
      custoMaterialPrincipal: produtoOriginal.custoMaterialPrincipal,
      custoCostura: produtoOriginal.custoCostura,
      custoInstalacao: produtoOriginal.custoInstalacao,
      custoTotal: produtoOriginal.custoTotal,
      precoUnitario: produtoOriginal.precoUnitario,
      precoVenda: produtoOriginal.precoVenda,
      servicosAdicionaisIds: produtoOriginal.servicosAdicionaisIds 
        ? [...produtoOriginal.servicosAdicionaisIds] 
        : [],
      materialPrincipalId: produtoOriginal.materialPrincipalId,
      observacoesInternas: produtoOriginal.observacoesInternas,
    };
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

  // Função para salvar produto individual (simplificada - o salvamento real é no card)
  const salvarProdutoSimples = useCallback(async (produto: Cortina): Promise<Cortina | null> => {
    if (produto.id) return produto; // Já salvo
    
    // Criar produto no banco
    try {
      const { data, error } = await supabase
        .from('cortina_items')
        .insert({
          orcamento_id: orcamentoId,
          nome_identificacao: produto.nomeIdentificacao,
          largura: produto.largura || 0,
          altura: produto.altura || 0,
          quantidade: produto.quantidade || 1,
          tipo_produto: produto.tipoProduto,
          tipo_cortina: produto.tipoCortina,
          ambiente: produto.ambiente,
          tecido_id: produto.tecidoId || null,
          forro_id: produto.forroId || null,
          trilho_id: produto.trilhoId || null,
          material_principal_id: produto.materialPrincipalId || null,
          descricao: produto.descricao || null,
          fabrica: produto.fabrica || null,
          motorizada: produto.motorizada || false,
          preco_unitario: produto.precoUnitario || 0,
          precisa_instalacao: produto.precisaInstalacao || false,
          pontos_instalacao: produto.pontosInstalacao || 0,
          observacoes_internas: produto.observacoesInternas || null,
          custo_instalacao: produto.custoInstalacao || 0,
          custo_total: produto.custoTotal || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return { ...produto, id: data.id };
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      return null;
    }
  }, [orcamentoId]);

  // Salvar todos os produtos não salvos antes de navegar
  const salvarTodosProdutosNaoSalvos = useCallback(async (): Promise<boolean> => {
    const produtosNaoSalvos = produtos.filter((p) => !p.id);
    if (produtosNaoSalvos.length === 0) return true;

    setSalvandoTodos(true);
    try {
      const resultados = await Promise.all(
        produtosNaoSalvos.map(p => salvarProdutoSimples(p))
      );

      const todosSalvos = resultados.every(r => r !== null);
      if (todosSalvos) {
        // Atualizar lista de produtos com os IDs
        const novosProdutos = produtos.map(p => {
          if (p.id) return p;
          const salvo = resultados.find(r => r && r.nomeIdentificacao === p.nomeIdentificacao);
          return salvo || p;
        });
        setProdutos(novosProdutos);
        toast({
          title: 'Produtos salvos',
          description: `${produtosNaoSalvos.length} produto(s) salvo(s) automaticamente`,
        });
      }
      return todosSalvos;
    } catch (error) {
      console.error('Erro ao salvar produtos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar todos os produtos',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSalvandoTodos(false);
    }
  }, [produtos, salvarProdutoSimples]);

  // Voltar com auto-save
  const handleVoltar = useCallback(async () => {
    const produtosNaoSalvos = produtos.filter((p) => !p.id);
    if (produtosNaoSalvos.length > 0) {
      await salvarTodosProdutosNaoSalvos();
    }
    onVoltar();
  }, [produtos, salvarTodosProdutosNaoSalvos, onVoltar]);

  const handleAvancar = async () => {
    if (produtos.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Adicione pelo menos um produto antes de avançar',
        variant: 'destructive',
      });
      return;
    }

    const produtosInvalidos = produtos.filter((p) => {
      if (!p.nomeIdentificacao || p.quantidade <= 0) {
        return true;
      }
      
      if (p.tipoProduto === 'cortina') {
        return p.largura <= 0 || p.altura <= 0 || (!p.tecidoId && !p.forroId);
      }
      if (p.tipoProduto === 'persiana') {
        return !p.tipoCortina || !p.ambiente || p.precoUnitario === undefined || p.precoUnitario === null;
      }
      if (p.tipoProduto === 'outro') {
        if (p.descricao === 'Acessórios' || p.descricao === 'Papel') {
          return !p.materialPrincipalId || !p.precoUnitario || p.precoUnitario <= 0;
        }
        if (p.descricao === 'Motorizado') {
          return !p.precoUnitario || p.precoUnitario <= 0;
        }
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

    // Auto-salvar produtos não salvos antes de avançar
    const produtosNaoSalvos = produtos.filter((p) => !p.id);
    if (produtosNaoSalvos.length > 0) {
      const sucesso = await salvarTodosProdutosNaoSalvos();
      if (!sucesso) {
        toast({
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar todos os produtos. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }
    }

    onAvancar(produtos);
  };

  // Estado de loading dos materiais
  if (loadingMateriais) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Etapa 2 - Produtos</h2>
        </div>
        <Card className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando catálogo de materiais...</p>
          <p className="text-sm text-muted-foreground mt-2">Isso pode levar alguns segundos</p>
        </Card>
      </div>
    );
  }

  // Estado de erro
  if (errorMateriais) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Etapa 2 - Produtos</h2>
        </div>
        <Card className="p-8 text-center border-destructive">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <p className="text-destructive font-medium">Erro ao carregar materiais</p>
          <p className="text-sm text-muted-foreground mb-4">{errorMateriais.message}</p>
          <Button onClick={refetchAll} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </Card>
      </div>
    );
  }

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
            onClick={() => setDialogOutrosAberto(true)}
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
                  materiais={materiais}
                  loadingMateriais={loadingMateriais}
                  servicosConfeccao={servicosConfeccao}
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
        <Button type="button" variant="outline" onClick={handleVoltar} disabled={salvandoTodos}>
          {salvandoTodos ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Voltar'
          )}
        </Button>
        <Button type="button" onClick={handleAvancar} disabled={loading || salvandoTodos} className="flex-1">
          {salvandoTodos ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando produtos...
            </>
          ) : (
            'Avançar para Resumo'
          )}
        </Button>
      </div>

      <Dialog open={dialogOutrosAberto} onOpenChange={setDialogOutrosAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar Categoria de Produto</DialogTitle>
            <DialogDescription>
              Escolha a categoria do produto que deseja adicionar
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={() => adicionarOutro('Acessórios')}
            >
              <Wrench className="h-6 w-6" />
              <span>Acessórios</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={() => adicionarOutro('Papel')}
            >
              <Wallpaper className="h-6 w-6" />
              <span>Papel</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={() => adicionarOutro('Motorizado')}
            >
              <Zap className="h-6 w-6" />
              <span>Motorizado</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={() => adicionarOutro('Outros')}
            >
              <Package className="h-6 w-6" />
              <span>Outros</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
