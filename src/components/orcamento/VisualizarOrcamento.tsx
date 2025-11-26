import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Cortina, Material, ServicoConfeccao, ServicoInstalacao } from '@/types/orcamento';

interface VisualizarOrcamentoProps {
  orcamentoId: string;
  onVoltar: () => void;
}

interface OrcamentoCompleto {
  id: string;
  codigo: string;
  cliente_nome: string;
  cliente_telefone: string;
  endereco: string;
  observacoes: string | null;
  status: string;
  margem_tipo: string;
  margem_percent: number;
  custo_total: number | null;
  total_geral: number | null;
  subtotal_materiais: number | null;
  subtotal_mao_obra_costura: number | null;
  subtotal_instalacao: number | null;
  created_at: string;
}

export function VisualizarOrcamento({ orcamentoId, onVoltar }: VisualizarOrcamentoProps) {
  const [orcamento, setOrcamento] = useState<OrcamentoCompleto | null>(null);
  const [cortinas, setCortinas] = useState<Cortina[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [servicosConfeccao, setServicosConfeccao] = useState<ServicoConfeccao[]>([]);
  const [servicosInstalacao, setServicosInstalacao] = useState<ServicoInstalacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar orçamento
        const { data: orcamentoData, error: orcamentoError } = await supabase
          .from('orcamentos')
          .select('*')
          .eq('id', orcamentoId)
          .single();

        if (orcamentoError) throw orcamentoError;
        setOrcamento(orcamentoData);

        // Carregar cortinas
        const { data: items, error: itemsError } = await supabase
          .from('cortina_items')
          .select('*')
          .eq('orcamento_id', orcamentoId);

        if (itemsError) throw itemsError;

        if (items) {
          const cortinasCarregadas: Cortina[] = items.map(item => ({
            id: item.id,
            nomeIdentificacao: item.nome_identificacao,
            largura: item.largura,
            altura: item.altura,
            barraCm: item.barra_cm || undefined,
            quantidade: item.quantidade,
            tipoProduto: (item.tipo_produto as 'cortina' | 'persiana' | 'outro') || 'cortina',
            tipoCortina: item.tipo_cortina as any,
            ambiente: item.ambiente || undefined,
            tecidoId: item.tecido_id || undefined,
            forroId: item.forro_id || undefined,
            trilhoId: item.trilho_id || undefined,
            materialPrincipalId: item.material_principal_id || undefined,
            descricao: item.descricao || undefined,
            fabrica: item.fabrica || undefined,
            motorizada: item.motorizada || false,
            precoUnitario: item.preco_unitario || undefined,
            valorInstalacao: item.tipo_produto === 'outro' ? item.custo_instalacao : undefined,
            precisaInstalacao: item.precisa_instalacao,
            pontosInstalacao: item.pontos_instalacao || undefined,
            observacoesInternas: item.observacoes_internas || undefined,
            custoTecido: item.custo_tecido || undefined,
            custoForro: item.custo_forro || undefined,
            custoTrilho: item.custo_trilho || undefined,
            custoMaterialPrincipal: item.custo_acessorios || undefined,
            custoCostura: item.custo_costura || undefined,
            custoInstalacao: item.custo_instalacao || undefined,
            custoTotal: item.custo_total || undefined,
            precoVenda: item.preco_venda || undefined,
          }));
          setCortinas(cortinasCarregadas);
        }

        // Carregar materiais
        const { data: materiaisData, error: materiaisError } = await supabase
          .from('materiais')
          .select('*')
          .eq('ativo', true);

        if (materiaisError) throw materiaisError;
        setMateriais(materiaisData || []);

        // Carregar serviços de confecção
        const { data: confeccaoData, error: confeccaoError } = await supabase
          .from('servicos_confeccao')
          .select('*')
          .eq('ativo', true);

        if (confeccaoError) throw confeccaoError;
        setServicosConfeccao(confeccaoData || []);

        // Carregar serviços de instalação
        const { data: instalacaoData, error: instalacaoError } = await supabase
          .from('servicos_instalacao')
          .select('*')
          .eq('ativo', true);

        if (instalacaoError) throw instalacaoError;
        setServicosInstalacao(instalacaoData || []);

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados do orçamento',
          variant: 'destructive',
        });
        onVoltar();
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [orcamentoId, onVoltar]);

  const obterNomeMaterial = (id: string | undefined) => {
    if (!id) return '-';
    const material = materiais.find(m => m.id === id);
    return material ? material.nome : '-';
  };

  const obterMaterial = (id: string | undefined): Material | null => {
    if (!id) return null;
    return materiais.find(m => m.id === id) || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando orçamento...</p>
        </div>
      </div>
    );
  }

  if (!orcamento) return null;

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getTipoCortina = (tipo: string) => {
    const tipos: Record<string, string> = {
      wave: 'Wave',
      prega: 'Prega',
      painel: 'Painel',
      rolo: 'Rolo',
      horizontal: 'Horizontal',
      vertical: 'Vertical',
      romana: 'Romana',
      celular: 'Celular',
      madeira: 'Madeira',
    };
    return tipos[tipo] || tipo;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onVoltar}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      {/* Dados do Cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Orçamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Código</p>
              <p className="text-lg font-semibold">{orcamento.codigo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="text-lg font-semibold capitalize">{orcamento.status}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cliente</p>
              <p className="text-lg">{orcamento.cliente_nome}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Telefone</p>
              <p className="text-lg">{orcamento.cliente_telefone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Endereço</p>
              <p className="text-lg">{orcamento.endereco}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Criação</p>
              <p className="text-lg">{formatDate(orcamento.created_at)}</p>
            </div>
          </div>
          {orcamento.observacoes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Observações</p>
              <p className="text-base">{orcamento.observacoes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos Incluídos ({cortinas.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cortinas.map((cortina, index) => (
            <div key={cortina.id || index} className="border-b pb-4 last:border-b-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-lg">{cortina.nomeIdentificacao}</p>
                  <p className="text-sm text-muted-foreground">
                    {cortina.tipoProduto === 'cortina' 
                      ? `Cortina - ${getTipoCortina(cortina.tipoCortina)}`
                      : cortina.tipoProduto === 'persiana' 
                      ? `Persiana - ${getTipoCortina(cortina.tipoCortina)}`
                      : cortina.descricao || 'Outros'
                    }
                  </p>
                </div>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(cortina.precoVenda)}
                </p>
              </div>
              
              {(cortina.tipoProduto === 'cortina' || cortina.tipoProduto === 'persiana') && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Largura</p>
                    <p className="text-sm font-medium">{cortina.largura.toFixed(2)}m</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Altura</p>
                    <p className="text-sm font-medium">{cortina.altura.toFixed(2)}m</p>
                  </div>
                  {cortina.barraCm && (
                    <div>
                      <p className="text-xs text-muted-foreground">Barra</p>
                      <p className="text-sm font-medium">{cortina.barraCm}cm</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Quantidade</p>
                    <p className="text-sm font-medium">{cortina.quantidade}</p>
                  </div>
                </div>
              )}

              {cortina.tipoProduto === 'outro' && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Quantidade</p>
                    <p className="text-sm font-medium">{cortina.quantidade}</p>
                  </div>
                  {cortina.precoUnitario && (
                    <div>
                      <p className="text-xs text-muted-foreground">Preço Unitário</p>
                      <p className="text-sm font-medium">{formatCurrency(cortina.precoUnitario)}</p>
                    </div>
                  )}
                  {cortina.ambiente && (
                    <div>
                      <p className="text-xs text-muted-foreground">Ambiente</p>
                      <p className="text-sm font-medium">{cortina.ambiente}</p>
                    </div>
                  )}
                </div>
              )}

              {cortina.tipoProduto === 'cortina' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  {/* Tecido */}
                  {(() => {
                    const tecido = obterMaterial(cortina.tecidoId);
                    return tecido ? (
                      <div className="bg-muted/30 p-3 rounded-lg border">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Tecido</p>
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
                      </div>
                    ) : (
                      <div className="bg-muted/30 p-3 rounded-lg border">
                        <p className="text-xs font-semibold text-muted-foreground">Tecido</p>
                        <p className="text-sm">-</p>
                      </div>
                    );
                  })()}
                  
                  {/* Forro */}
                  {(() => {
                    const forro = obterMaterial(cortina.forroId);
                    return forro ? (
                      <div className="bg-muted/30 p-3 rounded-lg border">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Forro</p>
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
                      </div>
                    ) : (
                      <div className="bg-muted/30 p-3 rounded-lg border">
                        <p className="text-xs font-semibold text-muted-foreground">Forro</p>
                        <p className="text-sm">-</p>
                      </div>
                    );
                  })()}
                  
                  {/* Trilho */}
                  {(() => {
                    const trilho = obterMaterial(cortina.trilhoId);
                    return trilho ? (
                      <div className="bg-muted/30 p-3 rounded-lg border">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Trilho</p>
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
                      </div>
                    ) : (
                      <div className="bg-muted/30 p-3 rounded-lg border">
                        <p className="text-xs font-semibold text-muted-foreground">Trilho</p>
                        <p className="text-sm">-</p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {cortina.tipoProduto === 'persiana' && cortina.materialPrincipalId && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground">Material Principal</p>
                  <p className="text-sm">{obterNomeMaterial(cortina.materialPrincipalId)}</p>
                </div>
              )}

              {cortina.tipoProduto === 'outro' && cortina.materialPrincipalId && (() => {
                const material = obterMaterial(cortina.materialPrincipalId);
                return material ? (
                  <div className="bg-muted/30 p-3 rounded-lg border mt-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Material Selecionado</p>
                    <p className="text-sm font-medium mb-1">{material.nome}</p>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">
                        Código: {material.codigo_item || '-'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Preço custo: {formatCurrency(material.preco_custo)}/{material.unidade}
                      </p>
                    </div>
                  </div>
                ) : null;
              })()}

              {cortina.observacoesInternas && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg mt-3">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-1">
                    📝 Observações Internas (uso interno - não aparecem no PDF)
                  </p>
                  <p className="text-sm text-amber-900 dark:text-amber-300">{cortina.observacoesInternas}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t">
                {cortina.tipoProduto !== 'outro' && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Custo Material</p>
                      <p className="text-sm font-medium">
                        {formatCurrency((cortina.custoTecido || 0) + (cortina.custoForro || 0) + (cortina.custoMaterialPrincipal || 0))}
                      </p>
                    </div>
                    {cortina.tipoProduto === 'cortina' && (
                      <div>
                        <p className="text-xs text-muted-foreground">Custo Costura</p>
                        <p className="text-sm font-medium">{formatCurrency(cortina.custoCostura)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Custo Trilho</p>
                      <p className="text-sm font-medium">{formatCurrency(cortina.custoTrilho)}</p>
                    </div>
                  </>
                )}
                {cortina.tipoProduto === 'outro' && cortina.precoUnitario && (
                  <div>
                    <p className="text-xs text-muted-foreground">Custo Produto</p>
                    <p className="text-sm font-medium">{formatCurrency(cortina.precoUnitario * cortina.quantidade)}</p>
                  </div>
                )}
                {cortina.precisaInstalacao && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Custo Instalação
                      {cortina.pontosInstalacao ? ` (${cortina.pontosInstalacao} pontos)` : ''}
                    </p>
                    <p className="text-sm font-medium">{formatCurrency(cortina.custoInstalacao)}</p>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-muted-foreground">Custo Total</p>
                  <p className="text-base font-semibold">{formatCurrency(cortina.custoTotal)}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Subtotal Materiais</span>
            <span className="font-medium">{formatCurrency(orcamento.subtotal_materiais)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Subtotal Mão de Obra (Costura)</span>
            <span className="font-medium">{formatCurrency(orcamento.subtotal_mao_obra_costura)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Subtotal Instalação</span>
            <span className="font-medium">{formatCurrency(orcamento.subtotal_instalacao)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="font-semibold">Custo Total</span>
            <span className="font-semibold">{formatCurrency(orcamento.custo_total)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">
              Margem ({orcamento.margem_tipo} - {orcamento.margem_percent}%)
            </span>
            <span className="font-medium">
              {formatCurrency((orcamento.total_geral || 0) - (orcamento.custo_total || 0))}
            </span>
          </div>
          <div className="flex justify-between pt-3 border-t-2">
            <span className="text-xl font-bold">Total para o Cliente</span>
            <span className="text-xl font-bold text-primary">{formatCurrency(orcamento.total_geral)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
