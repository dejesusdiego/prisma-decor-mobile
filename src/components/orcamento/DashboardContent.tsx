import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  DollarSign,
  ArrowUpRight,
  RefreshCw,
  Target,
  Wallet,
  Clock,
  Timer,
  HelpCircle
} from "lucide-react";
import { GraficoFaturamentoMensal } from "./charts/GraficoFaturamentoMensal";
import { FunilVendas } from "./charts/FunilVendas";
import { RankingProdutos } from "./charts/RankingProdutos";
import { GraficoCustos } from "./charts/GraficoCustos";
import { DistribuicaoCidades } from "./charts/DistribuicaoCidades";
import { MetaVendas } from "./charts/MetaVendas";
import { TendenciaIndicator } from "./charts/TendenciaIndicator";
import { AlertasOrcamentos } from "./AlertasOrcamentos";
import { StatsCardSkeleton, ChartSkeleton, FunilSkeleton, TableSkeleton } from "./DashboardSkeletons";
import { useDashboardData, PeriodoFiltro } from "@/hooks/useDashboardData";
import { formatCurrency, formatCompact } from "@/lib/calculosStatus";
import { getStatusConfig } from "@/lib/statusOrcamento";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OnboardingStep } from "@/components/onboarding/OnboardingStep";
import { useOnboardingContext } from "@/components/onboarding/OnboardingProvider";
import { DASHBOARD_TOUR } from "@/components/onboarding/tours";

interface DashboardContentProps {
  onNovoOrcamento: () => void;
  onMeusOrcamentos: () => void;
  onVisualizarOrcamento: (id: string) => void;
}

export function DashboardContent({
  onNovoOrcamento,
  onMeusOrcamentos,
  onVisualizarOrcamento,
}: DashboardContentProps) {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('30d');
  const { 
    stats, 
    tendencias,
    funil, 
    recentOrcamentos, 
    dadosDiarios,
    dadosMensais, 
    alertas, 
    produtosRanking,
    custosComposicao,
    cidadesDistribuicao,
    tempoMedioConversao,
    metaVendas,
    isLoading, 
    refetch 
  } = useDashboardData(periodo);

  // Onboarding tour
  const { activeTour, currentStep, nextStep, prevStep, skipTour, completeTour, startTour, isTourCompleted } = useOnboardingContext();
  const isDashboardTourActive = activeTour === 'dashboard';
  const tourSteps = DASHBOARD_TOUR;

  const periodoLabel = () => {
    switch (periodo) {
      case '7d': return 'Últimos 7 dias';
      case '30d': return 'Últimos 30 dias';
      case '90d': return 'Últimos 90 dias';
      case '12m': return 'Últimos 12 meses';
      case 'mes_atual': return 'Mês atual';
      case 'all': return 'Todo o período';
      default: return '';
    }
  };

  const etapasFunil = funil.map(f => ({
    status: f.status,
    label: f.label,
    quantidade: f.quantidade,
    valor: f.valor,
    cor: f.color,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard de Orçamentos</h1>
            <p className="text-muted-foreground mt-1">{periodoLabel()}</p>
          </div>
          {!isTourCompleted('dashboard') && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => startTour('dashboard')}
              className="text-muted-foreground hover:text-primary"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              Tour
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <OnboardingStep
            active={isDashboardTourActive && currentStep === 2}
            stepNumber={3}
            totalSteps={tourSteps.length}
            title={tourSteps[2]?.title || ''}
            description={tourSteps[2]?.description || ''}
            position="bottom"
            onNext={nextStep}
            onPrev={prevStep}
            onSkip={skipTour}
            onComplete={() => completeTour('dashboard')}
          >
            <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoFiltro)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="12m">Últimos 12 meses</SelectItem>
                <SelectItem value="mes_atual">Mês atual</SelectItem>
                <SelectItem value="all">Todo período</SelectItem>
              </SelectContent>
            </Select>
          </OnboardingStep>
          <Button variant="outline" size="icon" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards com Tendências */}
      <OnboardingStep
        active={isDashboardTourActive && currentStep === 1}
        stepNumber={2}
        totalSteps={tourSteps.length}
        title={tourSteps[1]?.title || ''}
        description={tourSteps[1]?.description || ''}
        position="bottom"
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={skipTour}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {isLoading ? (
          <StatsCardSkeleton count={5} />
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Orçamentos</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{stats.totalOrcamentos}</span>
                  <TendenciaIndicator 
                    tipo={tendencias.totalOrcamentos.tipo} 
                    percentual={tendencias.totalOrcamentos.percentual} 
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ticket médio: {formatCurrency(stats.ticketMedio)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{formatCompact(stats.valorTotal)}</span>
                  <TendenciaIndicator 
                    tipo={tendencias.valorTotal.tipo} 
                    percentual={tendencias.valorTotal.percentual} 
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Recebido: {formatCompact(stats.valorRecebido)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{stats.taxaConversao.toFixed(1)}%</span>
                  <TendenciaIndicator 
                    tipo={tendencias.taxaConversao.tipo} 
                    percentual={tendencias.taxaConversao.percentual} 
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Margem média: {stats.margemMedia.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">A Receber</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{formatCompact(stats.valorAReceber)}</span>
                  <TendenciaIndicator 
                    tipo={tendencias.valorAReceber.tipo} 
                    percentual={tendencias.valorAReceber.percentual} 
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Lucro proj.: {formatCompact(stats.lucroProjetado)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tempoMedioConversao} <span className="text-sm font-normal text-muted-foreground">dias</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Para conversão
                </p>
              </CardContent>
            </Card>
          </>
        )}
        </div>
      </OnboardingStep>

      {/* Charts Row 1: Faturamento + Funil */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isLoading ? (
          <>
            <ChartSkeleton />
            <FunilSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardContent className="pt-4">
                {dadosDiarios.length > 0 || dadosMensais.length > 0 ? (
                  <GraficoFaturamentoMensal dadosDiarios={dadosDiarios} dadosMensais={dadosMensais} />
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    Sem dados para o período
                  </div>
                )}
              </CardContent>
            </Card>

            {etapasFunil.length > 0 ? (
              <FunilVendas etapas={etapasFunil} />
            ) : (
              <Card>
                <CardContent className="h-[250px] flex items-center justify-center text-muted-foreground">
                  Sem dados para o período
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Charts Row 2: Ranking + Custos + Cidades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <TableSkeleton rows={5} />
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <RankingProdutos produtos={produtosRanking} />
            <GraficoCustos dados={custosComposicao} />
            <DistribuicaoCidades dados={cidadesDistribuicao} />
          </>
        )}
      </div>

      {/* Row 3: Meta + Alertas + Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
            <div className="lg:col-span-2">
              <TableSkeleton rows={5} />
            </div>
          </>
        ) : (
          <>
            <div className="lg:col-span-1">
              <MetaVendas meta={metaVendas.meta} realizado={metaVendas.realizado} />
            </div>
            
            <div className="lg:col-span-1">
              <AlertasOrcamentos 
                alertas={alertas} 
                isLoading={isLoading}
                onVisualizarOrcamento={onVisualizarOrcamento}
              />
            </div>

            <OnboardingStep
              active={isDashboardTourActive && currentStep === 3}
              stepNumber={4}
              totalSteps={tourSteps.length}
              title={tourSteps[3]?.title || ''}
              description={tourSteps[3]?.description || ''}
              position="top"
              onNext={nextStep}
              onPrev={prevStep}
              onSkip={skipTour}
              onComplete={() => {
                completeTour('dashboard');
                // Toast será mostrado pelo hook useOnboarding se necessário
              }}
            >
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Orçamentos Recentes
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={onMeusOrcamentos}>
                    Ver todos
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {recentOrcamentos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum orçamento encontrado</p>
                      <p className="text-sm mt-2">Use o botão "Novo Orçamento" na sidebar para criar um orçamento.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentOrcamentos.slice(0, 5).map((orc) => {
                        const statusConfig = getStatusConfig(orc.status);
                        return (
                          <div
                            key={orc.id}
                            onClick={() => onVisualizarOrcamento(orc.id)}
                            className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{orc.codigo}</span>
                                <Badge 
                                  variant={statusConfig.badgeVariant as any}
                                  className="text-xs"
                                >
                                  {statusConfig.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {orc.cliente_nome}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(orc.created_at), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-medium">
                                {formatCurrency(orc.total_com_desconto || orc.total_geral || 0)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </OnboardingStep>
          </>
        )}
      </div>
    </div>
  );
}
