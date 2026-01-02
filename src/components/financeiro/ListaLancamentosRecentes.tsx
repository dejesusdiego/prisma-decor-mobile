import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUpCircle, ArrowDownCircle, Clock } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { LancamentoRecente } from '@/hooks/useFinanceiroData';

interface ListaLancamentosRecentesProps {
  lancamentos: LancamentoRecente[];
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

function getDataLabel(data: Date): string {
  if (isToday(data)) return 'Hoje';
  if (isYesterday(data)) return 'Ontem';
  return format(data, "dd 'de' MMM", { locale: ptBR });
}

function LancamentoItem({ lancamento }: { lancamento: LancamentoRecente }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {lancamento.tipo === 'entrada' ? (
          <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0">
            <ArrowUpCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        ) : (
          <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
            <ArrowDownCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{lancamento.descricao}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">
              {getDataLabel(lancamento.data)}
            </span>
            {lancamento.categoria && (
              <>
                <span className="text-muted-foreground">•</span>
                <Badge 
                  variant="outline" 
                  className="text-xs px-1.5 py-0 shrink-0 whitespace-nowrap max-w-[100px] truncate"
                  style={{ 
                    borderColor: lancamento.categoriaCor,
                    color: lancamento.categoriaCor,
                  }}
                  title={lancamento.categoria}
                >
                  {lancamento.categoria}
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>
      <span className={cn(
        "font-semibold text-sm shrink-0 ml-2",
        lancamento.tipo === 'entrada' 
          ? "text-emerald-600 dark:text-emerald-400" 
          : "text-red-600 dark:text-red-400"
      )}>
        {lancamento.tipo === 'entrada' ? '+' : '-'}{formatCurrency(lancamento.valor)}
      </span>
    </div>
  );
}

export function ListaLancamentosRecentes({ lancamentos, isLoading }: ListaLancamentosRecentesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lançamentos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Lançamentos Recentes
          <Badge variant="secondary" className="ml-auto">
            {lancamentos.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px] pr-4">
          {lancamentos.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Nenhum lançamento no período
            </div>
          ) : (
            <div>
              {lancamentos.map((lancamento) => (
                <LancamentoItem key={lancamento.id} lancamento={lancamento} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
