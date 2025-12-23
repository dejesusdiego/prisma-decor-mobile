import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { EtapaCliente } from './wizard/EtapaCliente';
import { EtapaProdutos } from './wizard/EtapaProdutos';
import { EtapaResumo } from './wizard/EtapaResumo';
import type { DadosOrcamento, Cortina } from '@/types/orcamento';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ClienteDataInicial {
  nome: string;
  telefone: string;
  endereco: string;
  cidade: string;
}

interface NovoOrcamentoProps {
  onVoltar: () => void;
  orcamentoId?: string | null;
  clienteDataInicial?: ClienteDataInicial | null;
}

export function NovoOrcamento({ onVoltar, orcamentoId, clienteDataInicial }: NovoOrcamentoProps) {
  const [etapa, setEtapa] = useState(1);
  const [dados, setDados] = useState<DadosOrcamento>({
    clienteNome: clienteDataInicial?.nome || '',
    clienteTelefone: clienteDataInicial?.telefone || '',
    cidade: clienteDataInicial?.cidade || '',
    endereco: clienteDataInicial?.endereco || '',
    observacoes: '',
  });
  const [cortinas, setCortinas] = useState<Cortina[]>([]);
  const [orcamentoIdAtual, setOrcamentoIdAtual] = useState<string | null>(orcamentoId || null);
  const [loading, setLoading] = useState(false);

  // Carregar dados do orçamento quando orcamentoId é fornecido
  useEffect(() => {
    const carregarOrcamento = async () => {
      if (!orcamentoId) return;
      
      setLoading(true);
      try {
        // Carregar dados do orçamento
        const { data: orcamento, error: orcamentoError } = await supabase
          .from('orcamentos')
          .select('*')
          .eq('id', orcamentoId)
          .single();

        if (orcamentoError) throw orcamentoError;

        setDados({
          clienteNome: orcamento.cliente_nome,
          clienteTelefone: orcamento.cliente_telefone,
          cidade: orcamento.cidade || 'Balneário Camboriú',
          endereco: orcamento.endereco || '',
          observacoes: orcamento.observacoes || '',
        });

        // Carregar cortinas/persianas do orçamento
        const { data: items, error: itemsError } = await supabase
          .from('cortina_items')
          .select('*')
          .eq('orcamento_id', orcamentoId);

        if (itemsError) throw itemsError;

        if (items) {
          const cortinasCarregadas: Cortina[] = items.map(item => ({
            id: item.id,
            nomeIdentificacao: item.nome_identificacao,
            largura: item.largura,
            altura: item.altura,
            barraCm: item.barra_cm || undefined,
            barraForroCm: item.barra_forro_cm || undefined,
            quantidade: item.quantidade,
            tipoProduto: (item.tipo_produto as 'cortina' | 'persiana' | 'outro') || 'cortina',
            tipoCortina: item.tipo_cortina as any,
            ambiente: item.ambiente || undefined,
            tecidoId: item.tecido_id || undefined,
            forroId: item.forro_id || undefined,
            trilhoId: item.trilho_id || undefined,
            materialPrincipalId: item.material_principal_id || undefined,
            descricao: item.descricao || undefined,
            fabrica: item.fabrica || undefined,
            motorizada: item.motorizada || false,
            precoUnitario: item.preco_unitario || undefined,
            valorInstalacao: item.tipo_produto === 'outro' ? item.custo_instalacao : undefined,
            precisaInstalacao: item.precisa_instalacao,
            pontosInstalacao: item.pontos_instalacao || undefined,
            observacoesInternas: item.observacoes_internas || undefined,
            servicosAdicionaisIds: item.servicos_adicionais_ids || [],
            custoTecido: item.custo_tecido || undefined,
            custoForro: item.custo_forro || undefined,
            custoTrilho: item.custo_trilho || undefined,
            custoMaterialPrincipal: item.custo_acessorios || undefined,
            custoCostura: item.custo_costura || undefined,
            custoInstalacao: item.custo_instalacao || undefined,
            custoTotal: item.custo_total || undefined,
            precoVenda: item.preco_venda || undefined,
          }));
          setCortinas(cortinasCarregadas);
        }

        toast({
          title: 'Sucesso',
          description: 'Orçamento carregado para edição',
        });
      } catch (error) {
        console.error('Erro ao carregar orçamento:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o orçamento',
          variant: 'destructive',
        });
        onVoltar();
      } finally {
        setLoading(false);
      }
    };

    carregarOrcamento();
  }, [orcamentoId, onVoltar]);

  const handleAvancarEtapa1 = (dadosCliente: DadosOrcamento, novoOrcamentoId: string) => {
    setDados(dadosCliente);
    setOrcamentoIdAtual(novoOrcamentoId);
    setEtapa(2);
  };

  const handleAvancarEtapa2 = (novasCortinas: Cortina[]) => {
    setCortinas(novasCortinas);
    setEtapa(3);
  };

  const handleVoltar = () => {
    if (etapa === 1) {
      onVoltar();
    } else {
      setEtapa(etapa - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando orçamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleVoltar}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {etapa === 1 ? 'Voltar ao Início' : 'Voltar'}
        </Button>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                num === etapa
                  ? 'bg-primary text-primary-foreground'
                  : num < etapa
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {num}
            </div>
          ))}
        </div>
      </div>

      {etapa === 1 && (
        <EtapaCliente
          dados={dados}
          orcamentoId={orcamentoIdAtual}
          onAvancar={handleAvancarEtapa1}
          onCancelar={onVoltar}
        />
      )}

        {etapa === 2 && orcamentoIdAtual && (
          <EtapaProdutos
            orcamentoId={orcamentoIdAtual}
            produtosIniciais={cortinas}
            onAvancar={handleAvancarEtapa2}
            onVoltar={() => setEtapa(1)}
          />
        )}

      {etapa === 3 && orcamentoIdAtual && (
        <EtapaResumo
          orcamentoId={orcamentoIdAtual}
          cortinas={cortinas}
          dadosCliente={dados}
          onVoltar={() => setEtapa(2)}
          onFinalizar={onVoltar}
        />
      )}
    </div>
  );
}
