import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Copy, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Cortina, Material } from '@/types/orcamento';
import { calcularCustosCortina } from '@/lib/calculosOrcamento';

interface CortinaCardProps {
  cortina: Cortina;
  orcamentoId: string;
  onUpdate: (cortina: Cortina) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

export function CortinaCard({
  cortina,
  orcamentoId,
  onUpdate,
  onRemove,
  onDuplicate,
}: CortinaCardProps) {
  const [tecidos, setTecidos] = useState<Material[]>([]);
  const [forros, setForros] = useState<Material[]>([]);
  const [trilhos, setTrilhos] = useState<Material[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    carregarMateriais();
  }, []);

  const carregarMateriais = async () => {
    try {
      const { data, error } = await supabase
        .from('materiais')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;

      const tecidosList = data?.filter((m) => m.categoria === 'tecido') || [];
      const forrosList = data?.filter((m) => m.categoria === 'forro') || [];
      const trilhosList = data?.filter((m) => m.categoria === 'trilho') || [];

      setTecidos(tecidosList);
      setForros(forrosList);
      setTrilhos(trilhosList);

      if (tecidosList.length === 0) {
        toast({
          title: 'Base de dados vazia',
          description: 'Importe a base de dados da Prisma antes de criar orçamentos',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar materiais:', error);
      toast({
        title: 'Erro ao carregar materiais',
        description: 'Verifique sua conexão e tente novamente',
        variant: 'destructive',
      });
    }
  };

  const handleChange = (field: keyof Cortina, value: any) => {
    const novosDados = { ...cortina, [field]: value };
    onUpdate(novosDados);
  };

  const salvarCortina = async () => {
    setSaving(true);
    try {
      // Buscar materiais e serviços para calcular custos
      const { data: materiaisData } = await supabase
        .from('materiais')
        .select('*')
        .in('id', [cortina.tecidoId, cortina.forroId, cortina.trilhoId].filter(Boolean));

      const { data: servicosConfeccao } = await supabase
        .from('servicos_confeccao')
        .select('*')
        .eq('ativo', true)
        .limit(1)
        .single();

      const { data: servicosInstalacao } = await supabase
        .from('servicos_instalacao')
        .select('*')
        .eq('ativo', true)
        .limit(1)
        .single();

      if (!materiaisData || !servicosConfeccao) {
        throw new Error('Materiais ou serviços não encontrados');
      }

      const custos = calcularCustosCortina(
        cortina,
        materiaisData,
        servicosConfeccao,
        servicosInstalacao
      );

      const dadosCortina = {
        orcamento_id: orcamentoId,
        nome_identificacao: cortina.nomeIdentificacao,
        largura: cortina.largura,
        altura: cortina.altura,
        quantidade: cortina.quantidade,
        tipo_produto: 'cortina',
        tipo_cortina: cortina.tipoCortina,
        tecido_id: cortina.tecidoId,
        forro_id: cortina.forroId || null,
        trilho_id: cortina.trilhoId,
        material_principal_id: null,
        precisa_instalacao: cortina.precisaInstalacao,
        pontos_instalacao: cortina.pontosInstalacao || 1,
        custo_tecido: custos.custoTecido,
        custo_forro: custos.custoForro,
        custo_trilho: custos.custoTrilho,
        custo_acessorios: 0,
        custo_costura: custos.custoCostura,
        custo_instalacao: custos.custoInstalacao,
        custo_total: custos.custoTotal,
        preco_venda: 0, // Será calculado na etapa 3
      };

      let result;
      if (cortina.id) {
        result = await supabase
          .from('cortina_items')
          .update(dadosCortina)
          .eq('id', cortina.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('cortina_items')
          .insert(dadosCortina)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      onUpdate({ ...cortina, id: result.data.id, tipoProduto: 'cortina', ...custos });

      toast({
        title: 'Sucesso',
        description: 'Cortina salva com sucesso',
      });
    } catch (error) {
      console.error('Erro ao salvar cortina:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a cortina',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">{cortina.nomeIdentificacao}</CardTitle>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onDuplicate}
            title="Duplicar"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onRemove}
            title="Remover"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`nome-${cortina.id}`}>Nome/Identificação *</Label>
            <Input
              id={`nome-${cortina.id}`}
              value={cortina.nomeIdentificacao}
              onChange={(e) => handleChange('nomeIdentificacao', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`tipo-${cortina.id}`}>Tipo *</Label>
            <Select
              value={cortina.tipoCortina}
              onValueChange={(value) => handleChange('tipoCortina', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wave">Wave</SelectItem>
                <SelectItem value="prega">Prega</SelectItem>
                <SelectItem value="painel">Painel</SelectItem>
                <SelectItem value="rolo">Rolo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`largura-${cortina.id}`}>Largura (m) *</Label>
            <Input
              id={`largura-${cortina.id}`}
              type="number"
              step="0.01"
              value={cortina.largura || ''}
              onChange={(e) => handleChange('largura', parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`altura-${cortina.id}`}>Altura (m) *</Label>
            <Input
              id={`altura-${cortina.id}`}
              type="number"
              step="0.01"
              value={cortina.altura || ''}
              onChange={(e) => handleChange('altura', parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`quantidade-${cortina.id}`}>Quantidade *</Label>
            <Input
              id={`quantidade-${cortina.id}`}
              type="number"
              min="1"
              value={cortina.quantidade}
              onChange={(e) => handleChange('quantidade', parseInt(e.target.value) || 1)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`tecido-${cortina.id}`}>Tecido Principal *</Label>
            <Select
              value={cortina.tecidoId}
              onValueChange={(value) => handleChange('tecidoId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tecido" />
              </SelectTrigger>
              <SelectContent>
                {tecidos.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhum tecido disponível - Importe a base de dados
                  </SelectItem>
                ) : (
                  tecidos.map((tecido) => (
                    <SelectItem key={tecido.id} value={tecido.id}>
                      {tecido.nome}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`forro-${cortina.id}`}>Forro (Opcional)</Label>
            <Select
              value={cortina.forroId || 'none'}
              onValueChange={(value) => handleChange('forroId', value === 'none' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o forro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem forro</SelectItem>
                {forros.map((forro) => (
                  <SelectItem key={forro.id} value={forro.id}>
                    {forro.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`trilho-${cortina.id}`}>Trilho *</Label>
            <Select
              value={cortina.trilhoId}
              onValueChange={(value) => handleChange('trilhoId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o trilho" />
              </SelectTrigger>
              <SelectContent>
                {trilhos.map((trilho) => (
                  <SelectItem key={trilho.id} value={trilho.id}>
                    {trilho.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex items-center justify-between md:col-span-2">
            <Label htmlFor={`instalacao-${cortina.id}`}>Precisa de Instalação?</Label>
            <Switch
              id={`instalacao-${cortina.id}`}
              checked={cortina.precisaInstalacao}
              onCheckedChange={(checked) => handleChange('precisaInstalacao', checked)}
            />
          </div>

          {cortina.precisaInstalacao && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={`pontos-${cortina.id}`}>Pontos de Instalação *</Label>
              <Input
                id={`pontos-${cortina.id}`}
                type="number"
                min="1"
                value={cortina.pontosInstalacao || 1}
                onChange={(e) =>
                  handleChange('pontosInstalacao', parseInt(e.target.value) || 1)
                }
                required
              />
            </div>
          )}
        </div>

        <Button
          type="button"
          onClick={salvarCortina}
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Salvando...' : 'Salvar Cortina'}
        </Button>
      </CardContent>
    </Card>
  );
}
