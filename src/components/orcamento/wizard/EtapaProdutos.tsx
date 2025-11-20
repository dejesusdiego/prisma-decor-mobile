import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { CortinaCard } from './CortinaCard';
import { PersianaCard } from './PersianaCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Cortina } from '@/types/orcamento';

interface EtapaProdutosProps {
  orcamentoId: string;
  produtosIniciais: Cortina[];
  onAvancar: (produtos: Cortina[]) => void;
  onVoltar: () => void;
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
            Adicionar Cortina
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={adicionarPersiana}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Persiana
          </Button>
        </div>
      </div>

      {produtos.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p>Nenhum produto adicionado ainda.</p>
          <p className="text-sm mt-2">Clique em "Adicionar Cortina" ou "Adicionar Persiana" para começar.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {produtos.map((produto, index) => (
            <div key={produto.id || index}>
              {produto.tipoProduto === 'cortina' ? (
                <CortinaCard
                  cortina={produto}
                  orcamentoId={orcamentoId}
                  onUpdate={(p) => atualizarProduto(index, p)}
                  onRemove={() => removerProduto(index)}
                  onDuplicate={() => duplicarProduto(index)}
                />
              ) : (
                <PersianaCard
                  persiana={produto}
                  orcamentoId={orcamentoId}
                  onUpdate={(p) => atualizarProduto(index, p)}
                  onRemove={() => removerProduto(index)}
                  onDuplicate={() => duplicarProduto(index)}
                />
              )}
            </div>
          ))}
        </div>
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
