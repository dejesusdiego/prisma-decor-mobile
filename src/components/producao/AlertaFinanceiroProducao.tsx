import { useMemo } from 'react';
import { AlertTriangle, DollarSign, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePedidosFinanceiros, STATUS_LIBERACAO_LABELS } from '@/hooks/usePedidoFinanceiro';
import { formatCurrency } from '@/lib/formatters';

interface AlertaFinanceiroProducaoProps {
  pedidoIds: string[];
  onNavigateToFinanceiro?: () => void;
}

export function AlertaFinanceiroProducao({ pedidoIds, onNavigateToFinanceiro }: AlertaFinanceiroProducaoProps) {
  const { data: statusMap } = usePedidosFinanceiros(pedidoIds);

  const resumo = useMemo(() => {
    if (!statusMap) return { bloqueados: 0, aguardandoInstalacao: 0, valorPendente: 0 };

    let bloqueados = 0;
    let aguardandoInstalacao = 0;
    let valorPendente = 0;

    Object.values(statusMap).forEach(status => {
      if (status.statusLiberacao === 'bloqueado') {
        bloqueados++;
        valorPendente += status.valorPendente;
      } else if (status.statusLiberacao === 'materiais_liberados') {
        aguardandoInstalacao++;
        valorPendente += status.valorPendente;
      }
    });

    return { bloqueados, aguardandoInstalacao, valorPendente };
  }, [statusMap]);

  // Não exibir se não há pendências
  if (resumo.bloqueados === 0 && resumo.aguardandoInstalacao === 0) {
    return null;
  }

  return (
    <Alert 
      variant={resumo.bloqueados > 0 ? 'destructive' : 'default'}
      className={resumo.bloqueados > 0 
        ? 'border-red-500/50 bg-red-500/5' 
        : 'border-yellow-500/50 bg-yellow-500/5'
      }
    >
      <DollarSign className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        <span>Pendências Financeiras na Produção</span>
        {resumo.bloqueados > 0 && (
          <Badge variant="destructive" className="text-xs">
            {resumo.bloqueados} bloqueado(s)
          </Badge>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="space-y-1 text-sm">
            {resumo.bloqueados > 0 && (
              <p className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-red-700 dark:text-red-400">
                  {resumo.bloqueados} pedido(s) aguardando pagamento mínimo (40%)
                </span>
              </p>
            )}
            {resumo.aguardandoInstalacao > 0 && (
              <p className="text-yellow-700 dark:text-yellow-400">
                {resumo.aguardandoInstalacao} pedido(s) aguardando 60% para liberar instalação
              </p>
            )}
            <p className="text-muted-foreground">
              Valor total pendente: <strong>{formatCurrency(resumo.valorPendente)}</strong>
            </p>
          </div>
          
          {onNavigateToFinanceiro && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onNavigateToFinanceiro}
              className="shrink-0"
            >
              Ver Contas a Receber
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
