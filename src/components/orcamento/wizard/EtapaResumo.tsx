import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Cortina, DadosOrcamento } from '@/types/orcamento';
import { OPCOES_MARGEM } from '@/types/orcamento';
import { calcularResumoOrcamento } from '@/lib/calculosOrcamento';
import { FileDown, Home } from 'lucide-react';
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

  const margemAtual =
    margemTipo === 'personalizada'
      ? margemPersonalizada
      : OPCOES_MARGEM.find((m) => m.label.toLowerCase().includes(margemTipo))?.valor || 61.5;

  const resumo = calcularResumoOrcamento(cortinas, margemAtual);

  // Carregar validade atual do orçamento
  useEffect(() => {
    const carregarValidade = async () => {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('validade_dias')
        .eq('id', orcamentoId)
        .single();

      if (!error && data?.validade_dias) {
        setValidadeDias(data.validade_dias);
      }
    };

    carregarValidade();
  }, [orcamentoId]);

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
      // Salvar validade no banco
      const { error } = await supabase
        .from('orcamentos')
        .update({ validade_dias: novaValidade })
        .eq('id', orcamentoId);

      if (error) throw error;

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

          {/* Resumo das Cortinas */}
          <div className="space-y-4">
            <h3 className="font-semibold">Cortinas Incluídas</h3>
            <div className="space-y-2">
              {cortinas.map((cortina, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-muted rounded-md"
                >
                  <div>
                    <p className="font-medium">{cortina.nomeIdentificacao}</p>
                    <p className="text-sm text-muted-foreground">
                      {cortina.largura}m × {cortina.altura}m - {cortina.tipoCortina} - Qtd:{' '}
                      {cortina.quantidade}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      R$ {((cortina.custoTotal || 0) * (1 + margemAtual / 100)).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Custo: R$ {(cortina.custoTotal || 0).toFixed(2)}
                    </p>
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
        <Button onClick={handleGerarPDF} disabled={loading} className="flex-1">
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
