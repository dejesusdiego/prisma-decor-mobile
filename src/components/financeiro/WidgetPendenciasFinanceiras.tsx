import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  FileQuestion, 
  Clock, 
  CreditCard,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { usePendenciasFinanceiras } from '@/hooks/usePendenciasFinanceiras';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

interface WidgetPendenciasFinanceirasProps {
  onNavigate?: (view: string) => void;
}

export function WidgetPendenciasFinanceiras({ onNavigate }: WidgetPendenciasFinanceirasProps) {
  const { data: pendencias, isLoading } = usePendenciasFinanceiras();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Pendências
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!pendencias || pendencias.totalPendencias === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Tudo em Dia!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Não há pendências financeiras no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  const items = [
    {
      icon: FileQuestion,
      label: 'Lançamentos Órfãos',
      count: pendencias.lancamentosOrfaos,
      value: pendencias.valorLancamentosOrfaos,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      action: () => onNavigate?.('finConciliacao')
    },
    {
      icon: Clock,
      label: 'Parcelas Atrasadas',
      count: pendencias.parcelasAtrasadas,
      value: pendencias.valorParcelasAtrasadas,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      action: () => onNavigate?.('finContasReceber')
    },
    {
      icon: CreditCard,
      label: 'Contas a Pagar Atrasadas',
      count: pendencias.contasPagarAtrasadas,
      value: pendencias.valorContasPagarAtrasadas,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      action: () => onNavigate?.('finContasPagar')
    },
  ].filter(item => item.count > 0);

  return (
    <Card className={cn(
      pendencias.totalPendencias > 5 && "border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className={cn(
              "h-4 w-4",
              pendencias.totalPendencias > 5 ? "text-amber-600" : "text-muted-foreground"
            )} />
            Pendências
          </CardTitle>
          <Badge variant={pendencias.totalPendencias > 5 ? "destructive" : "secondary"}>
            {pendencias.totalPendencias} itens
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={item.action}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left",
              item.bgColor,
              "hover:opacity-80"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className={cn("h-4 w-4", item.color)} />
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">
                  {item.count} item(s) • {formatCurrency(item.value)}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}

        {pendencias.orcamentosSemConciliacao > 0 && (
          <button
            onClick={() => onNavigate?.('finConciliacao')}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 hover:opacity-80 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Orçamentos sem Conciliação</p>
                <p className="text-xs text-muted-foreground">
                  {pendencias.orcamentosSemConciliacao} orçamento(s) aguardando
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2"
          onClick={() => onNavigate?.('finConciliacao')}
        >
          Ver Central de Conciliação
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
