import { useCallback } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, Trash2, ChevronDown, ChevronUp, Loader2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Cortina } from '@/types/orcamento';
import { OPCOES_AMBIENTE } from '@/types/orcamento';
import { CardStatusBadge, getCardStatus, getCardStatusClass } from '@/components/ui/CardStatusBadge';
import { CharacterCounter } from '@/components/ui/CharacterCounter';
import { cn } from '@/lib/utils';
import { useCardState } from '@/hooks/useCardState';
import { useAutoSave } from '@/hooks/useAutoSave';

interface OutrosCardProps {
  outro: Cortina;
  orcamentoId: string;
  onUpdate: (outro: Cortina) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

export function OutrosCard({
  outro,
  orcamentoId,
  onUpdate,
  onRemove,
  onDuplicate,
}: OutrosCardProps) {
  const {
    saving, setSaving,
    justSaved,
    expanded, setExpanded,
    hasChanges, setHasChanges,
    cardRef,
    markSaved,
    autoSaved, setAutoSaved
  } = useCardState({ initialExpanded: !outro.id });
  
  const cardStatus = getCardStatus(outro.id, hasChanges);
  const MAX_OBS_LENGTH = 500;

  const handleChange = (field: keyof Cortina, value: any) => {
    const novosDados = { ...outro, [field]: value };
    setHasChanges(true);
    onUpdate(novosDados);
  };

  // Validação para auto-save
  const isValid = !!outro.nomeIdentificacao && 
                  !!outro.quantidade && 
                  !!outro.precoUnitario && 
                  outro.precoUnitario > 0;

  const salvarOutroInterno = useCallback(async (showToast = true) => {
    setSaving(true);
    try {
      if (!isValid) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      const custoInstalacao = outro.precisaInstalacao ? (outro.valorInstalacao || 0) : 0;
      const custoTotal = (outro.quantidade * (outro.precoUnitario || 0)) + custoInstalacao;

      const dadosOutro = {
        orcamento_id: orcamentoId,
        nome_identificacao: outro.nomeIdentificacao,
        descricao: 'Outros',
        largura: 0,
        altura: 0,
        quantidade: outro.quantidade,
        tipo_produto: 'outro',
        tipo_cortina: 'outro',
        ambiente: outro.ambiente || null,
        preco_unitario: outro.precoUnitario,
        is_outro: true,
        observacoes_internas: outro.observacoesInternas || null,
        tecido_id: null,
        forro_id: null,
        trilho_id: null,
        material_principal_id: null,
        precisa_instalacao: outro.precisaInstalacao,
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
      if (outro.id) {
        result = await supabase
          .from('cortina_items')
          .update(dadosOutro)
          .eq('id', outro.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('cortina_items')
          .insert(dadosOutro)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      onUpdate({ ...outro, id: result.data.id, custoInstalacao, custoTotal });

      if (showToast) {
        toast({
          title: 'Sucesso',
          description: 'Item salvo com sucesso',
        });
        markSaved();
      } else {
        setHasChanges(false);
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
      }
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      if (showToast) {
        toast({
          title: 'Erro',
          description: 'Não foi possível salvar o item',
          variant: 'destructive',
        });
      }
    } finally {
      setSaving(false);
    }
  }, [isValid, outro, orcamentoId, onUpdate, setSaving, setHasChanges, setAutoSaved, markSaved]);

  // Auto-save hook
  const { isAutoSaving, cancelAutoSave } = useAutoSave({
    enabled: expanded && !!outro.id,
    delay: 3000,
    onSave: () => salvarOutroInterno(false),
    hasChanges,
    isValid,
  });

  const salvarOutro = async () => {
    cancelAutoSave();
    await salvarOutroInterno(true);
  };

  return (
    <TooltipProvider>
    <Card ref={cardRef} className={cn('transition-all duration-200', getCardStatusClass(cardStatus))}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <CardTitle className="text-lg flex items-center gap-2">
            {outro.nomeIdentificacao}
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
            {!expanded && outro.id && (
              <span className="text-sm text-muted-foreground font-normal">
                • Qtd: {outro.quantidade}
                {outro.custoTotal !== undefined && outro.custoTotal > 0 && (
                  <span className="ml-2 text-primary font-semibold">
                    • Custo: R$ {outro.custoTotal.toFixed(2)}
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
            <TooltipContent>Duplicar item</TooltipContent>
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
            <TooltipContent>Remover item</TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4 card-content-animated">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`nome-${outro.id}`}>Nome/Descrição *</Label>
            <Input
              id={`nome-${outro.id}`}
              value={outro.nomeIdentificacao}
              onChange={(e) => handleChange('nomeIdentificacao', e.target.value)}
              required
              placeholder="Ex: Serviço adicional, Mão de obra..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`ambiente-${outro.id}`}>Ambiente</Label>
            <Select
              value={outro.ambiente || 'none'}
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

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`descricao-${outro.id}`}>Descrição</Label>
            <Input
              id={`descricao-${outro.id}`}
              value={outro.descricao || ''}
              onChange={(e) => handleChange('descricao', e.target.value)}
              placeholder="Descrição detalhada do item..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`quantidade-${outro.id}`}>Quantidade *</Label>
            <Input
              id={`quantidade-${outro.id}`}
              type="number"
              min="1"
              value={outro.quantidade}
              onChange={(e) => handleChange('quantidade', parseInt(e.target.value) || 1)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`preco-${outro.id}`}>Preço Unitário (R$) *</Label>
            <Input
              id={`preco-${outro.id}`}
              type="number"
              step="0.01"
              min="0"
              value={outro.precoUnitario || ''}
              onChange={(e) => handleChange('precoUnitario', parseFloat(e.target.value) || 0)}
              required
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`obs-${outro.id}`}>Observações Internas (não aparecem no PDF)</Label>
            <Textarea
              id={`obs-${outro.id}`}
              value={outro.observacoesInternas || ''}
              onChange={(e) => handleChange('observacoesInternas', e.target.value.slice(0, MAX_OBS_LENGTH))}
              placeholder="Anotações internas sobre este item..."
              className="min-h-[80px]"
              maxLength={MAX_OBS_LENGTH}
            />
            <CharacterCounter current={(outro.observacoesInternas || '').length} max={MAX_OBS_LENGTH} />
          </div>

          <div className="space-y-2 flex items-center justify-between md:col-span-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={`instalacao-${outro.id}`}>Precisa de Instalação?</Label>
              <Tooltip>
                <TooltipTrigger><span className="text-muted-foreground text-xs">(i)</span></TooltipTrigger>
                <TooltipContent>Marque se este item precisa de serviço de instalação</TooltipContent>
              </Tooltip>
            </div>
            <Switch
              id={`instalacao-${outro.id}`}
              checked={outro.precisaInstalacao}
              onCheckedChange={(checked) => handleChange('precisaInstalacao', checked)}
            />
          </div>

          {outro.precisaInstalacao && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={`valor-instalacao-${outro.id}`}>Valor da Instalação (R$) *</Label>
              <Input
                id={`valor-instalacao-${outro.id}`}
                type="number"
                step="0.01"
                min="0"
                value={outro.valorInstalacao || ''}
                onChange={(e) =>
                  handleChange('valorInstalacao', parseFloat(e.target.value) || undefined)
                }
                required
                placeholder="0.00"
              />
            </div>
          )}

          {outro.precoUnitario && outro.quantidade > 0 && (
            <div className="md:col-span-2 p-4 bg-muted rounded-lg">
              <div className="space-y-1">
                <p className="text-sm">
                  Subtotal: R$ {(outro.quantidade * (outro.precoUnitario || 0)).toFixed(2)}
                </p>
                {outro.precisaInstalacao && outro.valorInstalacao && (
                  <>
                    <p className="text-sm">
                      Instalação: R$ {outro.valorInstalacao.toFixed(2)}
                    </p>
                    <p className="text-sm font-medium border-t pt-1">
                      Total: R$ {((outro.quantidade * (outro.precoUnitario || 0)) + (outro.valorInstalacao || 0)).toFixed(2)}
                    </p>
                  </>
                )}
                {!outro.precisaInstalacao && (
                  <p className="text-sm font-medium">
                    Total: R$ {(outro.quantidade * (outro.precoUnitario || 0)).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <Button
          type="button"
          onClick={salvarOutro}
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
            'Salvar Item'
          )}
        </Button>
        </CardContent>
      )}
    </Card>
    </TooltipProvider>
  );
}
