import { useMemo } from 'react';
import { AlertTriangle, TrendingDown, Lightbulb, ArrowRight, Receipt, Phone } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AlertaFluxoNegativoProps {
  saldoAtual: number;
  saldoPrevisto: number;
  cenario: 'realista' | 'otimista' | 'pessimista';
  diasAteNegativo?: number;
  valorEmRisco?: number;
  clientesRisco?: number;
  onNavigateContasReceber?: () => void;
  onNavigateContasPagar?: () => void;
  className?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function AlertaFluxoNegativo({
  saldoAtual,
  saldoPrevisto,
  cenario,
  diasAteNegativo,
  valorEmRisco = 0,
  clientesRisco = 0,
  onNavigateContasReceber,
  onNavigateContasPagar,
  className
}: AlertaFluxoNegativoProps) {
  // Determinar se deve mostrar alerta
  const alertaConfig = useMemo(() => {
    // Saldo previsto negativo
    if (saldoPrevisto < 0) {
      return {
        show: true,
        variant: 'destructive' as const,
        titulo: 'Fluxo de Caixa Negativo Previsto',
        mensagem: `O saldo previsto no cenário ${cenario} é de ${formatCurrency(saldoPrevisto)}. Ações recomendadas para evitar problemas de caixa.`,
        urgencia: 'alta'
      };
    }
    
    // Saldo previsto baixo (< 20% do saldo atual)
    if (saldoAtual > 0 && saldoPrevisto < saldoAtual * 0.2) {
      return {
        show: true,
        variant: 'warning' as const,
        titulo: 'Redução Significativa no Caixa',
        mensagem: `O saldo cairá de ${formatCurrency(saldoAtual)} para ${formatCurrency(saldoPrevisto)} (${Math.round((saldoPrevisto / saldoAtual) * 100)}% do valor atual).`,
        urgencia: 'media'
      };
    }

    // Valor em risco alto
    if (valorEmRisco > saldoAtual * 0.3) {
      return {
        show: true,
        variant: 'warning' as const,
        titulo: 'Valor em Risco de Inadimplência',
        mensagem: `${formatCurrency(valorEmRisco)} em parcelas com clientes de alto risco ou em atraso.`,
        urgencia: 'media'
      };
    }

    return { show: false };
  }, [saldoAtual, saldoPrevisto, cenario, valorEmRisco]);

  if (!alertaConfig.show) return null;

  const sugestoes = [
    {
      icone: Phone,
      texto: 'Contatar clientes com parcelas em atraso',
      acao: onNavigateContasReceber,
      badge: clientesRisco > 0 ? `${clientesRisco} clientes` : undefined
    },
    {
      icone: Receipt,
      texto: 'Revisar despesas e adiar não essenciais',
      acao: onNavigateContasPagar
    },
    {
      icone: TrendingDown,
      texto: 'Antecipar recebimentos com desconto'
    }
  ];

  return (
    <Alert 
      variant={alertaConfig.variant === 'destructive' ? 'destructive' : 'default'}
      className={cn(
        alertaConfig.variant === 'warning' && "border-amber-500/50 bg-amber-500/10",
        className
      )}
    >
      <AlertTriangle className={cn(
        "h-4 w-4",
        alertaConfig.variant === 'warning' && "text-amber-500"
      )} />
      <AlertTitle className="flex items-center gap-2">
        {alertaConfig.titulo}
        <Badge 
          variant={alertaConfig.urgencia === 'alta' ? 'destructive' : 'secondary'}
          className="text-xs"
        >
          {alertaConfig.urgencia === 'alta' ? 'Urgente' : 'Atenção'}
        </Badge>
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm mb-3">{alertaConfig.mensagem}</p>
        
        {diasAteNegativo && diasAteNegativo > 0 && (
          <p className="text-sm font-medium text-destructive mb-3">
            ⚠️ Saldo ficará negativo em aproximadamente {diasAteNegativo} dias
          </p>
        )}

        <div className="space-y-2 mt-4">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Sugestões de ação:
          </p>
          <div className="space-y-1.5">
            {sugestoes.map((s, i) => (
              <div 
                key={i} 
                className="flex items-center gap-2 text-sm group"
              >
                <s.icone className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="flex-1">{s.texto}</span>
                {s.badge && (
                  <Badge variant="outline" className="text-xs">
                    {s.badge}
                  </Badge>
                )}
                {s.acao && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={s.acao}
                  >
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
