import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Cortina, DadosOrcamento, Material } from '@/types/orcamento';
import { OPCOES_MARGEM } from '@/types/orcamento';
import { calcularResumoOrcamento } from '@/lib/calculosOrcamento';
import { FileDown, Home, Save } from 'lucide-react';
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

  const margemAtual =
    margemTipo === 'personalizada'
      ? margemPersonalizada
      : OPCOES_MARGEM.find((m) => m.label.toLowerCase().includes(margemTipo))?.valor || 61.5;

  const resumo = calcularResumoOrcamento(cortinas, margemAtual);

  // Carregar validade e materiais do banco de dados
  useEffect(() => {
    const carregarDados = async () => {
      console.log('🔄 Iniciando carregamento de dados...');
      
      // Carregar validade
      const { data, error } = await supabase
        .from('orcamentos')
        .select('validade_dias')
        .eq('id', orcamentoId)
        .single();

      if (!error && data?.validade_dias) {
        setValidadeDias(data.validade_dias);
      }

      // Carregar materiais do banco de dados Supabase
      const { data: materiaisData, error: materiaisError } = await supabase
        .from('materiais')
        .select('*')
        .eq('ativo', true);

      console.log('📦 Materiais carregados do banco:', materiaisData?.length || 0, 'materiais');
      
      if (materiaisError) {
        console.error('❌ Erro ao carregar materiais:', materiaisError);
      }

      if (materiaisData) {
        setMateriais(materiaisData);
      }
      
      // Debug: mostrar IDs das cortinas
      console.log('🎨 Cortinas:', cortinas.map(c => ({
        nome: c.nomeIdentificacao,
        tecidoId: c.tecidoId,
        forroId: c.forroId,
        trilhoId: c.trilhoId
      })));
    };

    carregarDados();
  }, [orcamentoId, cortinas]);

  const obterMaterial = (codigoOuId: string | undefined): Material | null => {
    if (!codigoOuId) return null;
    
    // Procura primeiro por codigo_item (para materiais novos) e depois por id (para materiais antigos)
    const material = materiais.find(m => m.codigo_item === codigoOuId || m.id === codigoOuId);
    return material || null;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const salvarOrcamento = async (status: 'rascunho' | 'finalizado') => {
    setLoading(true);
    try {
      const markup = 1 + margemAtual / 100;

      // Atualizar preços de venda das cortinas primeiro
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

      // Atualizar orçamento com margem e totais
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

      // Atualizar preços de venda das cortinas/persianas primeiro
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

      // Atualizar orçamento com margem, totais e validade
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

      // Gerar PDF
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
                                  {trilho.largura_metro && (
                                    <p className="text-xs text-muted-foreground">
                                      Largura rolo: {trilho.largura_metro}m
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
                    </div>
                  )}

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
