import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUpCircle, ArrowDownCircle, AlertTriangle, Calendar } from 'lucide-react';
import { format, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ContaPendente } from '@/hooks/useFinanceiroData';

interface ListaContasPendentesProps {
  contasPagar: ContaPendente[];
  contasReceber: ContaPendente[];
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

function getVencimentoLabel(data: Date): { label: string; className: string } {
  if (isPast(data) && !isToday(data)) {
    const dias = differenceInDays(new Date(), data);
    return { 
      label: `Atrasado ${dias}d`, 
      className: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950' 
    };
  }
  if (isToday(data)) {
    return { 
      label: 'Vence hoje', 
      className: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950' 
    };
  }
  if (isTomorrow(data)) {
    return { 
      label: 'Vence amanhã', 
      className: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950' 
    };
  }
  const dias = differenceInDays(data, new Date());
  if (dias <= 7) {
    return { 
      label: `Em ${dias}d`, 
      className: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950' 
    };
  }
  return { 
    label: format(data, 'dd/MM', { locale: ptBR }), 
    className: 'text-muted-foreground bg-muted' 
  };
}

function ContaItem({ conta }: { conta: ContaPendente }) {
  const vencimento = getVencimentoLabel(conta.dataVencimento);
  
  return (
    <div className="flex items-start gap-2 py-2 border-b last:border-0 w-full overflow-hidden">
      <div className="shrink-0 mt-0.5">
        {conta.tipo === 'pagar' ? (
          <ArrowDownCircle className="h-4 w-4 text-red-500" />
        ) : (
          <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
        )}
      </div>
      <div className="flex-1 min-w-0 overflow-hidden pr-2">
        <p className="font-medium text-sm break-words leading-tight" title={conta.descricao}>
          {conta.descricao}
        </p>
        {conta.clienteOuFornecedor && (
          <p className="text-xs text-muted-foreground break-words leading-tight mt-0.5" title={conta.clienteOuFornecedor}>
            {conta.clienteOuFornecedor}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={cn(
          "font-semibold text-sm whitespace-nowrap text-right",
          conta.tipo === 'pagar' ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
        )}>
          {formatCurrency(conta.valor)}
        </span>
        <Badge variant="outline" className={cn("text-xs px-1.5 py-0.5 whitespace-nowrap", vencimento.className)}>
          {vencimento.label}
        </Badge>
      </div>
    </div>
  );
}

export function ListaContasPendentes({ contasPagar, contasReceber, isLoading }: ListaContasPendentesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contas Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalAtrasadosPagar = contasPagar.filter(c => c.status === 'atrasado').length;
  const totalAtrasadosReceber = contasReceber.filter(c => c.status === 'atrasado').length;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2 px-4 pt-4 shrink-0">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2 flex-wrap">
          <Calendar className="h-4 w-4 shrink-0" />
          <span className="flex-1 min-w-0">Contas Pendentes</span>
          {(totalAtrasadosPagar + totalAtrasadosReceber) > 0 && (
            <Badge variant="destructive" className="ml-auto shrink-0">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {totalAtrasadosPagar + totalAtrasadosReceber} atrasadas
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 px-4 pb-4">
        <Tabs defaultValue="pagar" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full mb-2 shrink-0">
            <TabsTrigger value="pagar" className="flex-1 gap-1 text-xs sm:text-sm">
              <ArrowDownCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">A </span>Pagar
              <Badge variant="secondary" className="h-5 px-1 text-xs shrink-0">
                {contasPagar.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="receber" className="flex-1 gap-1 text-xs sm:text-sm">
              <ArrowUpCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">A </span>Receber
              <Badge variant="secondary" className="h-5 px-1 text-xs shrink-0">
                {contasReceber.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pagar" className="mt-0 flex-1 flex flex-col min-h-0 overflow-hidden">
            <ScrollArea className="flex-1 pr-4" style={{ maxHeight: '300px' }}>
              {contasPagar.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground py-8">
                  Nenhuma conta a pagar pendente
                </div>
              ) : (
                <div className="overflow-hidden">
                  {contasPagar.map((conta) => (
                    <ContaItem key={conta.id} conta={conta} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="receber" className="mt-0 flex-1 flex flex-col min-h-0 overflow-hidden">
            <ScrollArea className="flex-1 pr-4" style={{ maxHeight: '300px' }}>
              {contasReceber.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground py-8">
                  Nenhuma conta a receber pendente
                </div>
              ) : (
                <div className="overflow-hidden">
                  {contasReceber.map((conta) => (
                    <ContaItem key={conta.id} conta={conta} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
