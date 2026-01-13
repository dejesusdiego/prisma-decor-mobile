import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

interface ServicoConfeccao {
  id: string;
  codigo_item: string | null;
  nome_modelo: string;
  unidade: string;
  preco_custo: number;
  preco_tabela: number;
  ativo: boolean;
}

interface DialogServicoConfeccaoProps {
  aberto: boolean;
  servico: ServicoConfeccao | null;
  onClose: (sucesso?: boolean) => void;
}

export function DialogServicoConfeccao({ aberto, servico, onClose }: DialogServicoConfeccaoProps) {
  const { organizationId } = useOrganizationContext();
  const [salvando, setSalvando] = useState(false);
  const [formData, setFormData] = useState({
    codigo_item: '',
    nome_modelo: '',
    unidade: 'mt',
    preco_custo: '',
    margem_percent: '55',
  });

  useEffect(() => {
    if (servico) {
      const margemPercent = servico.preco_tabela > 0 && servico.preco_custo > 0
        ? ((servico.preco_tabela / servico.preco_custo - 1) * 100).toFixed(1)
        : '55';

      setFormData({
        codigo_item: servico.codigo_item || '',
        nome_modelo: servico.nome_modelo,
        unidade: servico.unidade,
        preco_custo: servico.preco_custo.toString(),
        margem_percent: margemPercent,
      });
    } else {
      setFormData({
        codigo_item: '',
        nome_modelo: '',
        unidade: 'mt',
        preco_custo: '',
        margem_percent: '55',
      });
    }
  }, [servico, aberto]);

  const calcularPrecoTabela = () => {
    const custo = parseFloat(formData.preco_custo);
    const margem = parseFloat(formData.margem_percent);
    if (isNaN(custo) || isNaN(margem)) return 0;
    return custo * (1 + margem / 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    try {
      const servicoData = {
        codigo_item: formData.codigo_item || null,
        nome_modelo: formData.nome_modelo,
        unidade: formData.unidade,
        preco_custo: parseFloat(formData.preco_custo),
        preco_tabela: calcularPrecoTabela(),
        margem_tabela_percent: parseFloat(formData.margem_percent),
        ativo: true,
      };

      if (servico) {
        const { error } = await supabase
          .from('servicos_confeccao')
          .update(servicoData)
          .eq('id', servico.id);

        if (error) throw error;
        toast({ title: 'Serviço atualizado', description: 'O serviço foi atualizado com sucesso' });
      } else {
        const { error } = await supabase.from('servicos_confeccao').insert({
          ...servicoData,
          organization_id: organizationId,
        });
        if (error) throw error;
        toast({ title: 'Serviço criado', description: 'O novo serviço foi criado com sucesso' });
      }

      onClose(true);
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
      toast({ title: 'Erro ao salvar serviço', variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{servico ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
          <DialogDescription>
            {servico ? 'Edite as informações do serviço' : 'Preencha os dados do novo serviço'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo_item">Código (opcional)</Label>
              <Input
                id="codigo_item"
                value={formData.codigo_item}
                onChange={(e) => setFormData({ ...formData, codigo_item: e.target.value })}
                placeholder="Ex: CONF-WAVE-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade</Label>
              <Select
                value={formData.unidade}
                onValueChange={(value) => setFormData({ ...formData, unidade: value })}
              >
                <SelectTrigger id="unidade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mt">Metro (mt)</SelectItem>
                  <SelectItem value="un">Unidade (un)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome_modelo">Nome do Modelo</Label>
            <Input
              id="nome_modelo"
              value={formData.nome_modelo}
              onChange={(e) => setFormData({ ...formData, nome_modelo: e.target.value })}
              placeholder="Ex: Cortina Wave"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preco_custo">Preço Custo (R$)</Label>
              <Input
                id="preco_custo"
                type="number"
                step="0.01"
                value={formData.preco_custo}
                onChange={(e) => setFormData({ ...formData, preco_custo: e.target.value })}
                placeholder="Ex: 25.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="margem_percent">Margem (%)</Label>
              <Input
                id="margem_percent"
                type="number"
                step="0.1"
                value={formData.margem_percent}
                onChange={(e) => setFormData({ ...formData, margem_percent: e.target.value })}
                placeholder="Ex: 55"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Preço Tabela (R$)</Label>
              <Input value={calcularPrecoTabela().toFixed(2)} disabled className="bg-muted" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()}>Cancelar</Button>
            <Button type="submit" disabled={salvando}>
              {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {servico ? 'Atualizar' : 'Criar'} Serviço
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
