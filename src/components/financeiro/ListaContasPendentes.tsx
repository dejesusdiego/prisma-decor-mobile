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
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {conta.tipo === 'pagar' ? (
          <ArrowDownCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
        ) : (
          <ArrowUpCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{conta.descricao}</p>
          {conta.clienteOuFornecedor && (
            <p className="text-xs text-muted-foreground truncate">
              {conta.clienteOuFornecedor}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 ml-2">
        <span className={cn(
          "font-semibold text-sm",
          conta.tipo === 'pagar' ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
        )}>
          {formatCurrency(conta.valor)}
        </span>
        <Badge variant="outline" className={cn("text-xs px-1.5 py-0", vencimento.className)}>
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Contas Pendentes
          {(totalAtrasadosPagar + totalAtrasadosReceber) > 0 && (
            <Badge variant="destructive" className="ml-auto">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {totalAtrasadosPagar + totalAtrasadosReceber} atrasadas
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pagar">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="pagar" className="flex-1 gap-2">
              <ArrowDownCircle className="h-4 w-4" />
              A Pagar
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {contasPagar.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="receber" className="flex-1 gap-2">
              <ArrowUpCircle className="h-4 w-4" />
              A Receber
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {contasReceber.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pagar" className="mt-0">
            <ScrollArea className="h-[280px] pr-4">
              {contasPagar.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Nenhuma conta a pagar pendente
                </div>
              ) : (
                <div>
                  {contasPagar.map((conta) => (
                    <ContaItem key={conta.id} conta={conta} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="receber" className="mt-0">
            <ScrollArea className="h-[280px] pr-4">
              {contasReceber.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Nenhuma conta a receber pendente
                </div>
              ) : (
                <div>
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
