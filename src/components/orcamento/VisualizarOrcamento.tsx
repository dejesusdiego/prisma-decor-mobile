import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ChevronDown, AlertTriangle, Ruler, Package, Scissors, Wrench, Landmark, FileText, Link2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Cortina, Material, ServicoConfeccao, ServicoInstalacao } from '@/types/orcamento';
import { calcularConsumoDetalhado, calcularResumoConsolidado } from '@/lib/calculosOrcamento';
import { fetchMateriaisPaginados } from '@/lib/fetchMateriaisPaginados';
import { ResumoFinanceiroOrcamento } from './ResumoFinanceiroOrcamento';
import { RelatorioConciliacaoOrcamento } from './RelatorioConciliacaoOrcamento';
import { TimelineOrcamento } from './TimelineOrcamento';
import { DialogGerarContaReceber } from './dialogs/DialogGerarContaReceber';
import { DialogGerarCustos } from './dialogs/DialogGerarCustos';
import { DialogVincularLancamentoAoOrcamento } from '@/components/financeiro/dialogs/DialogVincularLancamentoAoOrcamento';
import { useOrcamentoFinanceiro } from '@/hooks/useOrcamentoFinanceiro';
import { TipBanner } from '@/components/ui/TipBanner';
import { HelpTooltip } from '@/components/ui/HelpTooltip';

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
  total_com_desconto?: number | null;
  subtotal_materiais: number | null;
  subtotal_mao_obra_costura: number | null;
  subtotal_instalacao: number | null;
  created_at: string;
  status_updated_at?: string | null;
}

export function VisualizarOrcamento({ orcamentoId, onVoltar }: VisualizarOrcamentoProps) {
  const [orcamento, setOrcamento] = useState<OrcamentoCompleto | null>(null);
  const [cortinas, setCortinas] = useState<Cortina[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [servicosConfeccao, setServicosConfeccao] = useState<ServicoConfeccao[]>([]);
  const [servicosInstalacao, setServicosInstalacao] = useState<ServicoInstalacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  
  // Diálogos
  const [dialogContaReceberOpen, setDialogContaReceberOpen] = useState(false);
  const [dialogCustosOpen, setDialogCustosOpen] = useState(false);
  const [dialogVincularLancamentoOpen, setDialogVincularLancamentoOpen] = useState(false);

  // Hook de integração financeira
  const {
    valorRecebido,
    rentabilidade,
    gerarContaReceber,
    gerarContasPagar,
    isGerandoContaReceber,
    isGerandoContasPagar,
    refetch: refetchFinanceiro
  } = useOrcamentoFinanceiro(orcamentoId);

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
          console.log('[DEBUG] Items carregados:', items.length, 'com forro_id:', items.filter(i => i.forro_id).map(i => ({ nome: i.nome_identificacao, forro_id: i.forro_id })));
          const cortinasCarregadas: Cortina[] = items.map(item => ({
            id: item.id,
            nomeIdentificacao: item.nome_identificacao,
            largura: item.largura,
            altura: item.altura,
            barraCm: item.barra_cm || undefined,
            barraForroCm: item.barra_forro_cm || undefined,
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

        // Carregar materiais com paginação
        try {
          const materiaisData = await fetchMateriaisPaginados(undefined, true);
          console.log('[VisualizarOrcamento] Materiais carregados:', materiaisData.length, 
            'categoria forro:', materiaisData.filter(m => m.categoria === 'forro').length);
          setMateriais(materiaisData);
        } catch (materiaisError) {
          console.error('Erro ao carregar materiais:', materiaisError);
        }

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
    const material = materiais.find(m => m.id === id || m.codigo_item === id);
    console.log('[DEBUG obterNomeMaterial] id:', id, 'encontrou:', material?.nome || 'NÃO ENCONTRADO', 'total materiais:', materiais.length);
    return material ? material.nome : '-';
  };

  const obterMaterial = (id: string | undefined): Material | null => {
    if (!id) return null;
    const material = materiais.find(m => m.id === id || m.codigo_item === id) || null;
    console.log('[DEBUG obterMaterial] id:', id, 'encontrou:', material?.nome || 'NÃO ENCONTRADO');
    return material;
  };

  const toggleCard = (index: number) => {
    setExpandedCards(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const resumoConsolidado = calcularResumoConsolidado(cortinas, materiais);

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

  const formatMeters = (value: number) => {
    return value.toFixed(2) + 'm';
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

  // Renderizar detalhes de consumo para cortinas
  const renderConsumoDetalhado = (cortina: Cortina, index: number) => {
    if (cortina.tipoProduto !== 'cortina') return null;
    
    const consumo = calcularConsumoDetalhado(cortina, materiais);
    const tecido = obterMaterial(cortina.tecidoId);
    const forro = obterMaterial(cortina.forroId);
    const trilho = obterMaterial(cortina.trilhoId);

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
                  <div className="flex items-center gap-2">
                    <Package className="h-3 w-3 text-primary" />
                    <span className="font-medium">Tecido</span>
                    {consumo.precisaEmendaTecido && (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                        <AlertTriangle className="h-3 w-3" />
                        Emenda
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatMeters(consumo.consumoTecido_m)} × {formatCurrency(tecido.preco_custo)}/m
                    {consumo.larguraRoloTecido_m && ` (rolo: ${consumo.larguraRoloTecido_m}m)`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Coef: {consumo.coeficienteTecido} • Qtd: {cortina.quantidade}
                  </p>
                </div>
                <span className="font-semibold text-right">{formatCurrency(cortina.custoTecido || 0)}</span>
              </div>
            )}

            {/* Forro */}
            {forro && consumo.consumoForro_m > 0 && (
              <div className="flex justify-between items-start border-b border-border/50 pb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Package className="h-3 w-3 text-secondary-foreground" />
                    <span className="font-medium">Forro</span>
                    {consumo.precisaEmendaForro && (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                        <AlertTriangle className="h-3 w-3" />
                        Emenda
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatMeters(consumo.consumoForro_m)} × {formatCurrency(forro.preco_custo)}/m
                    {consumo.larguraRoloForro_m && ` (rolo: ${consumo.larguraRoloForro_m}m)`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Coef: {consumo.coeficienteForro} • Qtd: {cortina.quantidade}
                  </p>
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

  // Handlers para diálogos
  const handleGerarContaReceber = (data: { 
    numeroParcelas: number; 
    dataPrimeiraParcela: Date;
    formaPagamentoId?: string;
    observacoes?: string;
  }) => {
    gerarContaReceber(data, {
      onSuccess: () => {
        setDialogContaReceberOpen(false);
        refetchFinanceiro();
      }
    });
  };

  const handleGerarCustos = (data: { 
    custos: { descricao: string; valor: number; categoriaId?: string }[]; 
    dataVencimento: Date;
  }) => {
    gerarContasPagar(data, {
      onSuccess: () => {
        setDialogCustosOpen(false);
        refetchFinanceiro();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onVoltar}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      {/* Dica de integração */}
      <TipBanner id="orcamento-visualizar-dica" variant="info">
        Use os botões no <strong>Resumo Financeiro</strong> abaixo para gerar contas a receber e registrar custos. 
        Isso integra automaticamente com o módulo financeiro!
      </TipBanner>

      {/* Timeline do Fluxo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            Fluxo do Orçamento
            <HelpTooltip content="Acompanhe o progresso do orçamento desde a criação até o pagamento completo" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimelineOrcamento
            status={orcamento.status}
            createdAt={orcamento.created_at}
            statusUpdatedAt={orcamento.status_updated_at}
            valorTotal={orcamento.total_com_desconto ?? orcamento.total_geral ?? 0}
            valorRecebido={valorRecebido}
            custoTotal={orcamento.custo_total ?? 0}
            custosPagos={rentabilidade?.custosPagos ?? 0}
          />
        </CardContent>
      </Card>

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

      {/* Resumo Consolidado de Materiais */}
      {(resumoConsolidado.totalCortinas > 0 || resumoConsolidado.totalPersianas > 0) && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              Resumo de Materiais (Todo o Orçamento)
            </CardTitle>
          </CardHeader>
          <CardContent>
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
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-3 mt-3 border-t border-border/50">
              {resumoConsolidado.totalCortinas > 0 && <span>{resumoConsolidado.totalCortinas} cortina(s)</span>}
              {resumoConsolidado.totalPersianas > 0 && <span>{resumoConsolidado.totalPersianas} persiana(s)</span>}
              {resumoConsolidado.totalOutros > 0 && <span>{resumoConsolidado.totalOutros} outro(s)</span>}
            </div>
          </CardContent>
        </Card>
      )}

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
                    {cortina.ambiente && <span className="ml-2">• {cortina.ambiente}</span>}
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

      {/* Abas Financeiro */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs defaultValue="resumo" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="resumo" className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                Resumo
              </TabsTrigger>
              <TabsTrigger value="custos" className="flex items-center gap-1.5">
                <Package className="h-4 w-4" />
                Custos
              </TabsTrigger>
              <TabsTrigger value="conciliacao" className="flex items-center gap-1.5">
                <Landmark className="h-4 w-4" />
                Conciliação
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resumo" className="space-y-4">
              <ResumoFinanceiroOrcamento 
                orcamentoId={orcamentoId}
                onGerarContaReceber={() => setDialogContaReceberOpen(true)}
                onGerarContasPagar={() => setDialogCustosOpen(true)}
              />
            </TabsContent>

            <TabsContent value="custos" className="space-y-3">
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
            </TabsContent>

            <TabsContent value="conciliacao" className="space-y-4">
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setDialogVincularLancamentoOpen(true)}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Vincular Lançamento Existente
                </Button>
              </div>
              <RelatorioConciliacaoOrcamento orcamentoId={orcamentoId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Diálogos */}
      {orcamento && (
        <>
          <DialogGerarContaReceber
            open={dialogContaReceberOpen}
            onOpenChange={setDialogContaReceberOpen}
            orcamento={orcamento}
            onConfirm={handleGerarContaReceber}
            isLoading={isGerandoContaReceber}
          />
          <DialogGerarCustos
            open={dialogCustosOpen}
            onOpenChange={setDialogCustosOpen}
            orcamento={orcamento}
            onConfirm={handleGerarCustos}
            isLoading={isGerandoContasPagar}
          />
          <DialogVincularLancamentoAoOrcamento
            open={dialogVincularLancamentoOpen}
            onOpenChange={setDialogVincularLancamentoOpen}
            orcamentoId={orcamentoId}
          />
        </>
      )}
    </div>
  );
}
