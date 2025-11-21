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
      const response = await fetch('/data/materials.json');
      const data = await response.json();

      const materiaisList = data.filter((m: any) => 
        m.categoria === 'tecido' || 
        m.categoria === 'papel' ||
        m.categoria === 'trilho'
      );
      
      const acessoriosList = data.filter((m: any) => m.categoria === 'acessorio');

      const materiaisFormatados = (items: any[]) => items.map((item: any) => ({
        id: item.codigoItem,
        codigo_item: item.codigoItem,
        nome: item.nome,
        categoria: item.categoria,
        unidade: item.unidade || 'M',
        largura_metro: item.larguraMetro || null,
        preco_custo: Number(item.precoCusto) / 100,
        preco_tabela: (Number(item.precoCusto) / 100) * 1.615,
        margem_tabela_percent: 61.5,
        perda_percent: 10,
        ativo: item.ativo !== false,
        created_at: '',
        updated_at: '',
      }));

      setMateriais(materiaisFormatados(materiaisList));
      setAcessorios(materiaisFormatados(acessoriosList));

      toast({
        title: 'Materiais carregados',
        description: `${materiaisList.length} materiais principais e ${acessoriosList.length} acessórios disponíveis`,
      });
    } catch (error) {
      console.error('Erro ao carregar materiais:', error);
      toast({
        title: 'Erro ao carregar materiais',
        description: 'Não foi possível carregar os materiais do catálogo',
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
      if (!persiana.materialPrincipalId) {
        throw new Error('Material principal é obrigatório');
      }

      // Buscar serviço de instalação do JSON
      const instalacaoResponse = await fetch('/data/servicos_instalacao.json');
      const instalacaoData = await instalacaoResponse.json();
      const servicoInstalacao = instalacaoData[0];

      const materialPrincipal = materiais.find((m) => m.id === persiana.materialPrincipalId);
      
      if (!materialPrincipal) {
        throw new Error('Material principal não encontrado');
      }

      const area = persiana.largura * persiana.altura * persiana.quantidade;
      const custoMaterialPrincipal = area * materialPrincipal.preco_custo;
      
      const trilho = persiana.trilhoId 
        ? materiais.find((m) => m.id === persiana.trilhoId) || acessorios.find((m) => m.id === persiana.trilhoId)
        : null;
      const custoTrilho = trilho ? (persiana.largura + 0.1) * trilho.preco_custo * persiana.quantidade : 0;

      const custoInstalacao = persiana.precisaInstalacao && servicoInstalacao
        ? (persiana.pontosInstalacao || 1) * Number(servicoInstalacao.precoCustoPorPonto)
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
                    Carregando materiais...
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
