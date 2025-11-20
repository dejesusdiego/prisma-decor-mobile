import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { CortinaCard } from './CortinaCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Cortina } from '@/types/orcamento';

interface EtapaCortinasProps {
  orcamentoId: string;
  cortinasIniciais: Cortina[];
  onAvancar: (cortinas: Cortina[]) => void;
  onVoltar: () => void;
}

export function EtapaCortinas({
  orcamentoId,
  cortinasIniciais,
  onAvancar,
  onVoltar,
}: EtapaCortinasProps) {
  const [cortinas, setCortinas] = useState<Cortina[]>(cortinasIniciais);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Carregar cortinas existentes se houver
    if (orcamentoId && cortinasIniciais.length === 0) {
      carregarCortinas();
    }
  }, [orcamentoId]);

  const carregarCortinas = async () => {
    try {
      const { data, error } = await supabase
        .from('cortina_items')
        .select('*')
        .eq('orcamento_id', orcamentoId);

      if (error) throw error;

      if (data && data.length > 0) {
        const cortinasCarregadas: Cortina[] = data.map((item) => ({
          id: item.id,
          nomeIdentificacao: item.nome_identificacao,
          largura: Number(item.largura),
          altura: Number(item.altura),
          quantidade: item.quantidade,
          tipoCortina: item.tipo_cortina as any,
          tecidoId: item.tecido_id,
          forroId: item.forro_id || undefined,
          trilhoId: item.trilho_id,
          precisaInstalacao: item.precisa_instalacao,
          pontosInstalacao: item.pontos_instalacao || undefined,
        }));
        setCortinas(cortinasCarregadas);
      }
    } catch (error) {
      console.error('Erro ao carregar cortinas:', error);
    }
  };

  const adicionarCortina = () => {
    const novaCortina: Cortina = {
      nomeIdentificacao: `Cortina ${cortinas.length + 1}`,
      largura: 0,
      altura: 0,
      quantidade: 1,
      tipoCortina: 'wave',
      tecidoId: '',
      trilhoId: '',
      precisaInstalacao: false,
    };
    setCortinas([...cortinas, novaCortina]);
  };

  const removerCortina = async (index: number) => {
    const cortina = cortinas[index];
    
    if (cortina.id) {
      try {
        const { error } = await supabase
          .from('cortina_items')
          .delete()
          .eq('id', cortina.id);

        if (error) throw error;
      } catch (error) {
        console.error('Erro ao remover cortina:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível remover a cortina',
          variant: 'destructive',
        });
        return;
      }
    }

    const novasCortinas = cortinas.filter((_, i) => i !== index);
    setCortinas(novasCortinas);
  };

  const duplicarCortina = (index: number) => {
    const cortina = { ...cortinas[index] };
    delete cortina.id; // Remove o ID para criar uma nova
    cortina.nomeIdentificacao = `${cortina.nomeIdentificacao} (Cópia)`;
    setCortinas([...cortinas, cortina]);
  };

  const atualizarCortina = (index: number, cortina: Cortina) => {
    const novasCortinas = [...cortinas];
    novasCortinas[index] = cortina;
    setCortinas(novasCortinas);
  };

  const handleAvancar = async () => {
    if (cortinas.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Adicione pelo menos uma cortina antes de avançar',
        variant: 'destructive',
      });
      return;
    }

    // Validar que todas as cortinas têm os campos obrigatórios
    const cortinasInvalidas = cortinas.filter(
      (c) => !c.nomeIdentificacao || c.largura <= 0 || c.altura <= 0 || !c.tecidoId || !c.trilhoId
    );

    if (cortinasInvalidas.length > 0) {
      toast({
        title: 'Atenção',
        description: 'Preencha todos os campos obrigatórios de todas as cortinas',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    onAvancar(cortinas);
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Etapa 2 - Cortinas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cortinas.map((cortina, index) => (
          <CortinaCard
            key={index}
            cortina={cortina}
            orcamentoId={orcamentoId}
            onUpdate={(cortina) => atualizarCortina(index, cortina)}
            onRemove={() => removerCortina(index)}
            onDuplicate={() => duplicarCortina(index)}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={adicionarCortina}
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Cortina
        </Button>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onVoltar}>
            Voltar
          </Button>
          <Button onClick={handleAvancar} disabled={loading}>
            {loading ? 'Salvando...' : 'Avançar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
