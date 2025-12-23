import { useState, useEffect, useRef } from 'react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, Trash2, ChevronDown, ChevronUp, Loader2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Cortina, Material } from '@/types/orcamento';
import { OPCOES_AMBIENTE } from '@/types/orcamento';
import { MaterialSelector } from './MaterialSelector';
import { fetchMateriaisPaginados } from '@/lib/fetchMateriaisPaginados';
import { CardStatusBadge, getCardStatus, getCardStatusClass } from '@/components/ui/CardStatusBadge';
import { CharacterCounter } from '@/components/ui/CharacterCounter';
import { cn } from '@/lib/utils';

interface AcessoriosCardProps {
  acessorio: Cortina;
  orcamentoId: string;
  onUpdate: (acessorio: Cortina) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

export function AcessoriosCard({
  acessorio,
  orcamentoId,
  onUpdate,
  onRemove,
  onDuplicate,
}: AcessoriosCardProps) {
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [expanded, setExpanded] = useState(!acessorio.id);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const cardStatus = getCardStatus(acessorio.id, hasChanges);
  const MAX_OBS_LENGTH = 500;

  useEffect(() => {
    const carregarMateriais = async () => {
      try {
        const materiaisList = await fetchMateriaisPaginados('acessorio', true);
        setMateriais(materiaisList);
      } catch (error) {
        console.error('Erro ao carregar materiais de acessórios:', error);
      } finally {
        setLoading(false);
      }
    };
    carregarMateriais();
  }, []);

  useEffect(() => {
    const carregarMaterial = async () => {
      if (acessorio.materialPrincipalId) {
        const { data } = await supabase
          .from('materiais')
          .select('*')
          .eq('id', acessorio.materialPrincipalId)
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
  }, [acessorio.materialPrincipalId]);

  const handleChange = (field: keyof Cortina, value: any) => {
    const novosDados = { ...acessorio, [field]: value };
    setHasChanges(true);
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

  const salvarAcessorio = async () => {
    setSaving(true);
    try {
      if (!acessorio.nomeIdentificacao || !acessorio.quantidade || !acessorio.materialPrincipalId) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      const custoInstalacao = acessorio.precisaInstalacao ? (acessorio.valorInstalacao || 0) : 0;
      const custoTotal = (acessorio.quantidade * (acessorio.precoUnitario || 0)) + custoInstalacao;

      const dadosAcessorio = {
        orcamento_id: orcamentoId,
        nome_identificacao: acessorio.nomeIdentificacao,
        descricao: 'Acessórios',
        largura: 0,
        altura: 0,
        quantidade: acessorio.quantidade,
        tipo_produto: 'outro',
        tipo_cortina: 'outro',
        ambiente: acessorio.ambiente || null,
        preco_unitario: acessorio.precoUnitario,
        is_outro: true,
        observacoes_internas: acessorio.observacoesInternas || null,
        tecido_id: null,
        forro_id: null,
        trilho_id: null,
        material_principal_id: acessorio.materialPrincipalId,
        precisa_instalacao: acessorio.precisaInstalacao,
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
      if (acessorio.id) {
        result = await supabase
          .from('cortina_items')
          .update(dadosAcessorio)
          .eq('id', acessorio.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('cortina_items')
          .insert(dadosAcessorio)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      onUpdate({ ...acessorio, id: result.data.id, custoInstalacao, custoTotal });
      setHasChanges(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);

      // Flash de sucesso
      if (cardRef.current) {
        cardRef.current.classList.add('success-flash');
        setTimeout(() => cardRef.current?.classList.remove('success-flash'), 600);
      }

      toast({
        title: 'Sucesso',
        description: 'Acessório salvo com sucesso',
      });

      setExpanded(false);
    } catch (error) {
      console.error('Erro ao salvar acessório:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o acessório',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <TooltipProvider>
    <Card ref={cardRef} className={cn('transition-all duration-200', getCardStatusClass(cardStatus))}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <CardTitle className="text-lg flex items-center gap-2">
            {acessorio.nomeIdentificacao}
            <CardStatusBadge status={cardStatus} />
            {!expanded && acessorio.id && (
              <span className="text-sm text-muted-foreground font-normal">
                • Qtd: {acessorio.quantidade}
                {material && (
                  <span className="ml-2">• {material.nome}</span>
                )}
                {acessorio.custoTotal !== undefined && acessorio.custoTotal > 0 && (
                  <span className="ml-2 text-primary font-semibold">
                    • Custo: R$ {acessorio.custoTotal.toFixed(2)}
                  </span>
                )}
              </span>
            )}
          </CardTitle>
        </div>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setExpanded(!expanded)}
                className="btn-hover-scale"
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{expanded ? 'Recolher' : 'Expandir'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onDuplicate}
                className="btn-hover-scale"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Duplicar acessório</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onRemove}
                className="btn-hover-scale hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remover acessório</TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4 card-content-animated">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                  <Loader2 className="h-4 w-4 spinner" />
                  Carregando materiais...
                </div>
              ) : (
                <MaterialSelector
                  categoria={'acessorio' as any}
                  materiais={materiais}
                  value={acessorio.materialPrincipalId}
                  onSelect={handleMaterialSelect}
                  placeholder="Selecionar Acessório"
                  optional={false}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`nome-${acessorio.id}`}>Nome/Descrição *</Label>
              <Input
                id={`nome-${acessorio.id}`}
                value={acessorio.nomeIdentificacao}
                onChange={(e) => handleChange('nomeIdentificacao', e.target.value)}
                required
                placeholder="Ex: Argolas, Suporte, Ponteira..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`ambiente-${acessorio.id}`}>Ambiente</Label>
              <Select
                value={acessorio.ambiente || 'none'}
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
              <Label htmlFor={`quantidade-${acessorio.id}`}>Quantidade *</Label>
              <Input
                id={`quantidade-${acessorio.id}`}
                type="number"
                min="1"
                value={acessorio.quantidade}
                onChange={(e) => handleChange('quantidade', parseInt(e.target.value) || 1)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`preco-${acessorio.id}`}>Preço Unitário (R$) *</Label>
              <Input
                id={`preco-${acessorio.id}`}
                type="number"
                step="0.01"
                min="0"
                value={acessorio.precoUnitario || ''}
                onChange={(e) => handleChange('precoUnitario', parseFloat(e.target.value) || 0)}
                required
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={`obs-${acessorio.id}`}>Observações Internas (não aparecem no PDF)</Label>
              <Textarea
                id={`obs-${acessorio.id}`}
                value={acessorio.observacoesInternas || ''}
                onChange={(e) => handleChange('observacoesInternas', e.target.value.slice(0, MAX_OBS_LENGTH))}
                placeholder="Anotações internas sobre este item..."
                className="min-h-[80px]"
                maxLength={MAX_OBS_LENGTH}
              />
              <CharacterCounter current={(acessorio.observacoesInternas || '').length} max={MAX_OBS_LENGTH} />
            </div>

            <div className="space-y-2 flex items-center justify-between md:col-span-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={`instalacao-${acessorio.id}`}>Precisa de Instalação?</Label>
                <Tooltip>
                  <TooltipTrigger><span className="text-muted-foreground text-xs">(i)</span></TooltipTrigger>
                  <TooltipContent>Marque se este item precisa de serviço de instalação</TooltipContent>
                </Tooltip>
              </div>
              <Switch
                id={`instalacao-${acessorio.id}`}
                checked={acessorio.precisaInstalacao}
                onCheckedChange={(checked) => handleChange('precisaInstalacao', checked)}
              />
            </div>

            {acessorio.precisaInstalacao && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`valor-instalacao-${acessorio.id}`}>Valor da Instalação (R$) *</Label>
                <Input
                  id={`valor-instalacao-${acessorio.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={acessorio.valorInstalacao || ''}
                  onChange={(e) =>
                    handleChange('valorInstalacao', parseFloat(e.target.value) || undefined)
                  }
                  required
                  placeholder="0.00"
                />
              </div>
            )}

            {acessorio.precoUnitario && acessorio.quantidade > 0 && (
              <div className="md:col-span-2 p-4 bg-muted rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm">
                    Subtotal: R$ {(acessorio.quantidade * (acessorio.precoUnitario || 0)).toFixed(2)}
                  </p>
                  {acessorio.precisaInstalacao && acessorio.valorInstalacao && (
                    <>
                      <p className="text-sm">
                        Instalação: R$ {acessorio.valorInstalacao.toFixed(2)}
                      </p>
                      <p className="text-sm font-medium border-t pt-1">
                        Total: R$ {((acessorio.quantidade * (acessorio.precoUnitario || 0)) + (acessorio.valorInstalacao || 0)).toFixed(2)}
                      </p>
                    </>
                  )}
                  {!acessorio.precisaInstalacao && (
                    <p className="text-sm font-medium">
                      Total: R$ {(acessorio.quantidade * (acessorio.precoUnitario || 0)).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            type="button"
            onClick={salvarAcessorio}
            disabled={saving}
            className={cn(
              'w-full transition-all duration-200',
              justSaved && 'bg-green-600 hover:bg-green-700'
            )}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 spinner" />
                Salvando...
              </>
            ) : justSaved ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Salvo!
              </>
            ) : (
              'Salvar Acessório'
            )}
          </Button>
        </CardContent>
      )}
    </Card>
    </TooltipProvider>
  );
}
