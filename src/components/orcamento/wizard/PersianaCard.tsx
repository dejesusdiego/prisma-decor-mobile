import { useState, useEffect } from 'react';
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
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Cortina, Material } from '@/types/orcamento';
import { OPCOES_AMBIENTE } from '@/types/orcamento';
import { MaterialSelector } from './MaterialSelector';
import { calcularValoresPersiana } from '@/lib/calculosOrcamento';

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
  const [persiana, setPersiana] = useState<Cortina>({
    ...persianaInicial,
    largura: persianaInicial.largura || 0,
    altura: persianaInicial.altura || 0,
    alturaComando: persianaInicial.alturaComando || 0,
  });
  const [expanded, setExpanded] = useState(!persianaInicial.id);
  const [persianas, setPersianas] = useState<Material[]>([]);
  const [loadingMateriais, setLoadingMateriais] = useState(false);

  useEffect(() => {
    carregarPersianas();
  }, []);

  const carregarPersianas = async () => {
    setLoadingMateriais(true);
    try {
      const { data, error } = await supabase
        .from('materiais')
        .select('*')
        .eq('categoria', 'persiana')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setPersianas(data || []);
    } catch (error) {
      console.error('Erro ao carregar persianas:', error);
      toast.error('Erro ao carregar lista de persianas');
    } finally {
      setLoadingMateriais(false);
    }
  };

  const handleMaterialSelect = (materialId: string | undefined) => {
    if (!materialId) {
      setPersiana({ 
        ...persiana, 
        materialPrincipalId: undefined,
        precoUnitario: 0,
        tipoCortina: 'rolo',
      });
      return;
    }

    const materialSelecionado = persianas.find(m => m.id === materialId);
    if (materialSelecionado) {
      // Mapear tipo do material para valores permitidos no enum
      let tipoCortina: Cortina['tipoCortina'] = 'rolo';
      const tipo = materialSelecionado.tipo?.toLowerCase();
      
      if (tipo === 'romana') tipoCortina = 'romana';
      else if (tipo === 'rolo') tipoCortina = 'rolo';
      else if (tipo === 'horizontal') tipoCortina = 'horizontal';
      else if (tipo === 'vertical') tipoCortina = 'vertical';
      else if (tipo === 'celular') tipoCortina = 'celular';
      else if (tipo === 'madeira') tipoCortina = 'madeira';
      
      setPersiana({
        ...persiana,
        materialPrincipalId: materialSelecionado.id,
        precoUnitario: materialSelecionado.preco_custo,
        tipoCortina,
      });
    }
  };

  // Calcular valores usando a nova função
  const calcularValores = () => {
    if (!persiana.largura || !persiana.altura || !persiana.precoUnitario) {
      return null;
    }

    return calcularValoresPersiana({
      larguraM: persiana.largura,
      alturaM: persiana.altura,
      quantidade: persiana.quantidade,
      precoCustoM2: persiana.precoUnitario,
    });
  };

  const valoresCalculados = calcularValores();

  const salvarPersiana = async () => {
    if (!persiana.nomeIdentificacao || !persiana.materialPrincipalId || !persiana.ambiente) {
      toast.error("Preencha todos os campos obrigatórios (nome, persiana e ambiente)");
      return;
    }

    if (!valoresCalculados) {
      toast.error("Erro ao calcular valores da persiana");
      return;
    }

    const custoInstalacao = persiana.precisaInstalacao && persiana.valorInstalacao 
      ? persiana.valorInstalacao 
      : 0;
    const custoTotal = valoresCalculados.custoTotal + custoInstalacao;

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
      motorizada: persiana.motorizada || false,
      preco_unitario: valoresCalculados.custoUnitario, // Custo por peça
      material_principal_id: persiana.materialPrincipalId,
      custo_total: custoTotal,
      precisa_instalacao: persiana.precisaInstalacao,
      custo_instalacao: custoInstalacao,
      observacoes_internas: persiana.observacoesInternas || null,
      // Campos não utilizados em persianas
      fabrica: null,
      tecido_id: null,
      forro_id: null,
      trilho_id: null,
      custo_tecido: 0,
      custo_forro: 0,
      custo_trilho: 0,
      custo_acessorios: 0,
      custo_costura: 0,
      preco_venda: null,
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
        alturaFaturadaM: valoresCalculados.alturaFaturadaM,
        areaM2: valoresCalculados.areaM2,
        custoTotal,
        custoInstalacao,
      };
      
      setPersiana(persianaAtualizada);
      onUpdate(persianaAtualizada);
      
      toast.success('Persiana salva com sucesso!');
      setExpanded(false);
    } catch (error) {
      console.error('Erro ao salvar persiana:', error);
      toast.error('Erro ao salvar persiana');
    }
  };

  const materialSelecionado = persianas.find(m => m.id === persiana.materialPrincipalId);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {persiana.nomeIdentificacao || 'Nova Persiana'}
            {!expanded && persiana.id && materialSelecionado && persiana.largura && persiana.altura && (
              <span className="text-sm text-muted-foreground font-normal">
                • {materialSelecionado.nome} • {persiana.largura}×{persiana.altura}m
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
          <div className="space-y-4">
            {/* IDENTIFICAÇÃO */}
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
            </div>

            {/* SELEÇÃO DO MATERIAL */}
            <div>
              <Label className="text-base font-semibold mb-2 block">Seleção do Material</Label>
              {loadingMateriais ? (
                <p className="text-sm text-muted-foreground">Carregando persianas...</p>
              ) : (
                <MaterialSelector
                  categoria="persiana"
                  materiais={persianas}
                  value={persiana.materialPrincipalId}
                  onSelect={handleMaterialSelect}
                  placeholder="Selecionar Persiana"
                  optional={false}
                />
              )}
            </div>

            {/* DIMENSÕES */}
            <div>
              <Label className="text-base font-semibold mb-2 block">Dimensões</Label>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Largura (m) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={persiana.largura || ''}
                    onChange={(e) => setPersiana({ ...persiana, largura: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <Label>Altura (m) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={persiana.altura || ''}
                    onChange={(e) => setPersiana({ ...persiana, altura: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <Label>Altura do Comando (m)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={persiana.alturaComando || ''}
                    onChange={(e) => setPersiana({ ...persiana, alturaComando: parseFloat(e.target.value) || 0 })}
                    placeholder="Não entra no cálculo"
                  />
                </div>

                <div>
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    min="1"
                    value={persiana.quantidade}
                    onChange={(e) => setPersiana({ ...persiana, quantidade: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              {/* Preview de cálculo detalhado */}
              {valoresCalculados && (
                <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                    📐 Cálculo de Área (regra da fábrica)
                  </p>
                  <div className="space-y-1 text-sm text-blue-800 dark:text-blue-400">
                    <p>Largura: {valoresCalculados.larguraM.toFixed(2)} m</p>
                    <p>Altura informada: {valoresCalculados.alturaM.toFixed(2)} m</p>
                    <p>Altura arredondada (módulo 5cm): {valoresCalculados.alturaArredondadaM.toFixed(2)} m</p>
                    <p className="font-semibold">Altura faturada (mín 1.20m): {valoresCalculados.alturaFaturadaM.toFixed(2)} m</p>
                    <p className="font-semibold">Área por peça: {valoresCalculados.areaM2.toFixed(2)} m²</p>
                    <p className="font-semibold text-base">Área total (×{persiana.quantidade}): {valoresCalculados.areaTotalM2.toFixed(2)} m²</p>
                  </div>
                </div>
              )}
            </div>

            {/* DESCRIÇÃO E OBSERVAÇÕES */}
            <div className="space-y-4">
              <div>
                <Label>Descrição (opcional)</Label>
                <Input
                  value={persiana.descricao || ''}
                  onChange={(e) => setPersiana({ ...persiana, descricao: e.target.value })}
                  placeholder="Ex: Persiana com blackout total"
                />
              </div>

              <div>
                <Label>Observações Internas (não aparecem no PDF)</Label>
                <Textarea
                  value={persiana.observacoesInternas || ''}
                  onChange={(e) => setPersiana({ ...persiana, observacoesInternas: e.target.value })}
                  placeholder="Anotações internas sobre este item..."
                  className="min-h-[80px]"
                />
              </div>
            </div>

            {/* OPÇÕES */}
            <div className="space-y-3">
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

              {persiana.precisaInstalacao && (
                <div className="ml-6">
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

            {/* RESUMO DE CUSTOS */}
            {valoresCalculados && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <Label className="text-base font-semibold mb-2 block">Resumo de Custos</Label>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Custo por m²:</span>
                    <span className="font-medium">R$ {(persiana.precoUnitario || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Custo unitário (por peça):</span>
                    <span className="font-medium">R$ {valoresCalculados.custoUnitario.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal material (×{persiana.quantidade}):</span>
                    <span className="font-medium">R$ {valoresCalculados.custoTotal.toFixed(2)}</span>
                  </div>
                  {persiana.precisaInstalacao && persiana.valorInstalacao && (
                    <div className="flex justify-between">
                      <span>Instalação:</span>
                      <span className="font-medium">R$ {persiana.valorInstalacao.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-primary/20">
                    <span className="font-semibold">CUSTO TOTAL:</span>
                    <span className="font-semibold text-primary">
                      R$ {(valoresCalculados.custoTotal + (persiana.valorInstalacao || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={onRemove} variant="outline" size="sm">
              Remover
            </Button>
            <Button onClick={salvarPersiana} size="sm">
              Salvar Persiana
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
