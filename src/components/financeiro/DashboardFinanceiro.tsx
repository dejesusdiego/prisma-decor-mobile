import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle,
  AlertTriangle,
  Calendar,
  RefreshCw,
  ChevronRight,
  Landmark,
  Users,
  Receipt,
  Plus,
  ExternalLink
} from 'lucide-react';
import { useFinanceiroData } from '@/hooks/useFinanceiroData';
import { GraficoFluxoCaixa } from './charts/GraficoFluxoCaixa';
import { GraficoCategoriaDespesas } from './charts/GraficoCategoriaDespesas';
import { ListaContasPendentes } from './ListaContasPendentes';
import { ListaLancamentosRecentes } from './ListaLancamentosRecentes';
import { AlertasVencimento } from './AlertasVencimento';
import { WidgetPendenciasFinanceiras } from './WidgetPendenciasFinanceiras';
import { WidgetResumoConciliacao } from './WidgetResumoConciliacao';
import { AlertasConciliacao } from './AlertasConciliacao';
import { SeletorPeriodoGlobal } from './SeletorPeriodoGlobal';
import { BreadcrumbsFinanceiro } from './BreadcrumbsFinanceiro';
import { WidgetSaldoPeriodo } from './WidgetSaldoPeriodo';
import { WidgetReceitasDespesas } from './WidgetReceitasDespesas';
import { WidgetTopCategorias } from './WidgetTopCategorias';
import { usePeriodoFinanceiro, PeriodoFinanceiro } from '@/contexts/FinanceiroContext';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

interface DashboardFinanceiroProps {
  onNavigate?: (view: string) => void;
}

export function DashboardFinanceiro({ onNavigate }: DashboardFinanceiroProps) {
  const { periodo, setPeriodo, dateRange } = usePeriodoFinanceiro();
  
  const { 
    resumo, 
    fluxoCaixa, 
    despesasPorCategoria,
    contasPagarPendentes,
    contasReceberPendentes,
    lancamentosRecentes,
    isLoading,
    refetch 
  } = useFinanceiroData(dateRange.inicio, dateRange.fim);

  const periodoLabel = () => {
    switch (periodo) {
      case '7dias': return 'Últimos 7 dias';
      case '30dias': return 'Últimos 30 dias';
      case 'mesAtual': return format(new Date(), 'MMMM yyyy', { locale: ptBR });
      case 'mesAnterior': return format(subMonths(new Date(), 1), 'MMMM yyyy', { locale: ptBR });
      case '90dias': return 'Últimos 90 dias';
      default: return '';
    }
  };

  const handleNavigate = (view: string) => {
    if (onNavigate) {
      onNavigate(view);
    }
  };

  // Card com link para navegação
  const NavigationCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    variant, 
    onClick, 
    badge 
  }: { 
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ElementType;
    variant: 'default' | 'success' | 'danger' | 'warning';
    onClick?: () => void;
    badge?: { count: number; label: string };
  }) => {
    const colorClasses = {
      default: 'text-foreground',
      success: 'text-emerald-600 dark:text-emerald-400',
      danger: 'text-red-600 dark:text-red-400',
      warning: 'text-amber-600 dark:text-amber-400',
    };

    return (
      <Card 
        className={cn(
          "transition-all cursor-pointer hover:shadow-md hover:border-primary/30",
          badge?.count && badge.count > 0 && variant === 'warning' && "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20"
        )}
        onClick={onClick}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Icon className={cn("h-5 w-5", colorClasses[variant])} />
            {onClick && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn("text-2xl font-bold", colorClasses[variant])}>
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {badge && badge.count > 0 && (
            <Badge variant="secondary" className="mt-2 text-xs">
              {badge.count} {badge.label}
            </Badge>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <BreadcrumbsFinanceiro currentView="finDashboard" onNavigate={onNavigate} />
      
      {/* Header com período global */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Visão Geral Financeira</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Calendar className="h-4 w-4" />
            {periodoLabel()}
          </p>
        </div>
        <SeletorPeriodoGlobal
          periodo={periodo}
          onPeriodoChange={setPeriodo}
          onRefresh={refetch}
          isLoading={isLoading}
          showLabel={false}
        />
      </div>

      {/* Ações Rápidas */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => handleNavigate('finContasReceber')}>
          <Plus className="h-4 w-4 mr-1" />
          Nova Conta a Receber
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleNavigate('finContasPagar')}>
          <Plus className="h-4 w-4 mr-1" />
          Nova Conta a Pagar
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleNavigate('finLancamentos')}>
          <Receipt className="h-4 w-4 mr-1" />
          Novo Lançamento
        </Button>
      </div>

      {/* Cards de Resumo com navegação */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo do Período</CardTitle>
            <Wallet className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              resumo.saldo >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            )}>
              {formatCurrency(resumo.saldo)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              {resumo.saldo >= 0 ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span>Entradas - Saídas</span>
            </div>
          </CardContent>
        </Card>

        <NavigationCard
          title="Total de Entradas"
          value={formatCurrency(resumo.totalEntradas)}
          subtitle={`${resumo.quantidadeEntradas} lançamento(s)`}
          icon={ArrowUpCircle}
          variant="success"
          onClick={() => handleNavigate('finContasReceber')}
        />

        <NavigationCard
          title="Total de Saídas"
          value={formatCurrency(resumo.totalSaidas)}
          subtitle={`${resumo.quantidadeSaidas} lançamento(s)`}
          icon={ArrowDownCircle}
          variant="danger"
          onClick={() => handleNavigate('finContasPagar')}
        />

        <NavigationCard
          title="Pendências"
          value={String(resumo.contasPagarPendentes + resumo.contasReceberPendentes)}
          subtitle={`${resumo.contasPagarPendentes} a pagar • ${resumo.contasReceberPendentes} a receber`}
          icon={AlertTriangle}
          variant={resumo.contasAtrasadas > 0 ? 'warning' : 'default'}
          badge={resumo.contasAtrasadas > 0 ? { count: resumo.contasAtrasadas, label: 'atrasada(s)' } : undefined}
        />
      </div>

      {/* Links Rápidos para Módulos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button 
          variant="outline" 
          className="h-auto py-3 flex-col gap-1"
          onClick={() => handleNavigate('finFluxoPrevisto')}
        >
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="text-xs">Fluxo Previsto</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-3 flex-col gap-1"
          onClick={() => handleNavigate('finContasReceber')}
        >
          <Landmark className="h-5 w-5 text-primary" />
          <span className="text-xs">Conciliação</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-3 flex-col gap-1"
          onClick={() => handleNavigate('finComissoes')}
        >
          <Users className="h-5 w-5 text-primary" />
          <span className="text-xs">Comissões</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-3 flex-col gap-1"
          onClick={() => handleNavigate('finRelatorios')}
        >
          <ExternalLink className="h-5 w-5 text-primary" />
          <span className="text-xs">Relatórios</span>
        </Button>
      </div>

      {/* Alertas de Conciliação */}
      <AlertasConciliacao onNavigate={handleNavigate} />

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fluxo de Caixa - Ocupa 2 colunas */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Fluxo de Caixa</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={() => handleNavigate('finFluxoPrevisto')}
            >
              Ver detalhes
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <GraficoFluxoCaixa data={fluxoCaixa} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Despesas por Categoria */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Despesas por Categoria</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={() => handleNavigate('finRelatorios')}
            >
              Ver mais
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <GraficoCategoriaDespesas data={despesasPorCategoria} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>

      {/* Alertas e Listas - 8 Cards Nivelados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Linha 1: Cards Principais */}
        {/* Widget de Conciliação */}
        <WidgetResumoConciliacao onNavigate={handleNavigate} />

        {/* Widget de Pendências */}
        <WidgetPendenciasFinanceiras onNavigate={handleNavigate} />

        {/* Alertas de Vencimento */}
        <AlertasVencimento />

        {/* Contas Pendentes */}
        <ListaContasPendentes 
          contasPagar={contasPagarPendentes}
          contasReceber={contasReceberPendentes}
          isLoading={isLoading}
        />

        {/* Linha 2: Novos Cards */}
        {/* Saldo do Período */}
        <WidgetSaldoPeriodo 
          saldoAtual={resumo.saldo}
          dataInicio={dateRange.inicio}
          dataFim={dateRange.fim}
          onNavigate={handleNavigate}
        />

        {/* Receitas vs Despesas */}
        <WidgetReceitasDespesas 
          receitas={resumo.totalEntradas}
          despesas={resumo.totalSaidas}
          isLoading={isLoading}
          onNavigate={handleNavigate}
        />

        {/* Top Categorias de Despesas */}
        <WidgetTopCategorias 
          categorias={despesasPorCategoria}
          isLoading={isLoading}
          onNavigate={handleNavigate}
        />

        {/* Lançamentos Recentes */}
        <ListaLancamentosRecentes 
          lancamentos={lancamentosRecentes}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
