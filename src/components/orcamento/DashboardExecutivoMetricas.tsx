import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Receipt, 
  Target,
  ArrowRight,
  Percent
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useDashboardExecutivoMetricas } from '@/hooks/useDashboardExecutivoMetricas';
import { cn } from '@/lib/utils';

interface DashboardExecutivoMetricasProps {
  onNavigate: (view: string) => void;
}

export function DashboardExecutivoMetricas({ onNavigate }: DashboardExecutivoMetricasProps) {
  const { data, isLoading } = useDashboardExecutivoMetricas();
  const metricas = data?.metricas;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const diferencaMargem = (metricas?.margemMediaRealizada || 0) - (metricas?.margemMediaProjetada || 0);
  const margemPositiva = diferencaMargem >= 0;

  return (
    <div className="space-y-6">
      {/* KPIs Avançados */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* LTV */}
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">LTV Médio</span>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metricas?.ltv || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metricas?.totalClientes || 0} clientes únicos
            </p>
          </CardContent>
        </Card>

        {/* Ticket Médio */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">Ticket Médio</span>
              <Receipt className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metricas?.ticketMedio || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metricas?.totalOrcamentosPagos || 0} orçamentos pagos
            </p>
          </CardContent>
        </Card>

        {/* Margem Projetada */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">Margem Projetada</span>
              <Target className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold">{(metricas?.margemMediaProjetada || 0).toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              Média configurada
            </p>
          </CardContent>
        </Card>

        {/* Margem Realizada */}
        <Card className={cn(
          "border-l-4",
          margemPositiva ? "border-l-emerald-500" : "border-l-red-500"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">Margem Realizada</span>
              <Percent className={cn("h-4 w-4", margemPositiva ? "text-emerald-500" : "text-red-500")} />
            </div>
            <p className="text-2xl font-bold">{(metricas?.margemMediaRealizada || 0).toFixed(1)}%</p>
            <div className={cn(
              "flex items-center gap-1 text-xs mt-1",
              margemPositiva ? "text-emerald-600" : "text-red-600"
            )}>
              {margemPositiva ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(diferencaMargem).toFixed(1)}% vs projetada
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card de ação */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Relatório de Margem Real por Orçamento</h3>
              <p className="text-sm text-muted-foreground">
                Compare margem projetada vs realizada de cada orçamento
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onNavigate('finMargemReal')}
              className="gap-2"
            >
              Ver detalhes
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Explicação dos KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-muted/20">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              O que é LTV?
            </h4>
            <p className="text-sm text-muted-foreground">
              <strong>Lifetime Value</strong> é o valor médio total que cada cliente gasta ao longo 
              do relacionamento. Clientes recorrentes aumentam o LTV.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-muted/20">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Percent className="h-4 w-4 text-amber-500" />
              Margem Real vs Projetada
            </h4>
            <p className="text-sm text-muted-foreground">
              A margem <strong>projetada</strong> é configurada no orçamento. A margem <strong>realizada</strong> 
              {' '}considera recebimentos e custos efetivos pagos.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
