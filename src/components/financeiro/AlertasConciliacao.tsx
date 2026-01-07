import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  AlertCircle, 
  TrendingDown,
  FileUp,
  Link2
} from 'lucide-react';
import { useResumoConciliacao } from '@/hooks/useResumoConciliacao';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

interface AlertasConciliacaoProps {
  onNavigate?: (view: string) => void;
}

export function AlertasConciliacao({ onNavigate }: AlertasConciliacaoProps) {
  const { data: resumo, isLoading } = useResumoConciliacao();

  if (isLoading || !resumo) return null;

  const alertas = [];

  // Alerta 1: Extrato desatualizado (> 3 dias)
  if (resumo.extratoDesatualizado) {
    alertas.push({
      id: 'extrato-desatualizado',
      variant: 'warning' as const,
      icon: Clock,
      title: 'Extrato Desatualizado',
      description: resumo.ultimaImportacao 
        ? `Última importação há ${resumo.diasDesdeUltimaImportacao} dias. Importe um novo extrato para manter a conciliação em dia.`
        : 'Nenhum extrato bancário foi importado ainda.',
      action: {
        label: 'Importar Extrato',
        icon: FileUp,
        onClick: () => onNavigate?.('finConciliacao')
      }
    });
  }

  // Alerta 2: Movimentações críticas (> R$ 500 não conciliadas)
  if (resumo.movimentacoesCriticas > 0) {
    alertas.push({
      id: 'pendencias-criticas',
      variant: 'destructive' as const,
      icon: AlertCircle,
      title: 'Pendências Críticas',
      description: `${resumo.movimentacoesCriticas} movimentação(ões) acima de R$ 500 aguardando conciliação. Total: ${formatCurrency(resumo.valorCriticoTotal)}`,
      action: {
        label: 'Conciliar Agora',
        icon: Link2,
        onClick: () => onNavigate?.('finConciliacao')
      }
    });
  }

  // Alerta 3: Saldo divergente significativo (> R$ 100)
  if (Math.abs(resumo.diferencaSaldo) > 100 && resumo.movimentacoesPendentes > 0) {
    alertas.push({
      id: 'saldo-divergente',
      variant: 'default' as const,
      icon: TrendingDown,
      title: 'Saldo Não Conciliado',
      description: `Diferença de ${formatCurrency(Math.abs(resumo.diferencaSaldo))} entre extrato e sistema. ${resumo.movimentacoesPendentes} itens pendentes.`,
      action: {
        label: 'Revisar',
        icon: Link2,
        onClick: () => onNavigate?.('finConciliacao')
      }
    });
  }

  if (alertas.length === 0) return null;

  return (
    <div className="space-y-3">
      {alertas.map(alerta => (
        <Alert 
          key={alerta.id} 
          variant={alerta.variant === 'destructive' ? 'destructive' : 'default'}
          className={cn(
            alerta.variant === 'warning' && "border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200",
            alerta.variant === 'destructive' && "[&>svg]:text-destructive"
          )}
        >
          <alerta.icon className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>{alerta.title}</span>
            {alerta.action && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 text-xs -mr-2"
                onClick={alerta.action.onClick}
              >
                <alerta.action.icon className="h-3 w-3 mr-1" />
                {alerta.action.label}
              </Button>
            )}
          </AlertTitle>
          <AlertDescription className="text-sm opacity-90">
            {alerta.description}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
