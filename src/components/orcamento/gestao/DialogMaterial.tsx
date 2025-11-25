import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Material {
  id: string;
  codigo_item: string;
  nome: string;
  categoria: string;
  unidade: string;
  largura_metro: number | null;
  preco_custo: number;
  preco_tabela: number;
  ativo: boolean;
  fornecedor: string | null;
}

interface DialogMaterialProps {
  aberto: boolean;
  material: Material | null;
  onClose: (sucesso?: boolean) => void;
}

export function DialogMaterial({ aberto, material, onClose }: DialogMaterialProps) {
  const [salvando, setSalvando] = useState(false);
  const [formData, setFormData] = useState({
    codigo_item: '',
    nome: '',
    categoria: 'tecido',
    unidade: 'M',
    largura_metro: '',
    preco_custo: '',
    margem_percent: '61.5',
    fornecedor: '',
  });

  useEffect(() => {
    if (material) {
      const margemPercent = material.preco_tabela > 0 && material.preco_custo > 0
        ? ((material.preco_tabela / material.preco_custo - 1) * 100).toFixed(1)
        : '61.5';

      setFormData({
        codigo_item: material.codigo_item || '',
        nome: material.nome,
        categoria: material.categoria,
        unidade: material.unidade,
        largura_metro: material.largura_metro?.toString() || '',
        preco_custo: material.preco_custo.toString(),
        margem_percent: margemPercent,
        fornecedor: material.fornecedor || '',
      });
    } else {
      setFormData({
        codigo_item: '',
        nome: '',
        categoria: 'tecido',
        unidade: 'M',
        largura_metro: '',
        preco_custo: '',
        margem_percent: '61.5',
        fornecedor: '',
      });
    }
  }, [material, aberto]);

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
      const precoTabela = calcularPrecoTabela();
      const materialData = {
        codigo_item: formData.codigo_item,
        nome: formData.nome,
        categoria: formData.categoria,
        unidade: formData.unidade,
        largura_metro: formData.largura_metro ? parseFloat(formData.largura_metro) : null,
        preco_custo: parseFloat(formData.preco_custo),
        preco_tabela: precoTabela,
        margem_tabela_percent: parseFloat(formData.margem_percent),
        ativo: true,
        fornecedor: formData.fornecedor || null,
      };

      if (material) {
        const { error } = await supabase
          .from('materiais')
          .update(materialData)
          .eq('id', material.id);

        if (error) throw error;

        toast({
          title: 'Material atualizado',
          description: 'O material foi atualizado com sucesso',
        });
      } else {
        const { error } = await supabase
          .from('materiais')
          .insert(materialData);

        if (error) throw error;

        toast({
          title: 'Material criado',
          description: 'O novo material foi criado com sucesso',
        });
      }

      onClose(true);
    } catch (error) {
      console.error('Erro ao salvar material:', error);
      toast({
        title: 'Erro ao salvar material',
        description: 'Não foi possível salvar o material',
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{material ? 'Editar Material' : 'Novo Material'}</DialogTitle>
          <DialogDescription>
            {material
              ? 'Edite as informações do material'
              : 'Preencha os dados do novo material'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo_item">Código do Item</Label>
              <Input
                id="codigo_item"
                value={formData.codigo_item}
                onChange={(e) => setFormData({ ...formData, codigo_item: e.target.value })}
                placeholder="Ex: TEC-LINHO-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Material</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Linho Natural Bege"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fornecedor">Fornecedor</Label>
            <Input
              id="fornecedor"
              value={formData.fornecedor}
              onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
              placeholder="Ex: Têxtil ABC, Casa dos Tecidos"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
              >
                <SelectTrigger id="categoria">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tecido">Tecido</SelectItem>
                  <SelectItem value="forro">Forro</SelectItem>
                  <SelectItem value="trilho">Trilho</SelectItem>
                  <SelectItem value="acessorio">Acessório</SelectItem>
                  <SelectItem value="papel">Papel de Parede</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="M">Metro (M)</SelectItem>
                  <SelectItem value="UN">Unidade (UN)</SelectItem>
                  <SelectItem value="ML">Metro Linear (ML)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="largura_metro">Largura (metros)</Label>
              <Input
                id="largura_metro"
                type="number"
                step="0.01"
                value={formData.largura_metro}
                onChange={(e) => setFormData({ ...formData, largura_metro: e.target.value })}
                placeholder="Ex: 2.80"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preco_custo">Preço de Custo (R$)</Label>
              <Input
                id="preco_custo"
                type="number"
                step="0.01"
                value={formData.preco_custo}
                onChange={(e) => setFormData({ ...formData, preco_custo: e.target.value })}
                placeholder="Ex: 45.00"
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
              <Label>Preço Tabela (R$)</Label>
              <Input
                value={calcularPrecoTabela().toFixed(2)}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {material ? 'Atualizar' : 'Criar'} Material
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
