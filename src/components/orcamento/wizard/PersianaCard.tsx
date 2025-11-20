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

interface PersianaCardProps {
  persiana: Cortina;
  orcamentoId: string;
  onUpdate: (persiana: Cortina) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

export function PersianaCard({
  persiana,
  orcamentoId,
  onUpdate,
  onRemove,
  onDuplicate,
}: PersianaCardProps) {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [acessorios, setAcessorios] = useState<Material[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarMateriais();
  }, []);

  const carregarMateriais = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('materiais')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Erro na query de materiais:', error);
        throw error;
      }

      console.log('Materiais carregados:', data?.length || 0);

      // Para persianas, filtramos tecidos, papéis e trilhos como material principal
      const materiaisList = data?.filter((m) => 
        m.categoria === 'tecido' || 
        m.categoria === 'papel' ||
        m.categoria === 'trilho'
      ) || [];
      
      const acessoriosList = data?.filter((m) => m.categoria === 'acessorio') || [];

      console.log('Materiais principais:', materiaisList.length, 'Acessórios:', acessoriosList.length);

      setMateriais(materiaisList);
      setAcessorios(acessoriosList);

      if (materiaisList.length === 0) {
        toast({
          title: 'Materiais não encontrados',
          description: 'Retorne ao dashboard e importe a base de dados da Prisma',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Materiais carregados',
          description: `${materiaisList.length} materiais principais e ${acessoriosList.length} acessórios disponíveis`,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar materiais:', error);
      toast({
        title: 'Erro ao carregar materiais',
        description: 'Verifique sua conexão e tente novamente',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Cortina, value: any) => {
    const novosDados = { ...persiana, [field]: value };
    onUpdate(novosDados);
  };

  const salvarPersiana = async () => {
    setSaving(true);
    try {
      // Validar campos obrigatórios
      if (!persiana.materialPrincipalId) {
        throw new Error('Material principal é obrigatório');
      }

      // Buscar materiais e serviços para calcular custos
      const { data: materiaisData } = await supabase
        .from('materiais')
        .select('*')
        .in('id', [persiana.materialPrincipalId, persiana.trilhoId].filter(Boolean));

      const { data: servicosInstalacao } = await supabase
        .from('servicos_instalacao')
        .select('*')
        .eq('ativo', true)
        .limit(1)
        .maybeSingle();

      if (!materiaisData || materiaisData.length === 0) {
        throw new Error('Materiais não encontrados na base de dados');
      }

      // Usar função de cálculo específica para persianas
      const materialPrincipal = materiaisData.find((m) => m.id === persiana.materialPrincipalId);
      
      if (!materialPrincipal) {
        throw new Error('Material principal não encontrado');
      }

      const area = persiana.largura * persiana.altura * persiana.quantidade;
      const custoMaterialPrincipal = area * materialPrincipal.preco_custo;
      
      const trilho = persiana.trilhoId 
        ? materiaisData.find((m) => m.id === persiana.trilhoId)
        : null;
      const custoTrilho = trilho ? (persiana.largura + 0.1) * trilho.preco_custo * persiana.quantidade : 0;

      const custoInstalacao = persiana.precisaInstalacao && servicosInstalacao
        ? (persiana.pontosInstalacao || 1) * servicosInstalacao.preco_custo_por_ponto
        : 0;

      const custoTotal = custoMaterialPrincipal + custoTrilho + custoInstalacao;

      const dadosPersiana = {
        orcamento_id: orcamentoId,
        nome_identificacao: persiana.nomeIdentificacao,
        largura: persiana.largura,
        altura: persiana.altura,
        quantidade: persiana.quantidade,
        tipo_produto: 'persiana',
        tipo_cortina: persiana.tipoCortina,
        material_principal_id: persiana.materialPrincipalId || null,
        trilho_id: persiana.trilhoId || null,
        tecido_id: null,
        forro_id: null,
        precisa_instalacao: persiana.precisaInstalacao,
        pontos_instalacao: persiana.pontosInstalacao || 1,
        custo_tecido: 0,
        custo_forro: 0,
        custo_trilho: custoTrilho,
        custo_acessorios: custoMaterialPrincipal,
        custo_costura: 0,
        custo_instalacao: custoInstalacao,
        custo_total: custoTotal,
        preco_venda: 0,
      };

      let result;
      if (persiana.id) {
        result = await supabase
          .from('cortina_items')
          .update(dadosPersiana)
          .eq('id', persiana.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('cortina_items')
          .insert(dadosPersiana)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      onUpdate({ 
        ...persiana, 
        id: result.data.id, 
        custoMaterialPrincipal,
        custoTrilho,
        custoInstalacao,
        custoTotal 
      });

      toast({
        title: 'Sucesso',
        description: 'Persiana salva com sucesso',
      });
    } catch (error) {
      console.error('Erro ao salvar persiana:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a persiana',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">{persiana.nomeIdentificacao}</CardTitle>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={carregarMateriais}
            disabled={loading}
            title="Recarregar materiais"
          >
            {loading ? 'Carregando...' : 'Recarregar'}
          </Button>
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
            <Label htmlFor={`nome-${persiana.id}`}>Nome/Identificação *</Label>
            <Input
              id={`nome-${persiana.id}`}
              value={persiana.nomeIdentificacao}
              onChange={(e) => handleChange('nomeIdentificacao', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`tipo-${persiana.id}`}>Tipo de Persiana *</Label>
            <Select
              value={persiana.tipoCortina}
              onValueChange={(value) => handleChange('tipoCortina', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="horizontal">Horizontal</SelectItem>
                <SelectItem value="vertical">Vertical</SelectItem>
                <SelectItem value="romana">Romana</SelectItem>
                <SelectItem value="celular">Celular</SelectItem>
                <SelectItem value="madeira">Madeira</SelectItem>
                <SelectItem value="rolo">Rolo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`largura-${persiana.id}`}>Largura (m) *</Label>
            <Input
              id={`largura-${persiana.id}`}
              type="number"
              step="0.01"
              value={persiana.largura || ''}
              onChange={(e) => handleChange('largura', parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`altura-${persiana.id}`}>Altura (m) *</Label>
            <Input
              id={`altura-${persiana.id}`}
              type="number"
              step="0.01"
              value={persiana.altura || ''}
              onChange={(e) => handleChange('altura', parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`quantidade-${persiana.id}`}>Quantidade *</Label>
            <Input
              id={`quantidade-${persiana.id}`}
              type="number"
              min="1"
              value={persiana.quantidade}
              onChange={(e) => handleChange('quantidade', parseInt(e.target.value) || 1)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`material-${persiana.id}`}>Material Principal *</Label>
            <Select
              value={persiana.materialPrincipalId || 'none'}
              onValueChange={(value) => handleChange('materialPrincipalId', value === 'none' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Selecionar...</SelectItem>
                {materiais.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    Nenhum material disponível - Importe a base de dados
                  </SelectItem>
                ) : (
                  materiais.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.nome}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`acessorio-${persiana.id}`}>Trilho/Acessório (Opcional)</Label>
            <Select
              value={persiana.trilhoId || 'none'}
              onValueChange={(value) => handleChange('trilhoId', value === 'none' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o acessório" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem acessório</SelectItem>
                {acessorios.map((acessorio) => (
                  <SelectItem key={acessorio.id} value={acessorio.id}>
                    {acessorio.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex items-center justify-between md:col-span-2">
            <Label htmlFor={`instalacao-${persiana.id}`}>Precisa de Instalação?</Label>
            <Switch
              id={`instalacao-${persiana.id}`}
              checked={persiana.precisaInstalacao}
              onCheckedChange={(checked) => handleChange('precisaInstalacao', checked)}
            />
          </div>

          {persiana.precisaInstalacao && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={`pontos-${persiana.id}`}>Pontos de Instalação *</Label>
              <Input
                id={`pontos-${persiana.id}`}
                type="number"
                min="1"
                value={persiana.pontosInstalacao || 1}
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
          onClick={salvarPersiana}
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Salvando...' : 'Salvar Persiana'}
        </Button>
      </CardContent>
    </Card>
  );
}
