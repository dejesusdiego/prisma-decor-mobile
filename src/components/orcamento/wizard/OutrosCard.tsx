import { useState } from 'react';
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
import type { Cortina } from '@/types/orcamento';
import { OPCOES_AMBIENTE } from '@/types/orcamento';

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
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof Cortina, value: any) => {
    const novosDados = { ...outro, [field]: value };
    onUpdate(novosDados);
  };

  const salvarOutro = async () => {
    setSaving(true);
    try {
      if (!outro.nomeIdentificacao || !outro.quantidade || !outro.precoUnitario) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      const custoInstalacao = outro.precisaInstalacao ? (outro.valorInstalacao || 0) : 0;
      const custoTotal = (outro.quantidade * (outro.precoUnitario || 0)) + custoInstalacao;

      const dadosOutro = {
        orcamento_id: orcamentoId,
        nome_identificacao: outro.nomeIdentificacao,
        largura: 0,
        altura: 0,
        quantidade: outro.quantidade,
        tipo_produto: 'outro',
        tipo_cortina: 'outro',
        ambiente: outro.ambiente || null,
        preco_unitario: outro.precoUnitario,
        is_outro: true,
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

      toast({
        title: 'Sucesso',
        description: 'Item salvo com sucesso',
      });
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o item',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">{outro.nomeIdentificacao}</CardTitle>
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
            <Label htmlFor={`nome-${outro.id}`}>Nome/Descrição *</Label>
            <Input
              id={`nome-${outro.id}`}
              value={outro.nomeIdentificacao}
              onChange={(e) => handleChange('nomeIdentificacao', e.target.value)}
              required
              placeholder="Ex: Motorização, Serviço adicional..."
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

          <div className="space-y-2 flex items-center justify-between md:col-span-2">
            <Label htmlFor={`instalacao-${outro.id}`}>Precisa de Instalação?</Label>
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
                  handleChange('valorInstalacao', parseFloat(e.target.value) || 0)
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
          className="w-full"
        >
          {saving ? 'Salvando...' : 'Salvar Item'}
        </Button>
      </CardContent>
    </Card>
  );
}
