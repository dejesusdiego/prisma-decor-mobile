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
import { ChevronDown, ChevronUp, Copy, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Cortina } from '@/types/orcamento';
import { OPCOES_AMBIENTE } from '@/types/orcamento';

interface PersianaCardProps {
  persiana: Cortina;
  orcamentoId: string;
  onUpdate: (persiana: Cortina) => void;
  onRemove: () => void;
}

export function PersianaCard({
  persiana: persianaInicial,
  orcamentoId,
  onUpdate,
  onRemove,
}: PersianaCardProps) {
  const [persiana, setPersiana] = useState<Cortina>(persianaInicial);
  const [expanded, setExpanded] = useState(!persianaInicial.id); // Expandido se for novo item

  const salvarPersiana = async () => {
    if (!persiana.nomeIdentificacao || !persiana.tipoCortina || !persiana.ambiente || !persiana.precoUnitario) {
      toast.error("Preencha todos os campos obrigatórios (nome, tipo, ambiente e valor unitário)");
      return;
    }

    // Calcula custos baseado no preço unitário informado (orçamento da fábrica)
    const custoTotal = persiana.precoUnitario * persiana.quantidade;
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
      preco_unitario: persiana.precoUnitario,
      custo_total: custoTotal,
      precisa_instalacao: persiana.precisaInstalacao,
      custo_instalacao: custoInstalacao,
      observacoes_internas: persiana.observacoesInternas || null,
      // Campos não utilizados em persianas
      tecido_id: null,
      forro_id: null,
      trilho_id: null,
      material_principal_id: null,
      custo_tecido: 0,
      custo_forro: 0,
      custo_trilho: 0,
      custo_acessorios: 0,
      custo_costura: 0,
      preco_venda: 0,
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
        custoTotal,
        custoInstalacao,
      };
      
      setPersiana(persianaAtualizada);
      onUpdate(persianaAtualizada);
      
      toast.success('Persiana salva com sucesso!');
      
      // Colapsar após salvar
      setExpanded(false);
    } catch (error) {
      console.error('Erro ao salvar persiana:', error);
      toast.error('Erro ao salvar persiana');
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {persiana.nomeIdentificacao}
            {!expanded && persiana.id && (
              <span className="text-sm text-muted-foreground font-normal">
                • {persiana.tipoCortina} • {persiana.largura}x{persiana.altura}m
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? "Recolher" : "Expandir"}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button
            onClick={onRemove}
            variant="destructive"
            size="icon"
            title="Remover"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {expanded && (
        <>
        <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Nome/Identificação *</Label>
          <Input
            value={persiana.nomeIdentificacao}
            onChange={(e) => setPersiana({ ...persiana, nomeIdentificacao: e.target.value })}
            placeholder="Ex: Persiana Sala"
          />
        </div>
        
        <div>
          <Label>Tipo *</Label>
          <Select
            value={persiana.tipoCortina}
            onValueChange={(value: any) => setPersiana({ ...persiana, tipoCortina: value })}
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

        <div>
          <Label>Ambiente *</Label>
          <Select
            value={persiana.ambiente}
            onValueChange={(value) => setPersiana({ ...persiana, ambiente: value })}
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

        <div>
          <Label>Altura (m)</Label>
          <Input
            type="number"
            step="0.01"
            value={persiana.altura}
            onChange={(e) => setPersiana({ ...persiana, altura: parseFloat(e.target.value) || 0 })}
          />
        </div>

        <div>
          <Label>Largura (m)</Label>
          <Input
            type="number"
            step="0.01"
            value={persiana.largura}
            onChange={(e) => setPersiana({ ...persiana, largura: parseFloat(e.target.value) || 0 })}
          />
        </div>

        <div>
          <Label>Quantidade</Label>
          <Input
            type="number"
            value={persiana.quantidade}
            onChange={(e) => setPersiana({ ...persiana, quantidade: parseInt(e.target.value) || 1 })}
          />
        </div>

        <div className="col-span-2">
          <Label>Descrição</Label>
          <Input
            value={persiana.descricao || ''}
            onChange={(e) => setPersiana({ ...persiana, descricao: e.target.value })}
            placeholder="Ex: Persiana com blackout total"
          />
        </div>

        <div>
          <Label>Fábrica</Label>
          <Input
            value={persiana.fabrica || ''}
            onChange={(e) => setPersiana({ ...persiana, fabrica: e.target.value })}
            placeholder="Ex: Luxaflex, Hunter Douglas"
          />
        </div>

        <div>
          <Label>Valor Unitário (R$) *</Label>
          <Input
            type="number"
            step="0.01"
            value={persiana.precoUnitario || ''}
            onChange={(e) => setPersiana({ ...persiana, precoUnitario: parseFloat(e.target.value) || 0 })}
            placeholder="Valor do orçamento da fábrica"
          />
        </div>

        <div className="col-span-2">
          <Label>Observações Internas (não aparecem no PDF)</Label>
          <Textarea
            value={persiana.observacoesInternas || ''}
            onChange={(e) => setPersiana({ ...persiana, observacoesInternas: e.target.value })}
            placeholder="Anotações internas sobre este item..."
            className="min-h-[80px]"
          />
        </div>

        <div className="col-span-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`motorizada-${persiana.id}`}
              checked={persiana.motorizada || false}
              onCheckedChange={(checked) => 
                setPersiana({ ...persiana, motorizada: checked as boolean })
              }
            />
            <Label htmlFor={`motorizada-${persiana.id}`}>Motorizada</Label>
          </div>
        </div>

        <div className="col-span-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`instalacao-${persiana.id}`}
              checked={persiana.precisaInstalacao}
              onCheckedChange={(checked) => 
                setPersiana({ ...persiana, precisaInstalacao: checked as boolean })
              }
            />
            <Label htmlFor={`instalacao-${persiana.id}`}>Precisa de Instalação</Label>
          </div>
        </div>

        {persiana.precisaInstalacao && (
          <div>
            <Label>Valor da Instalação (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={persiana.valorInstalacao || ''}
              onChange={(e) => setPersiana({ ...persiana, valorInstalacao: parseFloat(e.target.value) || 0 })}
              placeholder="Valor total da instalação"
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {persiana.precoUnitario && (
            <>
              <div>Subtotal: R$ {(persiana.precoUnitario * persiana.quantidade).toFixed(2)}</div>
              {persiana.precisaInstalacao && persiana.valorInstalacao && (
                <>
                  <div>Instalação: R$ {persiana.valorInstalacao.toFixed(2)}</div>
                  <div className="font-semibold">Total: R$ {((persiana.precoUnitario * persiana.quantidade) + persiana.valorInstalacao).toFixed(2)}</div>
                </>
              )}
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={salvarPersiana} size="sm">
            Salvar Persiana
          </Button>
          <Button 
            onClick={onRemove} 
            variant="destructive" 
            size="sm"
          >
            Remover
          </Button>
        </div>
        </div>
        </>
      )}
    </Card>
  );
}
