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
      const response = await fetch('/data/materials.json');
      const data = await response.json();

      const tecidosList = data.filter((m: any) => m.categoria === 'tecido');
      const forrosList = data.filter((m: any) => m.categoria === 'forro');
      const trilhosList = data.filter((m: any) => m.categoria === 'trilho');

      const materiaisFormatados = (items: any[]) => items.map((item: any) => ({
        id: item.codigoItem,
        codigo_item: item.codigoItem,
        nome: item.nome,
        categoria: item.categoria,
        unidade: item.unidade || 'M',
        largura_metro: item.larguraMetro || null,
        preco_custo: Number(item.precoCusto) / 100,
        preco_tabela: (Number(item.precoCusto) / 100) * 1.615,
        margem_tabela_percent: 61.5,
        perda_percent: 10,
        ativo: item.ativo !== false,
        created_at: '',
        updated_at: '',
      }));

      setTecidos(materiaisFormatados(tecidosList));
      setForros(materiaisFormatados(forrosList));
      setTrilhos(materiaisFormatados(trilhosList));

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
      // Buscar serviços de confecção do JSON
      const confeccaoResponse = await fetch('/data/servicos_confeccao.json');
      const confeccaoData = await confeccaoResponse.json();
      const servicoConfeccao = confeccaoData[0]; // Pegar primeiro serviço

      // Buscar serviços de instalação do JSON
      const instalacaoResponse = await fetch('/data/servicos_instalacao.json');
      const instalacaoData = await instalacaoResponse.json();
      const servicoInstalacao = instalacaoData[0]; // Pegar primeiro serviço

      const materiaisSelecionados = [
        tecidos.find(t => t.id === cortina.tecidoId),
        forros.find(f => f.id === cortina.forroId),
        trilhos.find(t => t.id === cortina.trilhoId)
      ].filter(Boolean);

      const custos = calcularCustosCortina(
        cortina,
        materiaisSelecionados as Material[],
        {
          ...servicoConfeccao,
          id: servicoConfeccao.codigoItem,
          preco_custo: Number(servicoConfeccao.precoCusto) / 100,
          preco_tabela: (Number(servicoConfeccao.precoCusto) / 100) * 1.55,
          margem_tabela_percent: 55,
          ativo: true,
          created_at: '',
          updated_at: '',
        },
        servicoInstalacao ? {
          ...servicoInstalacao,
          id: servicoInstalacao.codigoItem,
          preco_custo_por_ponto: Number(servicoInstalacao.precoCustoPorPonto),
          preco_tabela_por_ponto: Number(servicoInstalacao.precoCustoPorPonto) * 1.615,
          margem_tabela_percent: 61.5,
          ativo: true,
          created_at: '',
          updated_at: '',
        } : null
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

      if (result.error) throw result.error;

      onUpdate({ ...cortina, id: result.data.id, tipoProduto: 'cortina', ...custos });

      toast({
        title: 'Sucesso',
        description: 'Cortina salva com sucesso',
      });
      
      // Colapsar após salvar
      setExpanded(false);
    } catch (error) {
      console.error('Erro ao salvar cortina:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a cortina',
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
            <Select
              value={cortina.tecidoId || 'none'}
              onValueChange={(value) => handleChange('tecidoId', value === 'none' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tecido" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem tecido</SelectItem>
                {tecidos.length === 0 ? (
                  <SelectItem value="loading" disabled>
                    Carregando tecidos...
                  </SelectItem>
                ) : (
                  tecidos.map((tecido) => (
                    <SelectItem key={tecido.id} value={tecido.id}>
                      {tecido.codigo_item} - {tecido.nome}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {cortina.tecidoId && tecidos.find(t => t.id === cortina.tecidoId) && (
              <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                <p><strong>Código:</strong> {tecidos.find(t => t.id === cortina.tecidoId)?.codigo_item}</p>
                <p><strong>Preço custo:</strong> R$ {tecidos.find(t => t.id === cortina.tecidoId)?.preco_custo.toFixed(2)}/m</p>
                {tecidos.find(t => t.id === cortina.tecidoId)?.largura_metro && (
                  <p><strong>Largura rolo:</strong> {tecidos.find(t => t.id === cortina.tecidoId)?.largura_metro}m</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`forro-${cortina.id}`}>Forro (Opcional)</Label>
            <Select
              value={cortina.forroId || 'none'}
              onValueChange={(value) => handleChange('forroId', value === 'none' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o forro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem forro</SelectItem>
                {forros.map((forro) => (
                  <SelectItem key={forro.id} value={forro.id}>
                    {forro.codigo_item} - {forro.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {cortina.forroId && forros.find(f => f.id === cortina.forroId) && (
              <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                <p><strong>Código:</strong> {forros.find(f => f.id === cortina.forroId)?.codigo_item}</p>
                <p><strong>Preço custo:</strong> R$ {forros.find(f => f.id === cortina.forroId)?.preco_custo.toFixed(2)}/m</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`trilho-${cortina.id}`}>Trilho</Label>
            <Select
              value={cortina.trilhoId || 'none'}
              onValueChange={(value) => handleChange('trilhoId', value === 'none' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o trilho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem trilho</SelectItem>
                {trilhos.map((trilho) => (
                  <SelectItem key={trilho.id} value={trilho.id}>
                    {trilho.codigo_item} - {trilho.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {cortina.trilhoId && trilhos.find(t => t.id === cortina.trilhoId) && (
              <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                <p><strong>Código:</strong> {trilhos.find(t => t.id === cortina.trilhoId)?.codigo_item}</p>
                <p><strong>Preço custo:</strong> R$ {trilhos.find(t => t.id === cortina.trilhoId)?.preco_custo.toFixed(2)}/m</p>
              </div>
            )}
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
