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
import { Textarea } from '@/components/ui/textarea';
import { Copy, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Cortina, Material } from '@/types/orcamento';
import { OPCOES_AMBIENTE } from '@/types/orcamento';
import { MaterialSelector } from './MaterialSelector';

interface PapelCardProps {
  papel: Cortina;
  orcamentoId: string;
  onUpdate: (papel: Cortina) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

export function PapelCard({
  papel,
  orcamentoId,
  onUpdate,
  onRemove,
  onDuplicate,
}: PapelCardProps) {
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(!papel.id);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [material, setMaterial] = useState<Material | null>(null);

  useEffect(() => {
    const carregarMateriais = async () => {
      const { data } = await supabase
        .from('materiais')
        .select('*')
        .eq('categoria', 'papeis')
        .eq('ativo', true);
      
      if (data) {
        setMateriais(data.map(m => ({
          id: m.id,
          codigo_item: m.codigo_item || '',
          nome: m.nome,
          categoria: m.categoria,
          unidade: m.unidade,
          largura_metro: m.largura_metro || undefined,
          preco_custo: m.preco_custo,
          preco_tabela: m.preco_tabela,
          ativo: m.ativo,
          tipo: m.tipo || undefined,
          linha: m.linha || undefined,
          cor: m.cor || undefined,
        })));
      }
    };
    carregarMateriais();
  }, []);

  useEffect(() => {
    const carregarMaterial = async () => {
      if (papel.materialPrincipalId) {
        const { data } = await supabase
          .from('materiais')
          .select('*')
          .eq('id', papel.materialPrincipalId)
          .single();
        if (data) {
          setMaterial({
            id: data.id,
            codigo_item: data.codigo_item || '',
            nome: data.nome,
            categoria: data.categoria,
            unidade: data.unidade,
            largura_metro: data.largura_metro || undefined,
            preco_custo: data.preco_custo,
            preco_tabela: data.preco_tabela,
            ativo: data.ativo,
          });
        }
      }
    };
    carregarMaterial();
  }, [papel.materialPrincipalId]);

  const handleChange = (field: keyof Cortina, value: any) => {
    const novosDados = { ...papel, [field]: value };
    onUpdate(novosDados);
  };

  const handleMaterialSelect = (materialId: string | undefined) => {
    if (materialId) {
      const selectedMaterial = materiais.find(m => m.id === materialId);
      if (selectedMaterial) {
        setMaterial(selectedMaterial);
        handleChange('materialPrincipalId', materialId);
        handleChange('precoUnitario', selectedMaterial.preco_custo);
      }
    } else {
      setMaterial(null);
      handleChange('materialPrincipalId', undefined);
    }
  };

  const salvarPapel = async () => {
    setSaving(true);
    try {
      if (!papel.nomeIdentificacao || !papel.quantidade || !papel.materialPrincipalId) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      const custoInstalacao = papel.precisaInstalacao ? (papel.valorInstalacao || 0) : 0;
      const custoTotal = (papel.quantidade * (papel.precoUnitario || 0)) + custoInstalacao;

      const dadosPapel = {
        orcamento_id: orcamentoId,
        nome_identificacao: papel.nomeIdentificacao,
        descricao: 'Papel',
        largura: 0,
        altura: 0,
        quantidade: papel.quantidade,
        tipo_produto: 'outro',
        tipo_cortina: 'outro',
        ambiente: papel.ambiente || null,
        preco_unitario: papel.precoUnitario,
        is_outro: true,
        observacoes_internas: papel.observacoesInternas || null,
        tecido_id: null,
        forro_id: null,
        trilho_id: null,
        material_principal_id: papel.materialPrincipalId,
        precisa_instalacao: papel.precisaInstalacao,
        pontos_instalacao: null,
        custo_tecido: 0,
        custo_forro: 0,
        custo_trilho: 0,
        custo_acessorios: 0,
        custo_costura: 0,
        custo_instalacao: custoInstalacao,
        custo_total: custoTotal,
        preco_venda: 0,
      };

      let result;
      if (papel.id) {
        result = await supabase
          .from('cortina_items')
          .update(dadosPapel)
          .eq('id', papel.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('cortina_items')
          .insert(dadosPapel)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      onUpdate({ ...papel, id: result.data.id, custoInstalacao, custoTotal });

      toast({
        title: 'Sucesso',
        description: 'Papel de parede salvo com sucesso',
      });

      setExpanded(false);
    } catch (error) {
      console.error('Erro ao salvar papel:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o papel de parede',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <CardTitle className="text-lg flex items-center gap-2">
            {papel.nomeIdentificacao}
            {!expanded && papel.id && (
              <span className="text-sm text-muted-foreground font-normal">
                • Qtd: {papel.quantidade}
                {material && (
                  <span className="ml-2">• {material.nome}</span>
                )}
                {papel.custoTotal !== undefined && papel.custoTotal > 0 && (
                  <span className="ml-2 text-primary font-semibold">
                    • Custo: R$ {papel.custoTotal.toFixed(2)}
                  </span>
                )}
              </span>
            )}
          </CardTitle>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? "Recolher" : "Expandir"}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
      {expanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <MaterialSelector
                categoria={'acessorio' as any}
                materiais={materiais}
                value={papel.materialPrincipalId}
                onSelect={handleMaterialSelect}
                placeholder="Selecionar Papel de Parede"
                optional={false}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`nome-${papel.id}`}>Nome/Descrição *</Label>
              <Input
                id={`nome-${papel.id}`}
                value={papel.nomeIdentificacao}
                onChange={(e) => handleChange('nomeIdentificacao', e.target.value)}
                required
                placeholder="Ex: Papel Sala, Papel Quarto..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`ambiente-${papel.id}`}>Ambiente</Label>
              <Select
                value={papel.ambiente || 'none'}
                onValueChange={(value) => handleChange('ambiente', value === 'none' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ambiente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não especificado</SelectItem>
                  {OPCOES_AMBIENTE.map((ambiente) => (
                    <SelectItem key={ambiente} value={ambiente}>
                      {ambiente}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`quantidade-${papel.id}`}>Quantidade (m²) *</Label>
              <Input
                id={`quantidade-${papel.id}`}
                type="number"
                min="0.01"
                step="0.01"
                value={papel.quantidade}
                onChange={(e) => handleChange('quantidade', parseFloat(e.target.value) || 1)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`preco-${papel.id}`}>Preço por m² (R$) *</Label>
              <Input
                id={`preco-${papel.id}`}
                type="number"
                step="0.01"
                min="0"
                value={papel.precoUnitario || ''}
                onChange={(e) => handleChange('precoUnitario', parseFloat(e.target.value) || 0)}
                required
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={`obs-${papel.id}`}>Observações Internas (não aparecem no PDF)</Label>
              <Textarea
                id={`obs-${papel.id}`}
                value={papel.observacoesInternas || ''}
                onChange={(e) => handleChange('observacoesInternas', e.target.value)}
                placeholder="Anotações internas sobre este item..."
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2 flex items-center justify-between md:col-span-2">
              <Label htmlFor={`instalacao-${papel.id}`}>Precisa de Instalação?</Label>
              <Switch
                id={`instalacao-${papel.id}`}
                checked={papel.precisaInstalacao}
                onCheckedChange={(checked) => handleChange('precisaInstalacao', checked)}
              />
            </div>

            {papel.precisaInstalacao && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`valor-instalacao-${papel.id}`}>Valor da Instalação (R$) *</Label>
                <Input
                  id={`valor-instalacao-${papel.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={papel.valorInstalacao || ''}
                  onChange={(e) =>
                    handleChange('valorInstalacao', parseFloat(e.target.value) || undefined)
                  }
                  required
                  placeholder="0.00"
                />
              </div>
            )}

            {papel.precoUnitario && papel.quantidade > 0 && (
              <div className="md:col-span-2 p-4 bg-muted rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm">
                    Subtotal: R$ {(papel.quantidade * (papel.precoUnitario || 0)).toFixed(2)}
                  </p>
                  {papel.precisaInstalacao && papel.valorInstalacao && (
                    <>
                      <p className="text-sm">
                        Instalação: R$ {papel.valorInstalacao.toFixed(2)}
                      </p>
                      <p className="text-sm font-medium border-t pt-1">
                        Total: R$ {((papel.quantidade * (papel.precoUnitario || 0)) + (papel.valorInstalacao || 0)).toFixed(2)}
                      </p>
                    </>
                  )}
                  {!papel.precisaInstalacao && (
                    <p className="text-sm font-medium">
                      Total: R$ {(papel.quantidade * (papel.precoUnitario || 0)).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            type="button"
            onClick={salvarPapel}
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Salvando...' : 'Salvar Papel de Parede'}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
