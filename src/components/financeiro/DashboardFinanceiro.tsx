import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle,
  AlertTriangle,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { useFinanceiroData } from '@/hooks/useFinanceiroData';
import { GraficoFluxoCaixa } from './charts/GraficoFluxoCaixa';
import { GraficoCategoriaDespesas } from './charts/GraficoCategoriaDespesas';
import { ListaContasPendentes } from './ListaContasPendentes';
import { ListaLancamentosRecentes } from './ListaLancamentosRecentes';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type PeriodoFiltro = '7dias' | '30dias' | 'mesAtual' | 'mesAnterior' | '90dias';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function DashboardFinanceiro() {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mesAtual');
  
  const getDateRange = () => {
    const hoje = new Date();
    switch (periodo) {
      case '7dias':
        return { inicio: subDays(hoje, 7), fim: hoje };
      case '30dias':
        return { inicio: subDays(hoje, 30), fim: hoje };
      case 'mesAtual':
        return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) };
      case 'mesAnterior':
        const mesAnterior = subMonths(hoje, 1);
        return { inicio: startOfMonth(mesAnterior), fim: endOfMonth(mesAnterior) };
      case '90dias':
        return { inicio: subDays(hoje, 90), fim: hoje };
      default:
        return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) };
    }
  };

  const { inicio, fim } = getDateRange();
  const { 
    resumo, 
    fluxoCaixa, 
    despesasPorCategoria,
    contasPagarPendentes,
    contasReceberPendentes,
    lancamentosRecentes,
    isLoading,
    refetch 
  } = useFinanceiroData(inicio, fim);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Financeiro</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Calendar className="h-4 w-4" />
            {periodoLabel()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoFiltro)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7dias">Últimos 7 dias</SelectItem>
              <SelectItem value="30dias">Últimos 30 dias</SelectItem>
              <SelectItem value="mesAtual">Mês Atual</SelectItem>
              <SelectItem value="mesAnterior">Mês Anterior</SelectItem>
              <SelectItem value="90dias">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo */}
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

        {/* Entradas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Entradas</CardTitle>
            <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(resumo.totalEntradas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {resumo.quantidadeEntradas} lançamento(s)
            </p>
          </CardContent>
        </Card>

        {/* Saídas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Saídas</CardTitle>
            <ArrowDownCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(resumo.totalSaidas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {resumo.quantidadeSaidas} lançamento(s)
            </p>
          </CardContent>
        </Card>

        {/* Contas Pendentes */}
        <Card className={cn(
          resumo.contasAtrasadas > 0 && "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20"
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendências</CardTitle>
            <AlertTriangle className={cn(
              "h-5 w-5",
              resumo.contasAtrasadas > 0 ? "text-amber-500" : "text-muted-foreground"
            )} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resumo.contasPagarPendentes + resumo.contasReceberPendentes}
            </div>
            <div className="flex flex-col gap-0.5 mt-1 text-xs text-muted-foreground">
              <span>{resumo.contasPagarPendentes} a pagar • {resumo.contasReceberPendentes} a receber</span>
              {resumo.contasAtrasadas > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  {resumo.contasAtrasadas} atrasada(s)
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fluxo de Caixa - Ocupa 2 colunas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Fluxo de Caixa</CardTitle>
          </CardHeader>
          <CardContent>
            <GraficoFluxoCaixa data={fluxoCaixa} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Despesas por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <GraficoCategoriaDespesas data={despesasPorCategoria} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>

      {/* Listas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contas Pendentes */}
        <ListaContasPendentes 
          contasPagar={contasPagarPendentes}
          contasReceber={contasReceberPendentes}
          isLoading={isLoading}
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
