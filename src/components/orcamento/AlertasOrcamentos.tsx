import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Clock, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/calculosStatus";
import { cn } from "@/lib/utils";

interface OrcamentoAlerta {
  id: string;
  codigo: string;
  cliente_nome: string;
  tipo: 'vencendo' | 'sem_resposta' | 'vencido';
  diasRestantes?: number;
  diasSemResposta?: number;
  valor: number;
}

interface AlertasOrcamentosProps {
  alertas: OrcamentoAlerta[];
  isLoading?: boolean;
  onVisualizarOrcamento?: (id: string) => void;
}

export function AlertasOrcamentos({ alertas, isLoading, onVisualizarOrcamento }: AlertasOrcamentosProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (alertas.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            Alertas de Orçamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum alerta no momento
          </p>
        </CardContent>
      </Card>
    );
  }

  const getAlertConfig = (tipo: OrcamentoAlerta['tipo']) => {
    switch (tipo) {
      case 'vencido':
        return {
          icon: AlertCircle,
          bgColor: 'bg-destructive/10',
          textColor: 'text-destructive',
          borderColor: 'border-destructive/30',
          label: 'Vencido',
        };
      case 'vencendo':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-orange-500/10',
          textColor: 'text-orange-600',
          borderColor: 'border-orange-500/30',
          label: 'Vencendo',
        };
      case 'sem_resposta':
        return {
          icon: Clock,
          bgColor: 'bg-amber-500/10',
          textColor: 'text-amber-600',
          borderColor: 'border-amber-500/30',
          label: 'Sem resposta',
        };
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          Alertas de Orçamentos
          <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
            {alertas.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alertas.slice(0, 5).map((alerta) => {
          const config = getAlertConfig(alerta.tipo);
          const Icon = config.icon;

          return (
            <div
              key={alerta.id}
              onClick={() => onVisualizarOrcamento?.(alerta.id)}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50",
                config.bgColor,
                config.borderColor
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", config.textColor)} />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{alerta.codigo}</p>
                    <p className="text-xs text-muted-foreground truncate">{alerta.cliente_nome}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", config.bgColor, config.textColor)}>
                    {config.label}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {alerta.tipo === 'vencido' && `${Math.abs(alerta.diasRestantes || 0)} dias`}
                    {alerta.tipo === 'vencendo' && `${alerta.diasRestantes} dias`}
                    {alerta.tipo === 'sem_resposta' && `${alerta.diasSemResposta} dias`}
                  </p>
                </div>
              </div>
              <p className="text-sm font-medium mt-1 text-right">{formatCurrency(alerta.valor)}</p>
            </div>
          );
        })}
        {alertas.length > 5 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            +{alertas.length - 5} outros alertas
          </p>
        )}
      </CardContent>
    </Card>
  );
}
