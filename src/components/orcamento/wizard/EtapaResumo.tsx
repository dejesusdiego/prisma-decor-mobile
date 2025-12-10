import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Cortina, DadosOrcamento, Material } from '@/types/orcamento';
import { fetchMateriaisPaginados } from '@/lib/fetchMateriaisPaginados';
import { OPCOES_MARGEM } from '@/types/orcamento';
import { calcularResumoOrcamento, calcularConsumoDetalhado, calcularResumoConsolidado } from '@/lib/calculosOrcamento';
import { FileDown, Home, Save, ChevronDown, Ruler, Package, Scissors, Wrench } from 'lucide-react';
import { DialogValidade } from '../DialogValidade';
import { gerarPdfOrcamento } from '@/lib/gerarPdfOrcamento';

interface EtapaResumoProps {
  orcamentoId: string;
  cortinas: Cortina[];
  dadosCliente: DadosOrcamento;
  onVoltar: () => void;
  onFinalizar: () => void;
}

export function EtapaResumo({
  orcamentoId,
  cortinas,
  dadosCliente,
  onVoltar,
  onFinalizar,
}: EtapaResumoProps) {
  const [margemTipo, setMargemTipo] = useState<string>('padrao');
  const [margemPersonalizada, setMargemPersonalizada] = useState<number>(61.5);
  const [loading, setLoading] = useState(false);
  const [dialogValidadeOpen, setDialogValidadeOpen] = useState(false);
  const [validadeDias, setValidadeDias] = useState<number>(7);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});

  const margemAtual =
    margemTipo === 'personalizada'
      ? margemPersonalizada
      : OPCOES_MARGEM.find((m) => m.label.toLowerCase().includes(margemTipo))?.valor || 61.5;

  const resumo = calcularResumoOrcamento(cortinas, margemAtual);
  const resumoConsolidado = calcularResumoConsolidado(cortinas, materiais);

  // Carregar validade e materiais do banco de dados
  useEffect(() => {
    const carregarDados = async () => {
      // Carregar validade
      const { data, error } = await supabase
        .from('orcamentos')
        .select('validade_dias')
        .eq('id', orcamentoId)
        .single();

      if (!error && data?.validade_dias) {
        setValidadeDias(data.validade_dias);
      }

      // Carregar materiais do banco de dados Supabase com paginação
      try {
        const materiaisData = await fetchMateriaisPaginados(undefined, true);
        console.log('[EtapaResumo] Materiais carregados:', materiaisData.length);
        setMateriais(materiaisData);
      } catch (materiaisError) {
        console.error('Erro ao carregar materiais:', materiaisError);
      }
    };

    carregarDados();
  }, [orcamentoId, cortinas]);

  const obterMaterial = (codigoOuId: string | undefined): Material | null => {
    if (!codigoOuId) return null;
    const material = materiais.find(m => m.codigo_item === codigoOuId || m.id === codigoOuId);
    return material || null;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatMeters = (value: number) => {
    return value.toFixed(2) + 'm';
  };

  const toggleCard = (index: number) => {
    setExpandedCards(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const salvarOrcamento = async (status: 'rascunho' | 'finalizado') => {
    setLoading(true);
    try {
      const markup = 1 + margemAtual / 100;

      for (const cortina of cortinas) {
        if (cortina.id) {
          const precoVendaItem = (cortina.custoTotal || 0) * markup;
          const { error } = await supabase
            .from('cortina_items')
            .update({
              preco_venda: precoVendaItem,
            })
            .eq('id', cortina.id);

          if (error) throw error;
        }
      }

      const { error: orcError } = await supabase
        .from('orcamentos')
        .update({
          margem_tipo: margemTipo,
          margem_percent: margemAtual,
          subtotal_materiais: resumo.subtotalMateriais,
          subtotal_mao_obra_costura: resumo.subtotalMaoObraCostura,
          subtotal_instalacao: resumo.subtotalInstalacao,
          custo_total: resumo.custoTotal,
          total_geral: resumo.totalGeral,
          status,
        })
        .eq('id', orcamentoId);

      if (orcError) throw orcError;

      toast({
        title: 'Sucesso',
        description: `Orçamento ${status === 'finalizado' ? 'finalizado' : 'salvo'} com sucesso`,
      });

      onFinalizar();
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o orçamento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGerarPDF = () => {
    setDialogValidadeOpen(true);
  };

  const handleConfirmarValidade = async (novaValidade: number) => {
    setLoading(true);
    try {
      const markup = 1 + margemAtual / 100;

      for (const cortina of cortinas) {
        if (cortina.id) {
          const precoVendaItem = (cortina.custoTotal || 0) * markup;
          const { error } = await supabase
            .from('cortina_items')
            .update({
              preco_venda: precoVendaItem,
            })
            .eq('id', cortina.id);

          if (error) throw error;
        }
      }

      const { error: orcError } = await supabase
        .from('orcamentos')
        .update({
          margem_tipo: margemTipo,
          margem_percent: margemAtual,
          subtotal_materiais: resumo.subtotalMateriais,
          subtotal_mao_obra_costura: resumo.subtotalMaoObraCostura,
          subtotal_instalacao: resumo.subtotalInstalacao,
          custo_total: resumo.custoTotal,
          total_geral: resumo.totalGeral,
          validade_dias: novaValidade,
        })
        .eq('id', orcamentoId);

      if (orcError) throw orcError;

      setValidadeDias(novaValidade);

      await gerarPdfOrcamento(orcamentoId);

      toast({
        title: 'Sucesso',
        description: 'PDF gerado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o PDF',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Renderizar detalhes de consumo para cortinas
  const renderConsumoDetalhado = (cortina: Cortina, index: number) => {
    if (cortina.tipoProduto !== 'cortina') return null;
    
    const consumo = calcularConsumoDetalhado(cortina, materiais);
    const tecido = obterMaterial(cortina.tecidoId);
    const forro = obterMaterial(cortina.forroId);
    const trilho = obterMaterial(cortina.trilhoId);
    const barraTecido_m = (cortina.barraCm || 0) / 100;
    const barraForro_m = (cortina.barraForroCm ?? cortina.barraCm ?? 0) / 100;

    return (
      <Collapsible open={expandedCards[index]} onOpenChange={() => toggleCard(index)}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between mt-2 text-muted-foreground hover:text-foreground">
            <span className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Detalhamento de Consumo e Custos
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${expandedCards[index] ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-3">
          <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
            {/* Tecido */}
            {tecido && consumo.consumoTecido_m > 0 && (
              <div className="flex justify-between items-start border-b border-border/50 pb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Package className="h-3 w-3 text-primary" />
                    <span className="font-medium">Tecido</span>
                    {consumo.calculoPorAlturaTecido ? (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                        Cálculo por Altura
                      </span>
                    ) : (
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">
                        Metro Linear
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatMeters(consumo.consumoTecido_m)} × {formatCurrency(tecido.preco_custo)}/m
                    {` (rolo: ${consumo.larguraRoloTecido_m}m)`}
                  </p>
                  {consumo.calculoPorAlturaTecido ? (
                    <div className="text-xs text-muted-foreground bg-background/50 p-1.5 rounded mt-1 space-y-0.5">
                      <p><strong>Fórmula:</strong> Nº panos × Altura pano × Qtd</p>
                      <p>
                        Altura pano: {cortina.altura}m + 0.16m (costura) + {barraTecido_m.toFixed(2)}m (barra) = <strong>{consumo.alturaPanoTecido.toFixed(2)}m</strong>
                      </p>
                      <p>
                        Nº panos: ⌈({cortina.largura}m × {consumo.coeficienteTecido}) ÷ {consumo.larguraRoloTecido_m}m⌉ = <strong>{consumo.numeroPanosTecido}</strong>
                      </p>
                      <p>
                        Consumo: {consumo.numeroPanosTecido} × {consumo.alturaPanoTecido.toFixed(2)}m × {cortina.quantidade} = <strong>{consumo.consumoTecido_m.toFixed(2)}m</strong>
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground bg-background/50 p-1.5 rounded mt-1 space-y-0.5">
                      <p><strong>Fórmula:</strong> Largura × Coeficiente × Qtd</p>
                      <p>
                        Consumo: {cortina.largura}m × {consumo.coeficienteTecido} × {cortina.quantidade} = <strong>{consumo.consumoTecido_m.toFixed(2)}m</strong>
                      </p>
                    </div>
                  )}
                </div>
                <span className="font-semibold text-right">{formatCurrency(cortina.custoTecido || 0)}</span>
              </div>
            )}

            {/* Forro */}
            {forro && consumo.consumoForro_m > 0 && (
              <div className="flex justify-between items-start border-b border-border/50 pb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Package className="h-3 w-3 text-secondary-foreground" />
                    <span className="font-medium">Forro</span>
                    {consumo.calculoPorAlturaForro ? (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                        Cálculo por Altura
                      </span>
                    ) : (
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">
                        Metro Linear
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatMeters(consumo.consumoForro_m)} × {formatCurrency(forro.preco_custo)}/m
                    {` (rolo: ${consumo.larguraRoloForro_m}m)`}
                  </p>
                  {consumo.calculoPorAlturaForro ? (
                    <div className="text-xs text-muted-foreground bg-background/50 p-1.5 rounded mt-1 space-y-0.5">
                      <p><strong>Fórmula:</strong> Nº panos × Altura pano × Qtd</p>
                      <p>
                        Altura pano: {cortina.altura}m + 0.16m (costura) + {barraForro_m.toFixed(2)}m (barra forro) = <strong>{consumo.alturaPanoForro.toFixed(2)}m</strong>
                      </p>
                      <p>
                        Nº panos: ⌈({cortina.largura}m × {consumo.coeficienteForro}) ÷ {consumo.larguraRoloForro_m}m⌉ = <strong>{consumo.numeroPanosForro}</strong>
                      </p>
                      <p>
                        Consumo: {consumo.numeroPanosForro} × {consumo.alturaPanoForro.toFixed(2)}m × {cortina.quantidade} = <strong>{consumo.consumoForro_m.toFixed(2)}m</strong>
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground bg-background/50 p-1.5 rounded mt-1 space-y-0.5">
                      <p><strong>Fórmula:</strong> Largura × Coeficiente × Qtd</p>
                      <p>
                        Consumo: {cortina.largura}m × {consumo.coeficienteForro} × {cortina.quantidade} = <strong>{consumo.consumoForro_m.toFixed(2)}m</strong>
                      </p>
                    </div>
                  )}
                </div>
                <span className="font-semibold text-right">{formatCurrency(cortina.custoForro || 0)}</span>
              </div>
            )}

            {/* Trilho */}
            {trilho && consumo.comprimentoTrilho_m > 0 && (
              <div className="flex justify-between items-start border-b border-border/50 pb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Ruler className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">Trilho</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatMeters(consumo.comprimentoTrilho_m)} × {formatCurrency(trilho.preco_custo)}/m
                  </p>
                </div>
                <span className="font-semibold text-right">{formatCurrency(cortina.custoTrilho || 0)}</span>
              </div>
            )}

            {/* Costura */}
            {(cortina.custoCostura || 0) > 0 && (
              <div className="flex justify-between items-start border-b border-border/50 pb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Scissors className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">Costura</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatMeters(consumo.comprimentoCostura_m)} (comprimento)
                  </p>
                </div>
                <span className="font-semibold text-right">{formatCurrency(cortina.custoCostura || 0)}</span>
              </div>
            )}

            {/* Instalação */}
            {cortina.precisaInstalacao && (cortina.custoInstalacao || 0) > 0 && (
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">Instalação</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {cortina.pontosInstalacao || 1} ponto(s)
                  </p>
                </div>
                <span className="font-semibold text-right">{formatCurrency(cortina.custoInstalacao || 0)}</span>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Etapa 3 - Margem e Resumo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seleção de Margem */}
          <div className="space-y-4">
            <h3 className="font-semibold">Definir Margem de Lucro</h3>
            <RadioGroup value={margemTipo} onValueChange={setMargemTipo}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="baixa" id="baixa" />
                <Label htmlFor="baixa">Margem Baixa (40%)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="padrao" id="padrao" />
                <Label htmlFor="padrao">Margem Padrão (61.5%)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="premium" id="premium" />
                <Label htmlFor="premium">Margem Premium (80%)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="personalizada" id="personalizada" />
                <Label htmlFor="personalizada">Margem Personalizada</Label>
              </div>
            </RadioGroup>

            {margemTipo === 'personalizada' && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="margem-custom">Margem (%)</Label>
                <Input
                  id="margem-custom"
                  type="number"
                  min="0"
                  max="200"
                  step="0.1"
                  value={margemPersonalizada}
                  onChange={(e) => setMargemPersonalizada(parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
          </div>

          {/* Resumo Consolidado de Materiais */}
          {(resumoConsolidado.totalCortinas > 0 || resumoConsolidado.totalPersianas > 0) && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                Resumo de Materiais (Todo o Orçamento)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {resumoConsolidado.totalTecido_m > 0 && (
                  <div className="bg-background rounded p-2">
                    <p className="text-xs text-muted-foreground">Total Tecidos</p>
                    <p className="font-bold text-lg">{formatMeters(resumoConsolidado.totalTecido_m)}</p>
                  </div>
                )}
                {resumoConsolidado.totalForro_m > 0 && (
                  <div className="bg-background rounded p-2">
                    <p className="text-xs text-muted-foreground">Total Forros</p>
                    <p className="font-bold text-lg">{formatMeters(resumoConsolidado.totalForro_m)}</p>
                  </div>
                )}
                {resumoConsolidado.totalTrilho_m > 0 && (
                  <div className="bg-background rounded p-2">
                    <p className="text-xs text-muted-foreground">Total Trilhos</p>
                    <p className="font-bold text-lg">{formatMeters(resumoConsolidado.totalTrilho_m)}</p>
                  </div>
                )}
                {resumoConsolidado.totalPontosInstalacao > 0 && (
                  <div className="bg-background rounded p-2">
                    <p className="text-xs text-muted-foreground">Pontos Instalação</p>
                    <p className="font-bold text-lg">{resumoConsolidado.totalPontosInstalacao}</p>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-2 border-t border-border/50">
                {resumoConsolidado.totalCortinas > 0 && <span>{resumoConsolidado.totalCortinas} cortina(s)</span>}
                {resumoConsolidado.totalPersianas > 0 && <span>{resumoConsolidado.totalPersianas} persiana(s)</span>}
                {resumoConsolidado.totalOutros > 0 && <span>{resumoConsolidado.totalOutros} outro(s)</span>}
              </div>
            </div>
          )}

          {/* Resumo dos Produtos */}
          <div className="space-y-4">
            <h3 className="font-semibold">Produtos Incluídos ({cortinas.length})</h3>
            <div className="space-y-4">
              {cortinas.map((cortina, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">{cortina.nomeIdentificacao}</p>
                      <p className="text-sm text-muted-foreground">
                        {cortina.tipoProduto === 'cortina' ? 'Cortina' : cortina.tipoProduto === 'persiana' ? 'Persiana' : 'Outro'} - {cortina.tipoCortina}
                        {cortina.ambiente && <span className="ml-2">• {cortina.ambiente}</span>}
                      </p>
                    </div>
                    <p className="font-bold text-primary">
                      {formatCurrency((cortina.custoTotal || 0) * (1 + margemAtual / 100))}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Largura</p>
                      <p className="font-medium">{cortina.largura}m</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Altura</p>
                      <p className="font-medium">{cortina.altura}m</p>
                    </div>
                    {cortina.barraCm && (
                      <div>
                        <p className="text-xs text-muted-foreground">Barra</p>
                        <p className="font-medium">{cortina.barraCm}cm</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Quantidade</p>
                      <p className="font-medium">{cortina.quantidade}</p>
                    </div>
                  </div>

                  {cortina.tipoProduto === 'cortina' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Tecido */}
                      {(() => {
                        const tecido = obterMaterial(cortina.tecidoId);
                        return (
                          <div className="bg-muted/30 p-2 rounded border">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Tecido</p>
                            {tecido ? (
                              <>
                                <p className="text-sm font-medium mb-1">{tecido.nome}</p>
                                <div className="space-y-0.5">
                                  <p className="text-xs text-muted-foreground">
                                    Código: {tecido.codigo_item || '-'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Preço custo: {formatCurrency(tecido.preco_custo)}/m
                                  </p>
                                  {tecido.largura_metro && (
                                    <p className="text-xs text-muted-foreground">
                                      Largura rolo: {tecido.largura_metro}m
                                    </p>
                                  )}
                                </div>
                              </>
                            ) : (
                              <p className="text-sm">-</p>
                            )}
                          </div>
                        );
                      })()}

                      {/* Forro */}
                      {(() => {
                        const forro = obterMaterial(cortina.forroId);
                        return (
                          <div className="bg-muted/30 p-2 rounded border">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Forro</p>
                            {forro ? (
                              <>
                                <p className="text-sm font-medium mb-1">{forro.nome}</p>
                                <div className="space-y-0.5">
                                  <p className="text-xs text-muted-foreground">
                                    Código: {forro.codigo_item || '-'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Preço custo: {formatCurrency(forro.preco_custo)}/m
                                  </p>
                                  {forro.largura_metro && (
                                    <p className="text-xs text-muted-foreground">
                                      Largura rolo: {forro.largura_metro}m
                                    </p>
                                  )}
                                </div>
                              </>
                            ) : (
                              <p className="text-sm">-</p>
                            )}
                          </div>
                        );
                      })()}

                      {/* Trilho */}
                      {(() => {
                        const trilho = obterMaterial(cortina.trilhoId);
                        return (
                          <div className="bg-muted/30 p-2 rounded border">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Trilho</p>
                            {trilho ? (
                              <>
                                <p className="text-sm font-medium mb-1">{trilho.nome}</p>
                                <div className="space-y-0.5">
                                  <p className="text-xs text-muted-foreground">
                                    Código: {trilho.codigo_item || '-'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Preço custo: {formatCurrency(trilho.preco_custo)}/m
                                  </p>
                                </div>
                              </>
                            ) : (
                              <p className="text-sm">-</p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Detalhamento de Consumo (colapsável) */}
                  {renderConsumoDetalhado(cortina, index)}

                  {cortina.observacoesInternas && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg mt-3">
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-1">
                        📝 Observações Internas (uso interno - não aparecem no PDF)
                      </p>
                      <p className="text-sm text-amber-900 dark:text-amber-300">{cortina.observacoesInternas}</p>
                    </div>
                  )}

                  <div className="flex justify-between pt-2 border-t text-sm">
                    <span className="text-muted-foreground">Custo Total</span>
                    <span className="font-semibold">{formatCurrency(cortina.custoTotal || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Resumo Financeiro</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal Materiais:</span>
                <span>R$ {resumo.subtotalMateriais.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal Mão de Obra (Costura):</span>
                <span>R$ {resumo.subtotalMaoObraCostura.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal Instalação:</span>
                <span>R$ {resumo.subtotalInstalacao.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-medium">Custo Interno Total:</span>
                <span className="font-medium">R$ {resumo.custoTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Margem Aplicada:</span>
                <span className="text-muted-foreground">{margemAtual.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-lg font-bold">Total para o Cliente:</span>
                <span className="text-lg font-bold text-primary">
                  R$ {resumo.totalGeral.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={onVoltar} className="flex-1">
          Voltar
        </Button>
        <Button
          variant="outline"
          onClick={() => salvarOrcamento('rascunho')}
          disabled={loading}
          className="flex-1"
        >
          Salvar Rascunho
        </Button>
        <Button
          onClick={() => salvarOrcamento('finalizado')}
          disabled={loading}
          className="flex-1"
        >
          <Save className="mr-2 h-4 w-4" />
          Salvar Orçamento
        </Button>
        <Button onClick={handleGerarPDF} disabled={loading} className="flex-1" variant="secondary">
          <FileDown className="mr-2 h-4 w-4" />
          Gerar PDF
        </Button>
      </div>

      <Button variant="ghost" onClick={onFinalizar} className="w-full">
        <Home className="mr-2 h-4 w-4" />
        Voltar ao Início
      </Button>

      <DialogValidade
        open={dialogValidadeOpen}
        onOpenChange={setDialogValidadeOpen}
        onConfirmar={handleConfirmarValidade}
        validadeAtual={validadeDias}
      />
    </div>
  );
}
