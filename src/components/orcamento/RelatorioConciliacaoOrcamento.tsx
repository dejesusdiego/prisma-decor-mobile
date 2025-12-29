import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Receipt,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { useOrcamentoConciliacao } from '@/hooks/useOrcamentoConciliacao';
import { formatCurrency, formatDate, formatPercent } from '@/lib/formatters';

interface RelatorioConciliacaoOrcamentoProps {
  orcamentoId: string;
}

export function RelatorioConciliacaoOrcamento({ orcamentoId }: RelatorioConciliacaoOrcamentoProps) {
  const { data, isLoading, error } = useOrcamentoConciliacao(orcamentoId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>
          Não foi possível carregar os dados de conciliação.
        </AlertDescription>
      </Alert>
    );
  }

  const { parcelas, contasPagar, comparativo, alertas, statusConciliacao } = data;

  const getStatusBadge = () => {
    switch (statusConciliacao) {
      case 'completo':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Conciliado</Badge>;
      case 'parcial':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Parcial</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const parcelasPagas = parcelas.filter(p => p.status === 'pago').length;
  const parcelasConciliadas = parcelas.filter(p => p.conciliada_extrato).length;
  const custosPagos = contasPagar.filter(c => c.status === 'pago').length;
  const custosConciliados = contasPagar.filter(c => c.conciliada_extrato).length;

  return (
    <div className="space-y-6">
      {/* Header com Status */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Conciliação Bancária</h3>
          <p className="text-sm text-muted-foreground">
            Rastreie as movimentações bancárias relacionadas a este orçamento
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="space-y-2">
          {alertas.map((alerta, index) => (
            <Alert 
              key={index} 
              variant={alerta.tipo === 'error' ? 'destructive' : 'default'}
              className={alerta.tipo === 'warning' ? 'border-amber-500/50 bg-amber-500/5' : ''}
            >
              {alerta.tipo === 'error' ? (
                <AlertTriangle className="h-4 w-4" />
              ) : alerta.tipo === 'warning' ? (
                <AlertCircle className="h-4 w-4 text-amber-600" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <AlertDescription className="flex items-center justify-between">
                <span>{alerta.mensagem}</span>
                {alerta.acao && (
                  <Badge variant="outline" className="ml-2">{alerta.acao}</Badge>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Comparativo Visual */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Receipt className="h-4 w-4" />
              Valor Orçamento
            </div>
            <p className="text-2xl font-bold mt-1">
              {formatCurrency(comparativo.valorOrcamento)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <ArrowUpRight className="h-4 w-4 text-green-500" />
              Recebido
            </div>
            <p className="text-2xl font-bold mt-1 text-green-600">
              {formatCurrency(comparativo.totalRecebido)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(comparativo.totalRecebidoConciliado)} no extrato
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <ArrowDownRight className="h-4 w-4 text-red-500" />
              Custos Pagos
            </div>
            <p className="text-2xl font-bold mt-1 text-red-600">
              {formatCurrency(comparativo.totalCustosPagos)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(comparativo.totalCustosConciliados)} no extrato
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              {comparativo.margemRealizada >= comparativo.margemProjetada ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-amber-500" />
              )}
              Margem Realizada
            </div>
            <p className={`text-2xl font-bold mt-1 ${
              comparativo.margemRealizada >= comparativo.margemProjetada 
                ? 'text-green-600' 
                : 'text-amber-600'
            }`}>
              {formatPercent(comparativo.margemRealizada)}
            </p>
            <p className="text-xs text-muted-foreground">
              Projetada: {formatPercent(comparativo.margemProjetada)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seção Entradas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Banknote className="h-4 w-4 text-green-500" />
              Entradas (Recebimentos)
              <Badge variant="outline" className="ml-auto">
                {parcelasConciliadas}/{parcelas.length} conciliadas
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {parcelas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma parcela gerada
              </p>
            ) : (
              <div className="space-y-3">
                {parcelas.map((parcela) => (
                  <div 
                    key={parcela.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                  >
                    <div className="flex items-center gap-3">
                      {parcela.conciliada_extrato ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : parcela.status === 'pago' ? (
                        <Clock className="h-5 w-5 text-amber-500" />
                      ) : parcela.status === 'atrasado' ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium text-sm">
                          Parcela {parcela.numero_parcela}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Venc: {formatDate(parcela.data_vencimento)}
                          {parcela.data_pagamento && ` • Pago: ${formatDate(parcela.data_pagamento)}`}
                        </p>
                        {parcela.movimentacao_extrato && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Extrato: {formatDate(parcela.movimentacao_extrato.data_movimentacao)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(parcela.valor)}</p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          parcela.status === 'pago' 
                            ? 'text-green-600 border-green-500/30' 
                            : parcela.status === 'atrasado'
                            ? 'text-red-600 border-red-500/30'
                            : ''
                        }`}
                      >
                        {parcela.status === 'pago' ? 'Pago' : 
                         parcela.status === 'atrasado' ? 'Atrasado' : 
                         parcela.status === 'parcial' ? 'Parcial' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seção Saídas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-red-500" />
              Saídas (Custos)
              <Badge variant="outline" className="ml-auto">
                {custosConciliados}/{contasPagar.length} conciliadas
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contasPagar.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum custo registrado
              </p>
            ) : (
              <div className="space-y-3">
                {contasPagar.map((conta) => (
                  <div 
                    key={conta.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                  >
                    <div className="flex items-center gap-3">
                      {conta.conciliada_extrato ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : conta.status === 'pago' ? (
                        <Clock className="h-5 w-5 text-amber-500" />
                      ) : conta.status === 'atrasado' ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium text-sm line-clamp-1">
                          {conta.descricao}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {conta.fornecedor && `${conta.fornecedor} • `}
                          Venc: {formatDate(conta.data_vencimento)}
                        </p>
                        {conta.movimentacao_extrato && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Extrato: {formatDate(conta.movimentacao_extrato.data_movimentacao)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(conta.valor)}</p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          conta.status === 'pago' 
                            ? 'text-green-600 border-green-500/30' 
                            : conta.status === 'atrasado'
                            ? 'text-red-600 border-red-500/30'
                            : ''
                        }`}
                      >
                        {conta.status === 'pago' ? 'Pago' : 
                         conta.status === 'atrasado' ? 'Atrasado' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          Conciliado no extrato
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-amber-500" />
          Pago, aguardando conciliação
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          Pendente
        </div>
        <div className="flex items-center gap-1">
          <XCircle className="h-3 w-3 text-red-500" />
          Atrasado
        </div>
      </div>
    </div>
  );
}
