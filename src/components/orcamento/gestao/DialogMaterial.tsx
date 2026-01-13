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
  linha?: string | null;
  cor?: string | null;
  tipo?: string | null;
  aplicacao?: string | null;
  potencia?: string | null;
  area_min_fat?: number | null;
}

interface DialogMaterialProps {
  aberto: boolean;
  material: Material | null;
  materialDuplicando?: Material | null;
  onClose: (sucesso?: boolean) => void;
}

export function DialogMaterial({ aberto, material, materialDuplicando, onClose }: DialogMaterialProps) {
  const { organizationId } = useOrganizationContext();
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
    linha: '',
    cor: '',
    tipo: '',
    aplicacao: '',
    potencia: '',
    area_min_fat: '',
  });

  useEffect(() => {
    // Priorizar duplicação sobre edição
    const materialOrigem = materialDuplicando || material;
    const isDuplicando = !!materialDuplicando;

    if (materialOrigem) {
      const margemPercent = materialOrigem.preco_tabela > 0 && materialOrigem.preco_custo > 0
        ? ((materialOrigem.preco_tabela / materialOrigem.preco_custo - 1) * 100).toFixed(1)
        : '61.5';

      setFormData({
        codigo_item: isDuplicando 
          ? `${materialOrigem.codigo_item || ''}-COPIA` 
          : materialOrigem.codigo_item || '',
        nome: isDuplicando 
          ? `${materialOrigem.nome} (Cópia)` 
          : materialOrigem.nome,
        categoria: materialOrigem.categoria,
        unidade: materialOrigem.unidade,
        largura_metro: materialOrigem.largura_metro?.toString() || '',
        preco_custo: materialOrigem.preco_custo.toString(),
        margem_percent: margemPercent,
        fornecedor: materialOrigem.fornecedor || '',
        linha: materialOrigem.linha || '',
        cor: isDuplicando ? '' : (materialOrigem.cor || ''), // Limpar cor para edição manual
        tipo: materialOrigem.tipo || '',
        aplicacao: materialOrigem.aplicacao || '',
        potencia: materialOrigem.potencia || '',
        area_min_fat: materialOrigem.area_min_fat?.toString() || '',
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
        linha: '',
        cor: '',
        tipo: '',
        aplicacao: '',
        potencia: '',
        area_min_fat: '',
      });
    }
  }, [material, materialDuplicando, aberto]);

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
        linha: formData.linha || null,
        cor: formData.cor || null,
        tipo: formData.tipo || null,
        aplicacao: formData.aplicacao || null,
        potencia: formData.potencia || null,
        area_min_fat: formData.area_min_fat ? parseFloat(formData.area_min_fat) : null,
      };

      // Se está duplicando OU criando novo, sempre INSERT
      if (material && !materialDuplicando) {
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
          .insert({
            ...materialData,
            organization_id: organizationId,
          });

        if (error) throw error;

        toast({
          title: materialDuplicando ? 'Material duplicado' : 'Material criado',
          description: materialDuplicando 
            ? 'A nova variante foi criada com sucesso. Não esqueça de ajustar o código e a cor!'
            : 'O novo material foi criado com sucesso',
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
          <DialogTitle>
            {materialDuplicando 
              ? 'Duplicar Material' 
              : material 
                ? 'Editar Material' 
                : 'Novo Material'}
          </DialogTitle>
          <DialogDescription>
            {materialDuplicando
              ? 'Altere o código e a cor para a nova variante'
              : material
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
                  <SelectItem value="persiana">Persiana</SelectItem>
                  <SelectItem value="motorizado">Motorizado</SelectItem>
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
                  <SelectItem value="M2">Metro Quadrado (m²)</SelectItem>
                  <SelectItem value="ROLO">Rolo (ROLO)</SelectItem>
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

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Input
                id="tipo"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                placeholder="Ex: FORRO, TRILHO MAX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linha">Linha</Label>
              <Input
                id="linha"
                value={formData.linha}
                onChange={(e) => setFormData({ ...formData, linha: e.target.value })}
                placeholder="Ex: BLACKOUT 100%"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cor">Cor</Label>
              <Input
                id="cor"
                value={formData.cor}
                onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                placeholder="Ex: BRANCO, PRETO"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aplicacao">Aplicação</Label>
              <Input
                id="aplicacao"
                value={formData.aplicacao}
                onChange={(e) => setFormData({ ...formData, aplicacao: e.target.value })}
                placeholder="Ex: PERSIANA PESADA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="potencia">Potência</Label>
              <Input
                id="potencia"
                value={formData.potencia}
                onChange={(e) => setFormData({ ...formData, potencia: e.target.value })}
                placeholder="Ex: UD 1,2N"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area_min_fat">Área Mín. Fat. (m²)</Label>
              <Input
                id="area_min_fat"
                type="number"
                step="0.01"
                value={formData.area_min_fat}
                onChange={(e) => setFormData({ ...formData, area_min_fat: e.target.value })}
                placeholder="Ex: 1.2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {materialDuplicando 
                ? 'Duplicar Material' 
                : material 
                  ? 'Atualizar Material' 
                  : 'Criar Material'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
