import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  ChevronRight,
  FileUp
} from 'lucide-react';
import { useResumoConciliacao } from '@/hooks/useResumoConciliacao';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

interface WidgetResumoConciliacaoProps {
  onNavigate?: (view: string) => void;
}

export function WidgetResumoConciliacao({ onNavigate }: WidgetResumoConciliacaoProps) {
  const { data: resumo, isLoading, refetch } = useResumoConciliacao();

  if (isLoading) {
    return (
      <Card className="min-h-[280px] sm:min-h-[320px] lg:min-h-[360px]">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!resumo) return null;

  const StatusIcon = resumo.extratoDesatualizado ? AlertTriangle : CheckCircle2;
  const statusColor = resumo.extratoDesatualizado 
    ? 'text-amber-500' 
    : 'text-emerald-500';

  // Calcular progresso: se não há extrato importado, progresso é 0
  // Se há extrato mas não há movimentações pendentes, progresso é 100%
  // Caso contrário, calcular baseado no saldo conciliado vs saldo do extrato
  const progressoPercent = !resumo.ultimaImportacao || resumo.saldoExtratoImportado === 0
    ? 0
    : resumo.movimentacoesPendentes === 0
    ? 100
    : Math.min(100, Math.round(((resumo.saldoSistemaConciliado / Math.max(resumo.saldoExtratoImportado, 1)) * 100)));

  return (
    <Card className={cn(
      "min-h-[280px] sm:min-h-[320px] lg:min-h-[360px] flex flex-col",
      resumo.extratoDesatualizado && "border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/20"
    )}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-primary" />
          Conciliação Bancária
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 text-xs"
          onClick={() => onNavigate?.('finConciliacao')}
        >
          Ver
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between space-y-3 overflow-hidden">
        {/* Status da última importação */}
        <div className="flex items-center gap-2 text-sm">
          {resumo.ultimaImportacao ? (
            <>
              <StatusIcon className={cn("h-4 w-4 shrink-0", statusColor)} />
              <span className="truncate">
                Última importação: {format(resumo.ultimaImportacao, "dd/MM", { locale: ptBR })}
                {resumo.diasDesdeUltimaImportacao > 0 && (
                  <span className="text-muted-foreground ml-1">
                    ({resumo.diasDesdeUltimaImportacao}d atrás)
                  </span>
                )}
              </span>
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Nenhum extrato importado</span>
            </>
          )}
        </div>

        {/* Progresso de conciliação */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{Math.min(progressoPercent, 100)}%</span>
          </div>
          <Progress value={Math.min(progressoPercent, 100)} className="h-2" />
        </div>

        {/* Resumo de valores */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-muted/50 rounded">
            <p className="text-muted-foreground">Saldo Extrato</p>
            <p className="font-semibold">{formatCurrency(resumo.saldoExtratoImportado)}</p>
          </div>
          <div className="p-2 bg-muted/50 rounded">
            <p className="text-muted-foreground">Conciliado</p>
            <p className="font-semibold text-emerald-600">{formatCurrency(resumo.saldoSistemaConciliado)}</p>
          </div>
        </div>

        {/* Pendências */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pendentes:</span>
            <Badge variant={resumo.movimentacoesPendentes > 0 ? "secondary" : "outline"}>
              {resumo.movimentacoesPendentes} itens
            </Badge>
          </div>
          {resumo.movimentacoesCriticas > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Críticas (&gt;R$500):
              </span>
              <Badge variant="destructive" className="text-xs">
                {resumo.movimentacoesCriticas} ({formatCurrency(resumo.valorCriticoTotal)})
              </Badge>
            </div>
          )}
        </div>

        {/* Ação rápida */}
        {resumo.extratoDesatualizado && (
          <Button 
            size="sm" 
            variant="outline"
            className="w-full mt-auto"
            onClick={() => onNavigate?.('finConciliacao')}
          >
            <FileUp className="h-4 w-4 mr-2" />
            Importar Extrato
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
