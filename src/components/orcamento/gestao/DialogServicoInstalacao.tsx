import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ServicoInstalacao {
  id: string;
  codigo_item: string | null;
  nome: string;
  preco_custo_por_ponto: number;
  preco_tabela_por_ponto: number;
  ativo: boolean;
}

interface DialogServicoInstalacaoProps {
  aberto: boolean;
  servico: ServicoInstalacao | null;
  onClose: (sucesso?: boolean) => void;
}

export function DialogServicoInstalacao({ aberto, servico, onClose }: DialogServicoInstalacaoProps) {
  const [salvando, setSalvando] = useState(false);
  const [formData, setFormData] = useState({
    codigo_item: '',
    nome: '',
    preco_custo_por_ponto: '',
    margem_percent: '61.5',
  });

  useEffect(() => {
    if (servico) {
      const margemPercent = servico.preco_tabela_por_ponto > 0 && servico.preco_custo_por_ponto > 0
        ? ((servico.preco_tabela_por_ponto / servico.preco_custo_por_ponto - 1) * 100).toFixed(1)
        : '61.5';

      setFormData({
        codigo_item: servico.codigo_item || '',
        nome: servico.nome,
        preco_custo_por_ponto: servico.preco_custo_por_ponto.toString(),
        margem_percent: margemPercent,
      });
    } else {
      setFormData({
        codigo_item: '',
        nome: '',
        preco_custo_por_ponto: '',
        margem_percent: '61.5',
      });
    }
  }, [servico, aberto]);

  const calcularPrecoTabela = () => {
    const custo = parseFloat(formData.preco_custo_por_ponto);
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
        nome: formData.nome,
        preco_custo_por_ponto: parseFloat(formData.preco_custo_por_ponto),
        preco_tabela_por_ponto: calcularPrecoTabela(),
        margem_tabela_percent: parseFloat(formData.margem_percent),
        ativo: true,
      };

      if (servico) {
        const { error } = await supabase
          .from('servicos_instalacao')
          .update(servicoData)
          .eq('id', servico.id);

        if (error) throw error;
        toast({ title: 'Serviço atualizado', description: 'O serviço foi atualizado com sucesso' });
      } else {
        const { error } = await supabase.from('servicos_instalacao').insert(servicoData);
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
                placeholder="Ex: INST-CORTINA-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Serviço</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Instalação padrão"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preco_custo">Preço Custo/Ponto (R$)</Label>
              <Input
                id="preco_custo"
                type="number"
                step="0.01"
                value={formData.preco_custo_por_ponto}
                onChange={(e) => setFormData({ ...formData, preco_custo_por_ponto: e.target.value })}
                placeholder="Ex: 60.00"
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
                placeholder="Ex: 61.5"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Preço Tabela/Ponto (R$)</Label>
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
