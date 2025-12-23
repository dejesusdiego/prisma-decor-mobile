import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
  PiggyBank
} from 'lucide-react';
import { useOrcamentoFinanceiro } from '@/hooks/useOrcamentoFinanceiro';
import { formatCurrency } from '@/lib/calculosStatus';

interface ResumoFinanceiroOrcamentoProps {
  orcamentoId: string;
  onGerarContaReceber?: () => void;
  onGerarContasPagar?: () => void;
  onVerDetalhes?: () => void;
}

export function ResumoFinanceiroOrcamento({ 
  orcamentoId,
  onGerarContaReceber,
  onGerarContasPagar,
  onVerDetalhes
}: ResumoFinanceiroOrcamentoProps) {
  const {
    valorEfetivo,
    valorRecebido,
    valorPendente,
    custoTotal,
    lucroProjetado,
    margemLucro,
    temContaReceber,
    temContasPagar,
    pendencias,
    rentabilidade,
    isLoading
  } = useOrcamentoFinanceiro(orcamentoId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const temPendencias = (pendencias?.parcelasAtrasadas || 0) > 0 || (pendencias?.contasAtrasadas || 0) > 0;
  const percentualRecebido = valorEfetivo > 0 ? (valorRecebido / valorEfetivo) * 100 : 0;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4 text-primary" />
            Resumo Financeiro
          </CardTitle>
          {temPendencias && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              {pendencias?.parcelasAtrasadas || 0} parcela(s) atrasada(s)
            </Badge>
          )}
          {!temPendencias && temContaReceber && percentualRecebido >= 100 && (
            <Badge variant="default" className="bg-green-600 text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Quitado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Indicadores principais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Receipt className="h-3 w-3" />
              Valor do Orçamento
            </div>
            <p className="text-lg font-bold">{formatCurrency(valorEfetivo)}</p>
          </div>

          <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
            <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400 mb-1">
              <ArrowDownCircle className="h-3 w-3" />
              Recebido
            </div>
            <p className="text-lg font-bold text-green-700 dark:text-green-400">
              {formatCurrency(valorRecebido)}
            </p>
            {valorEfetivo > 0 && (
              <p className="text-xs text-muted-foreground">
                {percentualRecebido.toFixed(0)}% do total
              </p>
            )}
          </div>

          <div className={`p-3 rounded-lg ${valorPendente > 0 ? 'bg-amber-50 dark:bg-amber-950/20' : 'bg-muted/50'}`}>
            <div className={`flex items-center gap-1 text-xs mb-1 ${valorPendente > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}`}>
              <Clock className="h-3 w-3" />
              A Receber
            </div>
            <p className={`text-lg font-bold ${valorPendente > 0 ? 'text-amber-700 dark:text-amber-400' : ''}`}>
              {formatCurrency(valorPendente)}
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
            <div className="flex items-center gap-1 text-xs text-blue-700 dark:text-blue-400 mb-1">
              <TrendingUp className="h-3 w-3" />
              Lucro Projetado
            </div>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
              {formatCurrency(lucroProjetado)}
            </p>
            <p className="text-xs text-muted-foreground">
              Margem: {margemLucro.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Custos e detalhes */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <ArrowUpCircle className="h-3 w-3" />
              Custo Total
            </div>
            <p className="text-sm font-medium">{formatCurrency(custoTotal)}</p>
            {rentabilidade && rentabilidade.custosPendentes > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {formatCurrency(rentabilidade.custosPendentes)} pendente
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <PiggyBank className="h-3 w-3" />
              Lucro Realizado
            </div>
            <p className={`text-sm font-medium ${(rentabilidade?.lucroRealizado || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(rentabilidade?.lucroRealizado || 0)}
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {!temContaReceber && onGerarContaReceber && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onGerarContaReceber}
              className="text-xs"
            >
              <Receipt className="h-3 w-3 mr-1" />
              Gerar Conta a Receber
            </Button>
          )}
          
          {!temContasPagar && custoTotal > 0 && onGerarContasPagar && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onGerarContasPagar}
              className="text-xs"
            >
              <ArrowUpCircle className="h-3 w-3 mr-1" />
              Registrar Custos
            </Button>
          )}

          {onVerDetalhes && (temContaReceber || temContasPagar) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onVerDetalhes}
              className="text-xs ml-auto"
            >
              Ver Detalhes Financeiros →
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
