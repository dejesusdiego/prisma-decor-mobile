import { useState, useEffect, useCallback } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, Trash2, ChevronDown, ChevronUp, X, Scissors, Loader2, Check, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Cortina, Material, ServicoConfeccao } from '@/types/orcamento';
import { calcularCustosCortina } from '@/lib/calculosOrcamento';
import { OPCOES_AMBIENTE } from '@/types/orcamento';
import { MaterialSelector } from './MaterialSelector';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';
import { CardStatusBadge, getCardStatus, getCardStatusClass } from '@/components/ui/CardStatusBadge';
import { CharacterCounter } from '@/components/ui/CharacterCounter';
import { cn } from '@/lib/utils';
import { useCardState } from '@/hooks/useCardState';
import { useAutoSave } from '@/hooks/useAutoSave';

interface CortinaCardProps {
  cortina: Cortina;
  orcamentoId: string;
  materiais: {
    tecidos: Material[];
    forros: Material[];
    trilhos: Material[];
  };
  loadingMateriais: boolean;
  servicosConfeccao: ServicoConfeccao[];
  onUpdate: (cortina: Cortina) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

export function CortinaCard({
  cortina,
  orcamentoId,
  materiais,
  loadingMateriais,
  servicosConfeccao,
  onUpdate,
  onRemove,
  onDuplicate,
}: CortinaCardProps) {
  // Usar materiais diretamente das props
  const { tecidos, forros, trilhos } = materiais;
  
  const [servicosAdicionaisOpen, setServicosAdicionaisOpen] = useState(false);
  
  const {
    saving, setSaving,
    justSaved,
    expanded, setExpanded,
    hasChanges, setHasChanges,
    cardRef,
    markSaved,
    autoSaved, setAutoSaved
  } = useCardState({ initialExpanded: !cortina.id });
  
  const { configuracoes } = useConfiguracoes();
  const cardStatus = getCardStatus(cortina.id, hasChanges);
  const MAX_OBS_LENGTH = 500;

  // Validação para auto-save
  const isValid = !!(cortina.tecidoId || cortina.forroId) && 
                  !!cortina.tipoCortina && 
                  !!cortina.ambiente;

  // Função de save sem toast para auto-save
  const salvarCortinaInterno = useCallback(async (showToast = true) => {
    setSaving(true);
    try {
      // Validação: pelo menos tecido OU forro deve estar preenchido
      if (!cortina.tecidoId && !cortina.forroId) {
        if (showToast) {
          toast({
            title: 'Atenção',
            description: 'É necessário informar pelo menos o tecido principal ou o forro',
            variant: 'destructive',
          });
        }
        setSaving(false);
        return;
      }

      // Obter serviços configurados para este tipo de cortina
      const servicosConfigurados = configuracoes.servicosPorTipoCortina[cortina.tipoCortina] || [];
      const servicosAdicionais = cortina.servicosAdicionaisIds || [];
      
      // Combinar serviços configurados + adicionais (sem duplicatas)
      const todosServicosIds = [...new Set([...servicosConfigurados, ...servicosAdicionais])];
      
      // Adicionar serviço de forro se tiver forro e houver serviço configurado
      if (cortina.forroId && configuracoes.servicoForroPadrao) {
        if (!todosServicosIds.includes(configuracoes.servicoForroPadrao)) {
          todosServicosIds.push(configuracoes.servicoForroPadrao);
        }
      }

      // Buscar todos os serviços de confecção selecionados
      let servicosParaCalculo: ServicoConfeccao[] = [];
      if (todosServicosIds.length > 0) {
        const { data: servicosData, error: servicosError } = await supabase
          .from('servicos_confeccao')
          .select('*')
          .in('id', todosServicosIds)
          .eq('ativo', true);

        if (servicosError) throw servicosError;
        servicosParaCalculo = servicosData || [];
      }

      // Se não houver serviços configurados, usar o primeiro da lista (já carregada via props)
      if (servicosParaCalculo.length === 0) {
        if (servicosConfeccao.length > 0) {
          servicosParaCalculo = [servicosConfeccao[0]];
        } else {
          if (showToast) {
            toast({
              title: 'Atenção',
              description: 'Nenhum serviço de confecção ativo encontrado. Configure um serviço antes de salvar.',
              variant: 'destructive',
            });
          }
          setSaving(false);
          return;
        }
      }

      // Buscar serviços de instalação do banco de dados
      const { data: instalacaoData, error: instalacaoError } = await supabase
        .from('servicos_instalacao')
        .select('*')
        .eq('ativo', true)
        .limit(1)
        .maybeSingle();

      if (instalacaoError) throw instalacaoError;

      const materiaisSelecionados = [
        cortina.tecidoId ? tecidos.find(t => t.id === cortina.tecidoId || t.codigo_item === cortina.tecidoId) : null,
        cortina.forroId ? forros.find(f => f.id === cortina.forroId || f.codigo_item === cortina.forroId) : null,
        cortina.trilhoId ? trilhos.find(t => t.id === cortina.trilhoId || t.codigo_item === cortina.trilhoId) : null
      ].filter(Boolean);

      // Calcular custo de costura somando todos os serviços (multiplicado pela quantidade)
      const trilho = cortina.trilhoId ? trilhos.find(t => t.id === cortina.trilhoId || t.codigo_item === cortina.trilhoId) : null;
      const comprimentoTrilhoUnitario_m = cortina.largura + 0.1;
      const comprimentoParaCosturaUnitario = trilho ? comprimentoTrilhoUnitario_m : cortina.largura;
      const comprimentoParaCosturaTotal = comprimentoParaCosturaUnitario * cortina.quantidade;
      
      let custoCosturaTotal = 0;
      for (const servico of servicosParaCalculo) {
        custoCosturaTotal += comprimentoParaCosturaTotal * servico.preco_custo;
      }

      // Calcular custos usando o primeiro serviço para estrutura, mas substituir custosCostura
      const custos = calcularCustosCortina(
        cortina,
        materiaisSelecionados as Material[],
        servicosParaCalculo[0],
        instalacaoData
      );

      // Substituir custo de costura pelo total calculado
      custos.custoCostura = custoCosturaTotal;
      custos.custoTotal = custos.custoTecido + custos.custoForro + custos.custoTrilho + custoCosturaTotal + custos.custoInstalacao;

      // Usar valores diretamente - conversão única, sem arredondamentos desnecessários
      const barraCmValue = cortina.barraCm ?? 0;
      const barraForroCmValue = cortina.barraForroCm ?? 0;

      const dadosCortina = {
        orcamento_id: orcamentoId,
        nome_identificacao: cortina.nomeIdentificacao,
        largura: cortina.largura,
        altura: cortina.altura,
        barra_cm: barraCmValue,
        barra_forro_cm: barraForroCmValue,
        quantidade: cortina.quantidade,
        tipo_produto: 'cortina',
        tipo_cortina: cortina.tipoCortina,
        ambiente: cortina.ambiente || null,
        tecido_id: cortina.tecidoId || null,
        forro_id: cortina.forroId || null,
        trilho_id: cortina.trilhoId || null,
        observacoes_internas: cortina.observacoesInternas || null,
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
        preco_venda: 0,
        servicos_adicionais_ids: cortina.servicosAdicionaisIds || [],
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

      if (result.error) {
        throw result.error;
      }

      onUpdate({ ...cortina, id: result.data.id, tipoProduto: 'cortina', ...custos });

      if (showToast) {
        toast({
          title: 'Sucesso',
          description: 'Cortina salva com sucesso',
        });
        markSaved();
      } else {
        setHasChanges(false);
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
      }
    } catch (error: any) {
      console.error('Erro ao salvar cortina:', error);
      if (showToast) {
        toast({
          title: 'Erro',
          description: error.message || 'Não foi possível salvar a cortina',
          variant: 'destructive',
        });
      }
    } finally {
      setSaving(false);
    }
  }, [cortina, orcamentoId, tecidos, forros, trilhos, servicosConfeccao, configuracoes, onUpdate, setSaving, setHasChanges, setAutoSaved, markSaved]);

  // Auto-save hook
  const { isAutoSaving, cancelAutoSave } = useAutoSave({
    enabled: expanded && !!cortina.id,
    delay: 3000,
    onSave: () => salvarCortinaInterno(false),
    hasChanges,
    isValid,
  });

  const salvarCortina = async () => {
    cancelAutoSave();
    await salvarCortinaInterno(true);
  };

  const handleChange = (field: keyof Cortina, value: any) => {
    const novosDados = { ...cortina, [field]: value };
    setHasChanges(true);
    onUpdate(novosDados);
  };

  const toggleServicoAdicional = (servicoId: string) => {
    const atuais = cortina.servicosAdicionaisIds || [];
    if (atuais.includes(servicoId)) {
      handleChange('servicosAdicionaisIds', atuais.filter(id => id !== servicoId));
    } else {
      handleChange('servicosAdicionaisIds', [...atuais, servicoId]);
    }
  };

  const removerServicoAdicional = (servicoId: string) => {
    const atuais = cortina.servicosAdicionaisIds || [];
    handleChange('servicosAdicionaisIds', atuais.filter(id => id !== servicoId));
  };

  const getNomeServico = (servicoId: string) => {
    const servico = servicosConfeccao.find(s => s.id === servicoId);
    return servico ? servico.nome_modelo : 'Desconhecido';
  };

  return (
    <TooltipProvider>
    <Card ref={cardRef} className={cn('transition-all duration-200', getCardStatusClass(cardStatus))}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <CardTitle className="text-lg flex items-center gap-2">
            {cortina.nomeIdentificacao}
            <CardStatusBadge status={cardStatus} />
            {(isAutoSaving || saving) && (
              <Badge variant="secondary" className="animate-pulse">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Salvando...
              </Badge>
            )}
            {autoSaved && !isAutoSaving && !saving && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Check className="h-3 w-3 mr-1" />
                Salvo
              </Badge>
            )}
            {!expanded && cortina.id && (
              <span className="text-sm text-muted-foreground font-normal">
                • {cortina.tipoCortina} • {cortina.largura}x{cortina.altura}m • Qtd: {cortina.quantidade}
                {cortina.custoTotal !== undefined && cortina.custoTotal > 0 && (
                  <span className="ml-2 text-primary font-semibold">
                    • Custo: R$ {cortina.custoTotal.toFixed(2)}
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
            <TooltipContent>Duplicar cortina</TooltipContent>
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
            <TooltipContent>Remover cortina</TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4 card-content-animated">
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
            <Label htmlFor={`ambiente-${cortina.id}`}>Ambiente</Label>
            <Select
              value={cortina.ambiente || 'none'}
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
            <Label htmlFor={`barra-${cortina.id}`}>Barra Tecido (cm)</Label>
            <Input
              id={`barra-${cortina.id}`}
              type="number"
              min="0"
              step="1"
              value={cortina.barraCm ?? ''}
              onChange={(e) => {
                const rawValue = e.target.value;
                const numValue = rawValue === '' ? undefined : Math.round(parseFloat(rawValue));
                handleChange('barraCm', numValue);
              }}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`barra-forro-${cortina.id}`}>Barra Forro (cm)</Label>
            <Input
              id={`barra-forro-${cortina.id}`}
              type="number"
              min="0"
              step="1"
              value={cortina.barraForroCm ?? ''}
              onChange={(e) => {
                const rawValue = e.target.value;
                const numValue = rawValue === '' ? undefined : Math.round(parseFloat(rawValue));
                handleChange('barraForroCm', numValue);
              }}
              placeholder="0"
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
        </div>

        {/* Seleção de materiais */}
        <div className="space-y-4">
          <h4 className="font-medium">Materiais</h4>
          
          <MaterialSelector
            categoria="tecido"
            materiais={tecidos}
            value={cortina.tecidoId}
            onSelect={(id) => handleChange('tecidoId', id)}
            placeholder="Selecionar Tecido Principal"
            optional={true}
            loading={loadingMateriais}
          />

          <MaterialSelector
            categoria="forro"
            materiais={forros}
            value={cortina.forroId}
            onSelect={(id) => handleChange('forroId', id)}
            placeholder="Selecionar Forro (opcional)"
            optional={true}
            loading={loadingMateriais}
          />

          <MaterialSelector
            categoria="trilho"
            materiais={trilhos}
            value={cortina.trilhoId}
            onSelect={(id) => handleChange('trilhoId', id)}
            placeholder="Selecionar Trilho (opcional)"
            optional={true}
            loading={loadingMateriais}
          />
        </div>

        {/* Serviços adicionais */}
        <Collapsible open={servicosAdicionaisOpen} onOpenChange={setServicosAdicionaisOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Scissors className="h-4 w-4" />
                Serviços Adicionais de Confecção
              </span>
              {servicosAdicionaisOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {cortina.servicosAdicionaisIds && cortina.servicosAdicionaisIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {cortina.servicosAdicionaisIds.map((servicoId) => (
                  <Badge key={servicoId} variant="secondary" className="gap-1">
                    {getNomeServico(servicoId)}
                    <button
                      type="button"
                      onClick={() => removerServicoAdicional(servicoId)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {servicosConfeccao.map((servico) => (
                <div key={servico.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`servico-${servico.id}`}
                    checked={cortina.servicosAdicionaisIds?.includes(servico.id)}
                    onCheckedChange={() => toggleServicoAdicional(servico.id)}
                  />
                  <label
                    htmlFor={`servico-${servico.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {servico.nome_modelo} (R$ {servico.preco_custo.toFixed(2)}/m)
                  </label>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Instalação */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <Label htmlFor={`instalacao-${cortina.id}`}>Precisa de instalação?</Label>
            <Switch
              id={`instalacao-${cortina.id}`}
              checked={cortina.precisaInstalacao}
              onCheckedChange={(checked) => handleChange('precisaInstalacao', checked)}
            />
          </div>
          {cortina.precisaInstalacao && (
            <div className="space-y-2">
              <Label htmlFor={`pontos-${cortina.id}`}>Pontos de Instalação</Label>
              <Input
                id={`pontos-${cortina.id}`}
                type="number"
                min="1"
                value={cortina.pontosInstalacao || 1}
                onChange={(e) => handleChange('pontosInstalacao', parseInt(e.target.value) || 1)}
              />
            </div>
          )}
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <Label htmlFor={`obs-${cortina.id}`}>Observações Internas (não aparecem no PDF)</Label>
          <Textarea
            id={`obs-${cortina.id}`}
            value={cortina.observacoesInternas || ''}
            onChange={(e) => handleChange('observacoesInternas', e.target.value.slice(0, MAX_OBS_LENGTH))}
            placeholder="Anotações internas sobre esta cortina..."
            className="min-h-[80px]"
            maxLength={MAX_OBS_LENGTH}
          />
          <CharacterCounter current={(cortina.observacoesInternas || '').length} max={MAX_OBS_LENGTH} />
        </div>

        {/* Preview de custos */}
        {cortina.custoTotal !== undefined && cortina.custoTotal > 0 && (
          <div className="p-4 bg-muted rounded-lg space-y-1">
            <p className="text-sm">Tecido: R$ {(cortina.custoTecido || 0).toFixed(2)}</p>
            <p className="text-sm">Forro: R$ {(cortina.custoForro || 0).toFixed(2)}</p>
            <p className="text-sm">Trilho: R$ {(cortina.custoTrilho || 0).toFixed(2)}</p>
            <p className="text-sm">Costura: R$ {(cortina.custoCostura || 0).toFixed(2)}</p>
            <p className="text-sm">Instalação: R$ {(cortina.custoInstalacao || 0).toFixed(2)}</p>
            <p className="text-sm font-semibold border-t pt-1">Total: R$ {cortina.custoTotal.toFixed(2)}</p>
          </div>
        )}

        {/* Botão salvar */}
        <Button
          type="button"
          onClick={salvarCortina}
          disabled={saving}
          className={cn(
            'w-full transition-all duration-200',
            justSaved && 'bg-green-600 hover:bg-green-700'
          )}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : justSaved ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Salvo!
            </>
          ) : (
            'Salvar Cortina'
          )}
        </Button>
        </CardContent>
      )}
    </Card>
    </TooltipProvider>
  );
}
