import { useState } from 'react';
import { Card } from '@/components/ui/card';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, ChevronUp, Trash2, Copy, Loader2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Cortina, Material } from '@/types/orcamento';
import { OPCOES_AMBIENTE } from '@/types/orcamento';
import { MaterialSelector } from './MaterialSelector';
import { CardStatusBadge, getCardStatus, getCardStatusClass } from '@/components/ui/CardStatusBadge';
import { CharacterCounter } from '@/components/ui/CharacterCounter';
import { cn } from '@/lib/utils';
import { useCardState } from '@/hooks/useCardState';

interface PersianaCardProps {
  persiana: Cortina;
  orcamentoId: string;
  materiais: Material[];
  loadingMateriais: boolean;
  onUpdate: (persiana: Cortina) => void;
  onRemove: () => void;
  onDuplicate?: () => void;
}

export function PersianaCard({
  persiana,
  orcamentoId,
  materiais,
  loadingMateriais,
  onUpdate,
  onRemove,
  onDuplicate,
}: PersianaCardProps) {
  const {
    saving, setSaving,
    justSaved,
    expanded, setExpanded,
    hasChanges, setHasChanges,
    cardRef,
    markSaved
  } = useCardState({ initialExpanded: !persiana.id });
  
  const cardStatus = getCardStatus(persiana.id, hasChanges);
  const MAX_OBS_LENGTH = 500;

  const materialSelecionado = materiais.find(m => m.id === persiana.materialPrincipalId);

  const handleChange = (updates: Partial<Cortina>) => {
    setHasChanges(true);
    onUpdate({ ...persiana, ...updates });
  };

  const salvarPersiana = async () => {
    if (!persiana.nomeIdentificacao || !persiana.tipoCortina || !persiana.ambiente || persiana.precoUnitario === undefined || persiana.precoUnitario === null) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios (nome, tipo, ambiente e orçamento fábrica)',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    // custoTotal = orçamento fábrica (preço unitário * quantidade) + instalação
    const custoUnitario = persiana.precoUnitario;
    const custoTotalProduto = custoUnitario * persiana.quantidade;
    const custoInstalacao = persiana.precisaInstalacao && persiana.valorInstalacao 
      ? persiana.valorInstalacao 
      : 0;

    const dados = {
      orcamento_id: orcamentoId,
      nome_identificacao: persiana.nomeIdentificacao,
      tipo_cortina: persiana.tipoCortina,
      tipo_produto: 'persiana',
      ambiente: persiana.ambiente,
      altura: persiana.altura,
      largura: persiana.largura,
      quantidade: persiana.quantidade,
      descricao: persiana.descricao || null,
      fabrica: persiana.fabrica || null,
      motorizada: persiana.motorizada || false,
      preco_unitario: custoUnitario,
      custo_total: custoTotalProduto + custoInstalacao,
      precisa_instalacao: persiana.precisaInstalacao,
      custo_instalacao: custoInstalacao,
      observacoes_internas: persiana.observacoesInternas || null,
      material_principal_id: persiana.materialPrincipalId || null,
      tecido_id: null,
      forro_id: null,
      trilho_id: null,
      custo_tecido: 0,
      custo_forro: 0,
      custo_trilho: 0,
      custo_acessorios: 0,
      custo_costura: 0,
      preco_venda: null,
    };

    try {
      let result;
      if (persiana.id) {
        result = await supabase
          .from('cortina_items')
          .update(dados)
          .eq('id', persiana.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('cortina_items')
          .insert(dados)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      const persianaAtualizada = {
        ...persiana,
        id: result.data.id,
        custoTotal: custoTotalProduto + custoInstalacao,
        custoInstalacao,
      };
      
      onUpdate(persianaAtualizada);
      
      toast({
        title: 'Sucesso',
        description: 'Persiana salva com sucesso!',
      });
      markSaved();
    } catch (error) {
      console.error('Erro ao salvar persiana:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar persiana',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const area = persiana.largura * persiana.altura;

  return (
    <TooltipProvider>
    <Card ref={cardRef} className={cn('p-4 transition-all duration-200', getCardStatusClass(cardStatus))}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {persiana.nomeIdentificacao}
            <CardStatusBadge status={cardStatus} />
            {!expanded && persiana.id && (
              <span className="text-sm text-muted-foreground font-normal">
                • {persiana.tipoCortina} • {area.toFixed(2)}m² ({persiana.largura}x{persiana.altura}m)
                {materialSelecionado && (
                  <span className="ml-2">• {materialSelecionado.nome}</span>
                )}
                {persiana.custoTotal !== undefined && persiana.custoTotal > 0 && (
                  <span className="ml-2 text-primary font-semibold">
                    • Custo: R$ {persiana.custoTotal.toFixed(2)}
                  </span>
                )}
              </span>
            )}
          </h3>
        </div>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
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
          {onDuplicate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDuplicate}
                  className="btn-hover-scale"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Duplicar persiana</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onRemove}
                variant="destructive"
                size="icon"
                className="btn-hover-scale"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remover persiana</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {expanded && (
        <div className="card-content-animated">
          {/* Seção 1 - Identificação Básica */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <Label>Nome/Identificação *</Label>
              <Input
                value={persiana.nomeIdentificacao}
                onChange={(e) => handleChange({ nomeIdentificacao: e.target.value })}
                placeholder="Ex: Persiana Sala"
              />
            </div>
            
            <div>
              <Label>Ambiente *</Label>
              <Select
                value={persiana.ambiente}
                onValueChange={(value) => handleChange({ ambiente: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ambiente" />
                </SelectTrigger>
                <SelectContent>
                  {OPCOES_AMBIENTE.map((amb) => (
                    <SelectItem key={amb} value={amb}>{amb}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label>Descrição</Label>
              <Input
                value={persiana.descricao || ''}
                onChange={(e) => handleChange({ descricao: e.target.value })}
                placeholder="Ex: Persiana com blackout total"
              />
            </div>
          </div>

          {/* Seção 2 - Dimensões */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div>
              <div className="flex items-center gap-1">
                <Label>Largura (m)</Label>
                <Tooltip>
                  <TooltipTrigger><span className="text-muted-foreground text-xs">(i)</span></TooltipTrigger>
                  <TooltipContent>Medida horizontal da persiana em metros</TooltipContent>
                </Tooltip>
              </div>
              <Input
                type="number"
                step="0.01"
                value={persiana.largura}
                onChange={(e) => handleChange({ largura: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <div className="flex items-center gap-1">
                <Label>Altura (m)</Label>
                <Tooltip>
                  <TooltipTrigger><span className="text-muted-foreground text-xs">(i)</span></TooltipTrigger>
                  <TooltipContent>Medida vertical da persiana em metros</TooltipContent>
                </Tooltip>
              </div>
              <Input
                type="number"
                step="0.01"
                value={persiana.altura}
                onChange={(e) => handleChange({ altura: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label>Área (m²)</Label>
              <Input
                type="text"
                value={area.toFixed(2)}
                disabled
                className="bg-muted"
              />
            </div>

            <div>
              <Label>Quantidade</Label>
              <Input
                type="number"
                value={persiana.quantidade}
                onChange={(e) => handleChange({ quantidade: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          {/* Seção 3 - Referência do Produto */}
          <div className="mb-6">
            <Label className="text-base font-medium mb-2 block">Persiana (Referência)</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Selecione a persiana para controle interno. O cálculo é feito pelo orçamento da fábrica.
            </p>
            <MaterialSelector
              categoria="persiana"
              materiais={materiais}
              value={persiana.materialPrincipalId}
              onSelect={(id) => handleChange({ materialPrincipalId: id })}
              placeholder="Selecionar persiana"
              optional={true}
              loading={loadingMateriais}
            />

            <div className="mt-4">
              <Label>Tipo *</Label>
              <Select
                value={persiana.tipoCortina}
                onValueChange={(value: any) => handleChange({ tipoCortina: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                  <SelectItem value="vertical">Vertical</SelectItem>
                  <SelectItem value="rolo">Rolô</SelectItem>
                  <SelectItem value="romana">Romana</SelectItem>
                  <SelectItem value="celular">Celular</SelectItem>
                  <SelectItem value="madeira">Madeira</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Seção 4 - Orçamento e Fábrica */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <Label>Fábrica</Label>
              <Input
                value={persiana.fabrica || ''}
                onChange={(e) => handleChange({ fabrica: e.target.value })}
                placeholder="Ex: Luxaflex, Hunter Douglas"
              />
            </div>

            <div>
              <Label>Orçamento Fábrica por Unidade (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                value={persiana.precoUnitario || ''}
                onChange={(e) => handleChange({ precoUnitario: parseFloat(e.target.value) || 0 })}
                placeholder="Valor unitário da fábrica"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Valor por unidade. {persiana.quantidade > 1 && (
                  <span className="font-medium">
                    Para {persiana.quantidade} un. = R$ {((persiana.precoUnitario || 0) * persiana.quantidade).toFixed(2)}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Seção 5 - Opções Adicionais */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`motorizada-${persiana.id}`}
                checked={persiana.motorizada || false}
                onCheckedChange={(checked) => 
                  handleChange({ motorizada: checked as boolean })
                }
              />
              <Label htmlFor={`motorizada-${persiana.id}`}>Motorizada</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id={`instalacao-${persiana.id}`}
                checked={persiana.precisaInstalacao}
                onCheckedChange={(checked) => 
                  handleChange({ precisaInstalacao: checked as boolean })
                }
              />
              <Label htmlFor={`instalacao-${persiana.id}`}>Precisa de Instalação</Label>
            </div>

            {persiana.precisaInstalacao && (
              <div>
                <Label>Valor da Instalação (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={persiana.valorInstalacao || ''}
                  onChange={(e) => handleChange({ valorInstalacao: parseFloat(e.target.value) || 0 })}
                  placeholder="Valor total da instalação"
                />
              </div>
            )}
          </div>

          {/* Seção 6 - Observações */}
          <div className="mb-6">
            <Label>Observações Internas (não aparecem no PDF)</Label>
            <Textarea
              value={persiana.observacoesInternas || ''}
              onChange={(e) => handleChange({ observacoesInternas: e.target.value.slice(0, MAX_OBS_LENGTH) })}
              placeholder="Anotações internas sobre este item..."
              className="min-h-[80px]"
              maxLength={MAX_OBS_LENGTH}
            />
            <CharacterCounter current={(persiana.observacoesInternas || '').length} max={MAX_OBS_LENGTH} />
          </div>

          {/* Seção 7 - Preview e Ações */}
          <div className="flex justify-between items-center border-t pt-4">
            <div className="text-sm text-muted-foreground">
              {persiana.precoUnitario !== undefined && persiana.precoUnitario > 0 && (
                <>
                  <div>Área: {area.toFixed(2)} m² × {persiana.quantidade} = {(area * persiana.quantidade).toFixed(2)} m² total</div>
                  <div>Orçamento Fábrica: R$ {persiana.precoUnitario.toFixed(2)}</div>
                  {persiana.precisaInstalacao && persiana.valorInstalacao && (
                    <div>Instalação: R$ {persiana.valorInstalacao.toFixed(2)}</div>
                  )}
                  <div className="font-semibold text-foreground">
                    Total: R$ {(persiana.precoUnitario + (persiana.precisaInstalacao && persiana.valorInstalacao ? persiana.valorInstalacao : 0)).toFixed(2)}
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={salvarPersiana} 
                size="sm"
                disabled={saving}
                className={cn(
                  'transition-all duration-200',
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
                  'Salvar Persiana'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
    </TooltipProvider>
  );
}
