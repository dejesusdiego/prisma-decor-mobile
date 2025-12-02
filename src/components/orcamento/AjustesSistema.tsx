import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Plus, Trash2, Settings, Scissors, Percent, Home, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useConfiguracoes, OpcaoMargem } from '@/hooks/useConfiguracoes';
import type { ServicoConfeccao } from '@/types/orcamento';
import { Badge } from '@/components/ui/badge';

interface AjustesSistemaProps {
  onVoltar: () => void;
}

const TIPOS_CORTINA = [
  { key: 'wave', label: 'Wave' },
  { key: 'prega', label: 'Prega' },
  { key: 'painel', label: 'Painel' },
  { key: 'rolo', label: 'Rolo' },
];

export function AjustesSistema({ onVoltar }: AjustesSistemaProps) {
  const { configuracoes, loading, salvarConfiguracao } = useConfiguracoes();
  const [servicosConfeccao, setServicosConfeccao] = useState<ServicoConfeccao[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Estados locais para edição
  const [coefTecido, setCoefTecido] = useState<Record<string, number>>({});
  const [coefForro, setCoefForro] = useState<Record<string, number>>({});
  const [servicosPorTipo, setServicosPorTipo] = useState<Record<string, string[]>>({});
  const [servicoForro, setServicoForro] = useState<string | null>(null);
  const [opcoesMargem, setOpcoesMargem] = useState<OpcaoMargem[]>([]);
  const [opcoesAmbiente, setOpcoesAmbiente] = useState<string[]>([]);
  const [novoAmbiente, setNovoAmbiente] = useState('');

  useEffect(() => {
    carregarServicosConfeccao();
  }, []);

  useEffect(() => {
    if (!loading) {
      setCoefTecido(configuracoes.coeficientesTecido);
      setCoefForro(configuracoes.coeficientesForro);
      // Garantir que servicosPorTipoCortina seja um objeto com arrays
      const servicos = configuracoes.servicosPorTipoCortina || {};
      const servicosNormalizados: Record<string, string[]> = {};
      for (const key of Object.keys(servicos)) {
        const valor = servicos[key];
        if (Array.isArray(valor)) {
          servicosNormalizados[key] = valor;
        } else if (valor) {
          servicosNormalizados[key] = [valor];
        } else {
          servicosNormalizados[key] = [];
        }
      }
      setServicosPorTipo(servicosNormalizados);
      setServicoForro(configuracoes.servicoForroPadrao);
      setOpcoesMargem(configuracoes.opcoesMargem);
      setOpcoesAmbiente(configuracoes.opcoesAmbiente);
    }
  }, [loading, configuracoes]);

  const carregarServicosConfeccao = async () => {
    const { data, error } = await supabase
      .from('servicos_confeccao')
      .select('*')
      .eq('ativo', true)
      .order('nome_modelo');

    if (error) {
      console.error('Erro ao carregar serviços:', error);
      return;
    }
    setServicosConfeccao(data || []);
  };

  const handleSalvarCoeficientes = async () => {
    setSaving(true);
    try {
      await salvarConfiguracao('coeficientes_tecido', coefTecido);
      await salvarConfiguracao('coeficientes_forro', coefForro);
      toast.success('Coeficientes salvos com sucesso!');
    } catch (err) {
      toast.error('Erro ao salvar coeficientes');
    } finally {
      setSaving(false);
    }
  };

  const handleSalvarServicos = async () => {
    setSaving(true);
    try {
      await salvarConfiguracao('servicos_por_tipo_cortina', servicosPorTipo);
      await salvarConfiguracao('servico_forro_padrao', servicoForro);
      toast.success('Mapeamento de serviços salvo com sucesso!');
    } catch (err) {
      toast.error('Erro ao salvar mapeamento de serviços');
    } finally {
      setSaving(false);
    }
  };

  const handleSalvarMargem = async () => {
    setSaving(true);
    try {
      await salvarConfiguracao('opcoes_margem', opcoesMargem);
      toast.success('Opções de margem salvas com sucesso!');
    } catch (err) {
      toast.error('Erro ao salvar opções de margem');
    } finally {
      setSaving(false);
    }
  };

  const handleSalvarAmbientes = async () => {
    setSaving(true);
    try {
      await salvarConfiguracao('opcoes_ambiente', opcoesAmbiente);
      toast.success('Opções de ambiente salvas com sucesso!');
    } catch (err) {
      toast.error('Erro ao salvar opções de ambiente');
    } finally {
      setSaving(false);
    }
  };

  const adicionarMargem = () => {
    setOpcoesMargem([...opcoesMargem, { label: 'Nova Margem', valor: 50 }]);
  };

  const removerMargem = (index: number) => {
    setOpcoesMargem(opcoesMargem.filter((_, i) => i !== index));
  };

  const atualizarMargem = (index: number, field: 'label' | 'valor', value: string | number) => {
    const novas = [...opcoesMargem];
    if (field === 'label') {
      novas[index].label = value as string;
    } else {
      novas[index].valor = Number(value);
    }
    setOpcoesMargem(novas);
  };

  const adicionarAmbiente = () => {
    if (novoAmbiente.trim() && !opcoesAmbiente.includes(novoAmbiente.trim())) {
      setOpcoesAmbiente([...opcoesAmbiente, novoAmbiente.trim()]);
      setNovoAmbiente('');
    }
  };

  const removerAmbiente = (index: number) => {
    setOpcoesAmbiente(opcoesAmbiente.filter((_, i) => i !== index));
  };

  // Funções para gerenciar múltiplos serviços por tipo
  const toggleServicoPorTipo = (tipoKey: string, servicoId: string) => {
    const atuais = servicosPorTipo[tipoKey] || [];
    if (atuais.includes(servicoId)) {
      setServicosPorTipo({
        ...servicosPorTipo,
        [tipoKey]: atuais.filter(id => id !== servicoId)
      });
    } else {
      setServicosPorTipo({
        ...servicosPorTipo,
        [tipoKey]: [...atuais, servicoId]
      });
    }
  };

  const removerServicoPorTipo = (tipoKey: string, servicoId: string) => {
    const atuais = servicosPorTipo[tipoKey] || [];
    setServicosPorTipo({
      ...servicosPorTipo,
      [tipoKey]: atuais.filter(id => id !== servicoId)
    });
  };

  const getNomeServico = (servicoId: string) => {
    const servico = servicosConfeccao.find(s => s.id === servicoId);
    return servico ? servico.nome_modelo : 'Desconhecido';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando configurações...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onVoltar}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ajustes do Sistema</h1>
          <p className="text-muted-foreground">Configure coeficientes, serviços e opções do sistema</p>
        </div>
      </div>

      <Tabs defaultValue="coeficientes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="coeficientes" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Coeficientes
          </TabsTrigger>
          <TabsTrigger value="servicos" className="flex items-center gap-2">
            <Scissors className="h-4 w-4" />
            Serviços
          </TabsTrigger>
          <TabsTrigger value="margem" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Margem
          </TabsTrigger>
          <TabsTrigger value="ambiente" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Ambientes
          </TabsTrigger>
        </TabsList>

        {/* Coeficientes */}
        <TabsContent value="coeficientes">
          <Card>
            <CardHeader>
              <CardTitle>Coeficientes por Tipo de Cortina</CardTitle>
              <CardDescription>
                Define quanto de tecido e forro é necessário para cada tipo de cortina (multiplicador sobre a largura)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Tipo</th>
                      <th className="text-center py-3 px-4 font-medium">Coef. Tecido</th>
                      <th className="text-center py-3 px-4 font-medium">Coef. Forro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TIPOS_CORTINA.map((tipo) => (
                      <tr key={tipo.key} className="border-b">
                        <td className="py-3 px-4 font-medium">{tipo.label}</td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            value={coefTecido[tipo.key] || 1}
                            onChange={(e) => setCoefTecido({ ...coefTecido, [tipo.key]: Number(e.target.value) })}
                            className="w-24 mx-auto text-center"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            value={coefForro[tipo.key] || 1}
                            onChange={(e) => setCoefForro({ ...coefForro, [tipo.key]: Number(e.target.value) })}
                            className="w-24 mx-auto text-center"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={handleSalvarCoeficientes} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Coeficientes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Serviços - Agora com seleção múltipla */}
        <TabsContent value="servicos">
          <Card>
            <CardHeader>
              <CardTitle>Mapeamento de Serviços de Confecção</CardTitle>
              <CardDescription>
                Selecione um ou mais serviços de confecção para cada tipo de cortina. Você pode adicionar serviços específicos diretamente no card da cortina.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {TIPOS_CORTINA.map((tipo) => (
                <div key={tipo.key} className="space-y-3 p-4 border rounded-lg">
                  <Label className="text-lg font-semibold">{tipo.label}</Label>
                  
                  {/* Serviços selecionados */}
                  <div className="flex flex-wrap gap-2 min-h-[32px]">
                    {(servicosPorTipo[tipo.key] || []).length === 0 ? (
                      <span className="text-sm text-muted-foreground">Nenhum serviço selecionado</span>
                    ) : (
                      (servicosPorTipo[tipo.key] || []).map((servicoId) => (
                        <Badge key={servicoId} variant="secondary" className="flex items-center gap-1">
                          {getNomeServico(servicoId)}
                          <button
                            onClick={() => removerServicoPorTipo(tipo.key, servicoId)}
                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))
                    )}
                  </div>

                  {/* Lista de serviços disponíveis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-2">
                    {servicosConfeccao.map((servico) => (
                      <div key={servico.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${tipo.key}-${servico.id}`}
                          checked={(servicosPorTipo[tipo.key] || []).includes(servico.id)}
                          onCheckedChange={() => toggleServicoPorTipo(tipo.key, servico.id)}
                        />
                        <label
                          htmlFor={`${tipo.key}-${servico.id}`}
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
              ))}

              {/* Serviço de Forro - mesmo padrão de multi-seleção */}
              <div className="space-y-3 p-4 border rounded-lg border-dashed">
                <Label className="text-lg font-semibold">Serviço de Forro (quando cortina tem forro)</Label>
                <p className="text-sm text-muted-foreground">
                  Serviço aplicado automaticamente quando a cortina tem forro selecionado
                </p>
                
                {/* Serviço selecionado */}
                <div className="flex flex-wrap gap-2 min-h-[32px]">
                  {!servicoForro ? (
                    <span className="text-sm text-muted-foreground">Nenhum serviço selecionado</span>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {getNomeServico(servicoForro)}
                      <button
                        onClick={() => setServicoForro(null)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>

                {/* Lista de serviços disponíveis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-2">
                  {servicosConfeccao.map((servico) => (
                    <div key={servico.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`forro-${servico.id}`}
                        checked={servicoForro === servico.id}
                        onCheckedChange={(checked) => setServicoForro(checked ? servico.id : null)}
                      />
                      <label
                        htmlFor={`forro-${servico.id}`}
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

              <div className="flex justify-end pt-4">
                <Button onClick={handleSalvarServicos} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Mapeamento
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Margem */}
        <TabsContent value="margem">
          <Card>
            <CardHeader>
              <CardTitle>Opções de Margem de Lucro</CardTitle>
              <CardDescription>
                Configure as opções de margem disponíveis ao criar orçamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {opcoesMargem.map((opcao, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Input
                      value={opcao.label}
                      onChange={(e) => atualizarMargem(index, 'label', e.target.value)}
                      placeholder="Nome da opção"
                      className="flex-1"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        value={opcao.valor}
                        onChange={(e) => atualizarMargem(index, 'valor', e.target.value)}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removerMargem(index)}
                      disabled={opcoesMargem.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={adicionarMargem}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Opção
              </Button>
              <div className="flex justify-end pt-4">
                <Button onClick={handleSalvarMargem} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Margens
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ambientes */}
        <TabsContent value="ambiente">
          <Card>
            <CardHeader>
              <CardTitle>Opções de Ambiente</CardTitle>
              <CardDescription>
                Configure os ambientes disponíveis para seleção nos produtos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={novoAmbiente}
                  onChange={(e) => setNovoAmbiente(e.target.value)}
                  placeholder="Nome do ambiente"
                  onKeyDown={(e) => e.key === 'Enter' && adicionarAmbiente()}
                />
                <Button variant="outline" onClick={adicionarAmbiente}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {opcoesAmbiente.map((ambiente, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md"
                  >
                    <span>{ambiente}</span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => removerAmbiente(index)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={handleSalvarAmbientes} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Ambientes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
