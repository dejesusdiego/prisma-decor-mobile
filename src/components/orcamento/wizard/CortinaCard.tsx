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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Copy, Trash2, ChevronDown, ChevronUp, X, Scissors } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Cortina, Material, ServicoConfeccao } from '@/types/orcamento';
import { calcularCustosCortina } from '@/lib/calculosOrcamento';
import { OPCOES_AMBIENTE } from '@/types/orcamento';
import { MaterialSelector } from './MaterialSelector';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';
import { fetchMateriaisPaginados } from '@/lib/fetchMateriaisPaginados';

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
  const [servicosConfeccao, setServicosConfeccao] = useState<ServicoConfeccao[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(!cortina.id);
  const [servicosAdicionaisOpen, setServicosAdicionaisOpen] = useState(false);
  
  const { configuracoes } = useConfiguracoes();

  useEffect(() => {
    carregarMateriais();
    carregarServicosConfeccao();
  }, []);

  const carregarMateriais = async () => {
    setLoading(true);
    try {
      // Buscar materiais com paginação para contornar limite de 1000
      const [tecidosList, forrosList, trilhosList] = await Promise.all([
        fetchMateriaisPaginados('tecido', true),
        fetchMateriaisPaginados('forro', true),
        fetchMateriaisPaginados('trilho', true),
      ]);

      setTecidos(tecidosList);
      setForros(forrosList);
      setTrilhos(trilhosList);

      console.log('📦 Materiais carregados do banco:', {
        tecidos: tecidosList.length,
        forros: forrosList.length,
        trilhos: trilhosList.length,
        total: tecidosList.length + forrosList.length + trilhosList.length
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

  const carregarServicosConfeccao = async () => {
    try {
      const { data, error } = await supabase
        .from('servicos_confeccao')
        .select('*')
        .eq('ativo', true)
        .order('nome_modelo');

      if (error) throw error;
      setServicosConfeccao(data || []);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  };

  const handleChange = (field: keyof Cortina, value: any) => {
    console.log(`📝 handleChange: ${field} = ${value} (tipo: ${typeof value})`);
    const novosDados = { ...cortina, [field]: value };
    onUpdate(novosDados);
  };

  const toggleServicoAdicional = (servicoId: string) => {
    const atuais = cortina.servicosAdicionaisIds || [];
    if (atuais.includes(servicoId)) {
      handleChange('servicosAdicionaisIds', atuais.filter(id => id !== servicoId));
    } else {
      handleChange('servicosAdicionaisIds', [...atuais, servicoId]);
    }
  };

  const removerServicoAdicional = (servicoId: string) => {
    const atuais = cortina.servicosAdicionaisIds || [];
    handleChange('servicosAdicionaisIds', atuais.filter(id => id !== servicoId));
  };

  const getNomeServico = (servicoId: string) => {
    const servico = servicosConfeccao.find(s => s.id === servicoId);
    return servico ? servico.nome_modelo : 'Desconhecido';
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
        tipoCortina: cortina.tipoCortina,
        servicosAdicionais: cortina.servicosAdicionaisIds,
        barraCm: cortina.barraCm,
        barraForroCm: cortina.barraForroCm
      });

      console.log('📊 Valores da barra no momento do save:', {
        'cortina.barraCm': cortina.barraCm,
        'cortina.barraForroCm': cortina.barraForroCm,
        'tipo barraCm': typeof cortina.barraCm,
        'tipo barraForroCm': typeof cortina.barraForroCm
      });

      // Obter serviços configurados para este tipo de cortina
      const servicosConfigurados = configuracoes.servicosPorTipoCortina[cortina.tipoCortina] || [];
      const servicosAdicionais = cortina.servicosAdicionaisIds || [];
      
      // Combinar serviços configurados + adicionais (sem duplicatas)
      const todosServicosIds = [...new Set([...servicosConfigurados, ...servicosAdicionais])];
      
      // Adicionar serviço de forro se tiver forro e houver serviço configurado
      if (cortina.forroId && configuracoes.servicoForroPadrao) {
        if (!todosServicosIds.includes(configuracoes.servicoForroPadrao)) {
          todosServicosIds.push(configuracoes.servicoForroPadrao);
        }
      }

      // Buscar todos os serviços de confecção selecionados
      let servicosParaCalculo: ServicoConfeccao[] = [];
      if (todosServicosIds.length > 0) {
        const { data: servicosData, error: servicosError } = await supabase
          .from('servicos_confeccao')
          .select('*')
          .in('id', todosServicosIds)
          .eq('ativo', true);

        if (servicosError) throw servicosError;
        servicosParaCalculo = servicosData || [];
      }

      // Se não houver serviços configurados, buscar o primeiro ativo como fallback
      if (servicosParaCalculo.length === 0) {
        const { data: fallbackServico, error: fallbackError } = await supabase
          .from('servicos_confeccao')
          .select('*')
          .eq('ativo', true)
          .limit(1)
          .single();

        if (fallbackError) throw fallbackError;
        servicosParaCalculo = [fallbackServico];
      }

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
      console.log('🔧 Serviços de confecção:', servicosParaCalculo.map(s => s.nome_modelo));
      console.log('🔨 Serviço de instalação:', instalacaoData?.nome);

      // Calcular custo de costura somando todos os serviços (multiplicado pela quantidade)
      const trilho = cortina.trilhoId ? trilhos.find(t => t.id === cortina.trilhoId || t.codigo_item === cortina.trilhoId) : null;
      const comprimentoTrilhoUnitario_m = cortina.largura + 0.1;
      const comprimentoParaCosturaUnitario = trilho ? comprimentoTrilhoUnitario_m : cortina.largura;
      const comprimentoParaCosturaTotal = comprimentoParaCosturaUnitario * cortina.quantidade;
      
      let custoCosturaTotal = 0;
      for (const servico of servicosParaCalculo) {
        custoCosturaTotal += comprimentoParaCosturaTotal * servico.preco_custo;
      }

      // Calcular custos usando o primeiro serviço para estrutura, mas substituir custosCostura
      const custos = calcularCustosCortina(
        cortina,
        materiaisSelecionados as Material[],
        servicosParaCalculo[0],
        instalacaoData
      );

      // Substituir custo de costura pelo total calculado
      custos.custoCostura = custoCosturaTotal;
      custos.custoTotal = custos.custoTecido + custos.custoForro + custos.custoTrilho + custoCosturaTotal + custos.custoInstalacao;

      const dadosCortina = {
        orcamento_id: orcamentoId,
        nome_identificacao: cortina.nomeIdentificacao,
        largura: cortina.largura,
        altura: cortina.altura,
        barra_cm: cortina.barraCm || 0,
        barra_forro_cm: cortina.barraForroCm || 0,
        quantidade: cortina.quantidade,
        tipo_produto: 'cortina',
        tipo_cortina: cortina.tipoCortina,
        ambiente: cortina.ambiente || null,
        tecido_id: cortina.tecidoId || null,
        forro_id: cortina.forroId || null,
        trilho_id: cortina.trilhoId || null,
        observacoes_internas: cortina.observacoesInternas || null,
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
        servicos_adicionais_ids: cortina.servicosAdicionaisIds || [],
      };

      console.log('💾 dadosCortina a enviar para DB:', {
        barra_cm: dadosCortina.barra_cm,
        barra_forro_cm: dadosCortina.barra_forro_cm
      });

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
      console.log('📥 Dados retornados do DB:', {
        barra_cm: result.data.barra_cm,
        barra_forro_cm: result.data.barra_forro_cm
      });

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
            <Label htmlFor={`barra-${cortina.id}`}>Barra Tecido (cm)</Label>
            <Input
              id={`barra-${cortina.id}`}
              type="number"
              step="1"
              value={cortina.barraCm || ''}
              onChange={(e) => {
                console.log(`🔢 Input barraCm: raw="${e.target.value}", parsed=${parseFloat(e.target.value)}`);
                handleChange('barraCm', parseFloat(e.target.value) || 0);
              }}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`barra-forro-${cortina.id}`}>Barra Forro (cm)</Label>
            <Input
              id={`barra-forro-${cortina.id}`}
              type="number"
              step="1"
              value={cortina.barraForroCm || ''}
              onChange={(e) => {
                console.log(`🔢 Input barraForroCm: raw="${e.target.value}", parsed=${parseFloat(e.target.value)}`);
                handleChange('barraForroCm', parseFloat(e.target.value) || 0);
              }}
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

          {/* Serviços de Confecção Adicionais */}
          <div className="space-y-2 md:col-span-2">
            <Collapsible open={servicosAdicionaisOpen} onOpenChange={setServicosAdicionaisOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Scissors className="h-4 w-4" />
                    Serviços de Confecção Adicionais
                    {(cortina.servicosAdicionaisIds?.length || 0) > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {cortina.servicosAdicionaisIds?.length} selecionado(s)
                      </Badge>
                    )}
                  </span>
                  {servicosAdicionaisOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="border rounded-lg p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Selecione serviços específicos para esta cortina (além dos configurados no sistema)
                  </p>
                  
                  {/* Serviços selecionados */}
                  {(cortina.servicosAdicionaisIds?.length || 0) > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {cortina.servicosAdicionaisIds?.map((servicoId) => (
                        <Badge key={servicoId} variant="secondary" className="flex items-center gap-1">
                          {getNomeServico(servicoId)}
                          <button
                            onClick={() => removerServicoAdicional(servicoId)}
                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Lista de serviços disponíveis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {servicosConfeccao.map((servico) => (
                      <div key={servico.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`servico-${cortina.id}-${servico.id}`}
                          checked={(cortina.servicosAdicionaisIds || []).includes(servico.id)}
                          onCheckedChange={() => toggleServicoAdicional(servico.id)}
                        />
                        <label
                          htmlFor={`servico-${cortina.id}-${servico.id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {servico.nome_modelo}
                          <span className="text-muted-foreground ml-1">
                            (R$ {servico.preco_custo.toFixed(2)}/mt)
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`obs-${cortina.id}`}>Observações Internas (não aparecem no PDF)</Label>
            <Textarea
              id={`obs-${cortina.id}`}
              value={cortina.observacoesInternas || ''}
              onChange={(e) => handleChange('observacoesInternas', e.target.value)}
              placeholder="Anotações internas sobre este item..."
              className="min-h-[80px]"
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
