import { useState, useEffect } from 'react';
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
import { Copy, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Cortina, Material } from '@/types/orcamento';
import { calcularCustosCortina } from '@/lib/calculosOrcamento';
import { OPCOES_AMBIENTE } from '@/types/orcamento';
import { MaterialSelector } from './MaterialSelector';

interface CortinaCardProps {
  cortina: Cortina;
  orcamentoId: string;
  onUpdate: (cortina: Cortina) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

export function CortinaCard({
  cortina,
  orcamentoId,
  onUpdate,
  onRemove,
  onDuplicate,
}: CortinaCardProps) {
  const [tecidos, setTecidos] = useState<Material[]>([]);
  const [forros, setForros] = useState<Material[]>([]);
  const [trilhos, setTrilhos] = useState<Material[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(!cortina.id); // Expandido se for novo item

  useEffect(() => {
    carregarMateriais();
  }, []);

  const carregarMateriais = async () => {
    setLoading(true);
    try {
      // Buscar materiais do banco de dados Supabase
      const { data: materiaisData, error } = await supabase
        .from('materiais')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;

      const materiaisList = materiaisData || [];

      const tecidosList = materiaisList.filter((m: Material) => m.categoria === 'tecido');
      const forrosList = materiaisList.filter((m: Material) => m.categoria === 'forro');
      const trilhosList = materiaisList.filter((m: Material) => m.categoria === 'trilho');

      setTecidos(tecidosList);
      setForros(forrosList);
      setTrilhos(trilhosList);

      console.log('📦 Materiais carregados do banco:', {
        tecidos: tecidosList.length,
        forros: forrosList.length,
        trilhos: trilhosList.length,
        total: materiaisList.length
      });

      toast({
        title: 'Materiais carregados',
        description: `${tecidosList.length} tecidos, ${forrosList.length} forros, ${trilhosList.length} trilhos disponíveis`,
      });
    } catch (error) {
      console.error('Erro ao carregar materiais:', error);
      toast({
        title: 'Erro ao carregar materiais',
        description: 'Não foi possível carregar os materiais do catálogo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Cortina, value: any) => {
    const novosDados = { ...cortina, [field]: value };
    onUpdate(novosDados);
  };

  const salvarCortina = async () => {
    setSaving(true);
    try {
      // Validação: pelo menos tecido OU forro deve estar preenchido
      if (!cortina.tecidoId && !cortina.forroId) {
        toast({
          title: 'Atenção',
          description: 'É necessário informar pelo menos o tecido principal ou o forro',
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }

      console.log('🔍 Salvando cortina:', {
        tecidoId: cortina.tecidoId,
        forroId: cortina.forroId,
        trilhoId: cortina.trilhoId,
        tipoCortina: cortina.tipoCortina
      });

      // Buscar serviços de confecção do banco de dados
      const { data: confeccaoData, error: confeccaoError } = await supabase
        .from('servicos_confeccao')
        .select('*')
        .eq('ativo', true)
        .limit(1)
        .single();

      if (confeccaoError) throw confeccaoError;

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

      console.log('📦 Materiais selecionados:', materiaisSelecionados.length);
      console.log('🔧 Serviço de confecção:', confeccaoData?.nome_modelo);
      console.log('🔨 Serviço de instalação:', instalacaoData?.nome);

      const custos = calcularCustosCortina(
        cortina,
        materiaisSelecionados as Material[],
        confeccaoData,
        instalacaoData
      );

      const dadosCortina = {
        orcamento_id: orcamentoId,
        nome_identificacao: cortina.nomeIdentificacao,
        largura: cortina.largura,
        altura: cortina.altura,
        barra_cm: cortina.barraCm || 0,
        quantidade: cortina.quantidade,
        tipo_produto: 'cortina',
        tipo_cortina: cortina.tipoCortina,
        ambiente: cortina.ambiente || null,
        tecido_id: cortina.tecidoId || null,
        forro_id: cortina.forroId || null,
        trilho_id: cortina.trilhoId || null,
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
        console.error('❌ Erro do Supabase:', result.error);
        throw result.error;
      }

      console.log('✅ Cortina salva com sucesso:', result.data.id);

      onUpdate({ ...cortina, id: result.data.id, tipoProduto: 'cortina', ...custos });

      toast({
        title: 'Sucesso',
        description: 'Cortina salva com sucesso',
      });
      
      // Colapsar após salvar
      setExpanded(false);
    } catch (error: any) {
      console.error('❌ Erro ao salvar cortina:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar a cortina',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <CardTitle className="text-lg flex items-center gap-2">
            {cortina.nomeIdentificacao}
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? "Recolher" : "Expandir"}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          {expanded && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={carregarMateriais}
              disabled={loading}
              title="Recarregar materiais"
            >
              {loading ? 'Carregando...' : 'Recarregar'}
            </Button>
          )}
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
      {expanded && (
        <CardContent className="space-y-4">
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
            <Label htmlFor={`barra-${cortina.id}`}>Barra (cm)</Label>
            <Input
              id={`barra-${cortina.id}`}
              type="number"
              step="1"
              value={cortina.barraCm || ''}
              onChange={(e) => handleChange('barraCm', parseFloat(e.target.value) || 0)}
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

          <div className="space-y-2">
            <Label htmlFor={`tecido-${cortina.id}`}>Tecido Principal</Label>
            <MaterialSelector
              categoria="tecido"
              materiais={tecidos}
              value={cortina.tecidoId}
              onSelect={(value) => handleChange('tecidoId', value)}
              placeholder="Selecione o tecido"
              optional={true}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`forro-${cortina.id}`}>Forro (Opcional)</Label>
            <MaterialSelector
              categoria="forro"
              materiais={forros}
              value={cortina.forroId}
              onSelect={(value) => handleChange('forroId', value)}
              placeholder="Selecione o forro"
              optional={true}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`trilho-${cortina.id}`}>Trilho</Label>
            <MaterialSelector
              categoria="trilho"
              materiais={trilhos}
              value={cortina.trilhoId}
              onSelect={(value) => handleChange('trilhoId', value)}
              placeholder="Selecione o trilho"
              optional={true}
            />
          </div>

          <div className="space-y-2 flex items-center justify-between md:col-span-2">
            <Label htmlFor={`instalacao-${cortina.id}`}>Precisa de Instalação?</Label>
            <Switch
              id={`instalacao-${cortina.id}`}
              checked={cortina.precisaInstalacao}
              onCheckedChange={(checked) => handleChange('precisaInstalacao', checked)}
            />
          </div>

          {cortina.precisaInstalacao && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={`pontos-${cortina.id}`}>Pontos de Instalação *</Label>
              <Input
                id={`pontos-${cortina.id}`}
                type="number"
                min="1"
                value={cortina.pontosInstalacao || 1}
                onChange={(e) =>
                  handleChange('pontosInstalacao', parseInt(e.target.value) || 1)
                }
                required
              />
            </div>
          )}
        </div>

        <Button
          type="button"
          onClick={salvarCortina}
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Salvando...' : 'Salvar Cortina'}
        </Button>
      </CardContent>
      )}
    </Card>
  );
}
