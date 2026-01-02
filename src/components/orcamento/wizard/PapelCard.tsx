import { useState, useEffect, useMemo } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Copy, Trash2, ChevronDown, ChevronUp, RefreshCw, AlertTriangle, Info, Check, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Cortina, Material } from '@/types/orcamento';
import { OPCOES_AMBIENTE } from '@/types/orcamento';
import { MaterialSelector } from './MaterialSelector';
import { fetchMateriaisPaginados } from '@/lib/fetchMateriaisPaginados';
import { CardStatusBadge, getCardStatus, getCardStatusClass } from '@/components/ui/CardStatusBadge';
import { CharacterCounter } from '@/components/ui/CharacterCounter';
import { useCardState } from '@/hooks/useCardState';

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
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(false);

  // Campos adicionais para cálculo
  const [larguraParede, setLarguraParede] = useState<number>(papel.largura || 0);
  const [alturaParede, setAlturaParede] = useState<number>(papel.altura || 0);
  const [coberturaPorRolo, setCoberturaPorRolo] = useState<number>(5);
  const [perdaPercent, setPerdaPercent] = useState<number>(10);

  const {
    saving, setSaving,
    justSaved,
    expanded, setExpanded,
    hasChanges, setHasChanges,
    cardRef,
    markSaved
  } = useCardState({ initialExpanded: !papel.id });

  const cardStatus = getCardStatus(papel.id, hasChanges);

  const carregarMateriais = async () => {
    setLoading(true);
    try {
      const materiaisList = await fetchMateriaisPaginados('papel', true);
      setMateriais(materiaisList);
    } catch (error) {
      console.error('Erro ao carregar materiais de papel:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
            fornecedor: data.fornecedor || undefined,
          });
          if (data.perda_percent) {
            setPerdaPercent(data.perda_percent);
          }
        }
      }
    };
    carregarMaterial();
  }, [papel.materialPrincipalId]);

  useEffect(() => {
    if (papel.largura) setLarguraParede(papel.largura);
    if (papel.altura) setAlturaParede(papel.altura);
  }, [papel.largura, papel.altura]);

  const areaTotal = useMemo(() => {
    return larguraParede * alturaParede;
  }, [larguraParede, alturaParede]);

  const rolosSugeridos = useMemo(() => {
    if (areaTotal <= 0 || coberturaPorRolo <= 0) return 0;
    const areaComPerda = areaTotal * (1 + perdaPercent / 100);
    return Math.ceil(areaComPerda / coberturaPorRolo);
  }, [areaTotal, coberturaPorRolo, perdaPercent]);

  const custoMaterial = useMemo(() => {
    return papel.quantidade * (papel.precoUnitario || 0);
  }, [papel.quantidade, papel.precoUnitario]);

  const custoInstalacao = useMemo(() => {
    return papel.precisaInstalacao ? (papel.valorInstalacao || 0) : 0;
  }, [papel.precisaInstalacao, papel.valorInstalacao]);

  const custoTotal = useMemo(() => {
    return custoMaterial + custoInstalacao;
  }, [custoMaterial, custoInstalacao]);

  const handleChange = (field: keyof Cortina, value: any) => {
    setHasChanges(true);
    const novosDados = { ...papel, [field]: value };
    onUpdate(novosDados);
  };

  const handleDimensaoChange = (field: 'largura' | 'altura', value: number) => {
    setHasChanges(true);
    if (field === 'largura') {
      setLarguraParede(value);
      handleChange('largura', value);
    } else {
      setAlturaParede(value);
      handleChange('altura', value);
    }
  };

  const handleMaterialSelect = (materialId: string | undefined) => {
    setHasChanges(true);
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

  const aplicarQuantidadeSugerida = () => {
    if (rolosSugeridos > 0) {
      handleChange('quantidade', rolosSugeridos);
    }
  };

  const salvarPapel = async () => {
    setSaving(true);
    try {
      if (!papel.nomeIdentificacao || !papel.quantidade || !papel.materialPrincipalId) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      const dadosPapel = {
        orcamento_id: orcamentoId,
        nome_identificacao: papel.nomeIdentificacao,
        descricao: 'Papel',
        largura: larguraParede,
        altura: alturaParede,
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

      onUpdate({ 
        ...papel, 
        id: result.data.id, 
        custoInstalacao, 
        custoTotal,
        largura: larguraParede,
        altura: alturaParede,
      });

      toast({
        title: 'Sucesso',
        description: 'Papel de parede salvo com sucesso',
      });

      markSaved();
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

  const quantidadeMenorQueSugerido = rolosSugeridos > 0 && papel.quantidade < rolosSugeridos;

  return (
    <TooltipProvider>
      <Card ref={cardRef} className={`transition-all duration-200 ${getCardStatusClass(cardStatus)}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
              <CardStatusBadge status={cardStatus} />
              {papel.nomeIdentificacao}
              {!expanded && papel.id && (
                <span className="text-sm text-muted-foreground font-normal flex items-center gap-2 flex-wrap">
                  {larguraParede > 0 && alturaParede > 0 && (
                    <Badge variant="outline" className="font-normal">
                      {larguraParede.toFixed(1)}m × {alturaParede.toFixed(1)}m = {areaTotal.toFixed(2)}m²
                    </Badge>
                  )}
                  <Badge variant="secondary" className="font-normal">
                    {papel.quantidade} {papel.quantidade === 1 ? 'rolo' : 'rolos'}
                  </Badge>
                  {material && (
                    <span className="text-xs">{material.nome}</span>
                  )}
                  {custoTotal > 0 && (
                    <Badge className="font-semibold">
                      R$ {custoTotal.toFixed(2)}
                    </Badge>
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
              <TooltipContent>
                <p>{expanded ? 'Recolher' : 'Expandir'}</p>
              </TooltipContent>
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
              <TooltipContent>
                <p>Duplicar este papel</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onRemove}
                  className="btn-hover-scale"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remover papel de parede</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        {expanded && (
          <CardContent className="space-y-6 card-content-animated">
            {/* Seção 1: Material */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">1. Material</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={carregarMateriais}
                  disabled={loading}
                  className="h-8 btn-hover-scale"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Recarregar
                </Button>
              </div>
              <MaterialSelector
                categoria="papel"
                materiais={materiais}
                value={papel.materialPrincipalId}
                onSelect={handleMaterialSelect}
                placeholder="Selecionar Papel de Parede"
                optional={false}
                loading={loading}
              />
              {material && (
                <div className="p-3 bg-muted/50 rounded-lg border text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{material.nome}</span>
                    {material.fornecedor && (
                      <Badge variant="outline" className="text-xs">{material.fornecedor}</Badge>
                    )}
                  </div>
                  <div className="flex gap-4 text-muted-foreground text-xs">
                    {material.codigo_item && <span>Código: {material.codigo_item}</span>}
                    <span>Custo: R$ {material.preco_custo.toFixed(2)}/rolo</span>
                    {material.largura_metro && <span>Largura: {material.largura_metro}m</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Seção 2: Identificação */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">2. Identificação</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`nome-${papel.id}`} className="field-required">Nome/Descrição</Label>
                  <Input
                    id={`nome-${papel.id}`}
                    value={papel.nomeIdentificacao}
                    onChange={(e) => handleChange('nomeIdentificacao', e.target.value)}
                    required
                    placeholder="Ex: Papel Sala, Papel Quarto..."
                    className="input-focus-accent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`ambiente-${papel.id}`}>Ambiente</Label>
                  <Select
                    value={papel.ambiente || 'none'}
                    onValueChange={(value) => handleChange('ambiente', value === 'none' ? undefined : value)}
                  >
                    <SelectTrigger className="input-focus-accent">
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
              </div>
            </div>

            {/* Seção 3: Dimensões da Parede */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-muted-foreground">3. Dimensões da Parede</h4>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Informe as dimensões da parede para calcular a quantidade de rolos necessária</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`largura-${papel.id}`}>Largura (m)</Label>
                  <Input
                    id={`largura-${papel.id}`}
                    type="number"
                    step="0.1"
                    min="0"
                    value={larguraParede || ''}
                    onChange={(e) => handleDimensaoChange('largura', parseFloat(e.target.value) || 0)}
                    placeholder="0.0"
                    className="input-focus-accent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`altura-${papel.id}`}>Altura (m)</Label>
                  <Input
                    id={`altura-${papel.id}`}
                    type="number"
                    step="0.1"
                    min="0"
                    value={alturaParede || ''}
                    onChange={(e) => handleDimensaoChange('altura', parseFloat(e.target.value) || 0)}
                    placeholder="0.0"
                    className="input-focus-accent"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Área Total</Label>
                  <Input
                    value={areaTotal > 0 ? `${areaTotal.toFixed(2)} m²` : '-'}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`perda-${papel.id}`}>Perda (%)</Label>
                  <Input
                    id={`perda-${papel.id}`}
                    type="number"
                    step="1"
                    min="0"
                    max="50"
                    value={perdaPercent}
                    onChange={(e) => {
                      setHasChanges(true);
                      setPerdaPercent(parseFloat(e.target.value) || 0);
                    }}
                    className="input-focus-accent"
                  />
                </div>
              </div>
            </div>

            {/* Seção 4: Quantidade e Preço */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">4. Quantidade e Preço</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`cobertura-${papel.id}`}>Cobertura por Rolo (m²)</Label>
                  <Input
                    id={`cobertura-${papel.id}`}
                    type="number"
                    step="0.5"
                    min="0.1"
                    value={coberturaPorRolo}
                    onChange={(e) => {
                      setHasChanges(true);
                      setCoberturaPorRolo(parseFloat(e.target.value) || 5);
                    }}
                    className="input-focus-accent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`quantidade-${papel.id}`} className="field-required">Quantidade (rolos)</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`quantidade-${papel.id}`}
                      type="number"
                      min="1"
                      step="1"
                      value={papel.quantidade}
                      onChange={(e) => handleChange('quantidade', parseInt(e.target.value) || 1)}
                      required
                      className={`input-focus-accent ${quantidadeMenorQueSugerido ? 'border-amber-500' : ''}`}
                    />
                    {rolosSugeridos > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={aplicarQuantidadeSugerida}
                            className="whitespace-nowrap btn-hover-scale"
                          >
                            Sugerido: {rolosSugeridos}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Clique para aplicar a quantidade calculada com base na área e perda</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {quantidadeMenorQueSugerido && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Quantidade menor que o sugerido ({rolosSugeridos} rolos)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`preco-${papel.id}`} className="field-required">Preço por Rolo (R$)</Label>
                  <Input
                    id={`preco-${papel.id}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={papel.precoUnitario || ''}
                    onChange={(e) => handleChange('precoUnitario', parseFloat(e.target.value) || 0)}
                    required
                    placeholder="0.00"
                    className="input-focus-accent"
                  />
                </div>
              </div>
            </div>

            {/* Seção 5: Instalação */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">5. Instalação</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`instalacao-${papel.id}`}
                    checked={papel.precisaInstalacao}
                    onCheckedChange={(checked) => handleChange('precisaInstalacao', checked)}
                  />
                  <Label htmlFor={`instalacao-${papel.id}`} className="cursor-pointer">
                    Precisa de Instalação
                  </Label>
                </div>

                {papel.precisaInstalacao && (
                  <div className="space-y-2">
                    <Label htmlFor={`valor-instalacao-${papel.id}`} className="field-required">Valor da Instalação (R$)</Label>
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
                      className="input-focus-accent"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Seção 6: Observações */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">6. Observações Internas</h4>
                <CharacterCounter current={papel.observacoesInternas?.length || 0} max={500} />
              </div>
              <Textarea
                id={`obs-${papel.id}`}
                value={papel.observacoesInternas || ''}
                onChange={(e) => handleChange('observacoesInternas', e.target.value)}
                placeholder="Anotações internas sobre este item (não aparecem no PDF)..."
                className="min-h-[80px] input-focus-accent"
                maxLength={500}
              />
            </div>

            {/* Resumo de Custos */}
            {(papel.precoUnitario && papel.quantidade > 0) && (
              <div className="p-4 bg-muted rounded-lg border space-y-3">
                <h4 className="text-sm font-medium">Resumo de Custos</h4>
                
                <div className="space-y-2 text-sm">
                  {areaTotal > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Área da parede:</span>
                      <span>{areaTotal.toFixed(2)} m²</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-muted-foreground">
                    <span>Material ({papel.quantidade} {papel.quantidade === 1 ? 'rolo' : 'rolos'} × R$ {(papel.precoUnitario || 0).toFixed(2)}):</span>
                    <span>R$ {custoMaterial.toFixed(2)}</span>
                  </div>

                  {areaTotal > 0 && perdaPercent > 0 && (
                    <div className="flex justify-between text-muted-foreground text-xs">
                      <span>Perda considerada:</span>
                      <span>{perdaPercent}%</span>
                    </div>
                  )}

                  {papel.precisaInstalacao && custoInstalacao > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Instalação:</span>
                      <span>R$ {custoInstalacao.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-primary">R$ {custoTotal.toFixed(2)}</span>
                  </div>
                </div>

                {material?.fornecedor && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Fornecedor: {material.fornecedor}
                  </div>
                )}
              </div>
            )}

            <Button
              type="button"
              onClick={salvarPapel}
              disabled={saving}
              className="w-full btn-hover-scale"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : justSaved ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Salvo!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Papel de Parede
                </>
              )}
            </Button>
          </CardContent>
        )}
      </Card>
    </TooltipProvider>
  );
}
