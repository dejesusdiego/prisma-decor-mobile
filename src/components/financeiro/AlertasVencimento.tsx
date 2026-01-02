import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  Bell, 
  Calendar, 
  Clock, 
  ArrowUpCircle, 
  ArrowDownCircle,
  X,
  ChevronRight
} from 'lucide-react';
import { format, differenceInDays, parseISO, isToday, isTomorrow, isPast, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { DialogRegistrarRecebimento } from './dialogs/DialogRegistrarRecebimento';

interface Alerta {
  id: string;
  tipo: 'parcela_vencida' | 'parcela_vence_hoje' | 'parcela_vence_breve' | 'conta_pagar_vencida' | 'conta_pagar_vence_hoje' | 'conta_pagar_vence_breve';
  titulo: string;
  descricao: string;
  valor: number;
  dataVencimento: Date;
  diasAtraso?: number;
  prioridade: 'alta' | 'media' | 'baixa';
  referencia: {
    tipo: 'parcela' | 'conta_pagar';
    id: string;
  };
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

function getPrioridadeConfig(prioridade: Alerta['prioridade']) {
  switch (prioridade) {
    case 'alta':
      return {
        bg: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800',
        icon: 'text-red-500',
        badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      };
    case 'media':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
        icon: 'text-amber-500',
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      };
    case 'baixa':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
        icon: 'text-blue-500',
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      };
  }
}

function AlertaItem({ alerta, onDismiss, onAction }: { 
  alerta: Alerta; 
  onDismiss?: (id: string) => void;
  onAction?: (alerta: Alerta) => void;
}) {
  const config = getPrioridadeConfig(alerta.prioridade);
  const isParcela = alerta.referencia.tipo === 'parcela';

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg border transition-all hover:shadow-sm",
      config.bg
    )}>
      <div className={cn("shrink-0 mt-0.5", config.icon)}>
        {alerta.prioridade === 'alta' ? (
          <AlertTriangle className="h-5 w-5" />
        ) : alerta.prioridade === 'media' ? (
          <Clock className="h-5 w-5" />
        ) : (
          <Calendar className="h-5 w-5" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm flex items-center gap-2">
              {isParcela ? (
                <ArrowUpCircle className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : (
                <ArrowDownCircle className="h-4 w-4 text-red-500 shrink-0" />
              )}
              <span className="truncate max-w-[120px] xl:max-w-[160px]">{alerta.titulo}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {alerta.descricao}
            </p>
          </div>
          
          {onDismiss && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100"
              onClick={() => onDismiss(alerta.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-xs", config.badge)}>
              {alerta.diasAtraso !== undefined && alerta.diasAtraso > 0 
                ? `${alerta.diasAtraso}d atraso`
                : alerta.diasAtraso === 0
                ? 'Vence hoje'
                : `Em ${Math.abs(alerta.diasAtraso || 0)}d`
              }
            </Badge>
            <span className="text-sm font-semibold">
              {formatCurrency(alerta.valor)}
            </span>
          </div>
          
          {onAction && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs shrink-0 whitespace-nowrap"
              onClick={() => onAction(alerta)}
            >
              {isParcela ? 'Receber' : 'Pagar'}
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AlertasVencimento() {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [dialogRecebimentoOpen, setDialogRecebimentoOpen] = useState(false);
  const [parcelaSelecionada, setParcelaSelecionada] = useState<any>(null);

  // Buscar parcelas vencidas ou próximas do vencimento
  const { data: parcelasData, isLoading: isLoadingParcelas } = useQuery({
    queryKey: ['parcelas-alertas'],
    queryFn: async () => {
      const hoje = format(new Date(), 'yyyy-MM-dd');
      const em7dias = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('parcelas_receber')
        .select(`
          *,
          conta_receber:contas_receber(cliente_nome, descricao)
        `)
        .in('status', ['pendente', 'atrasado'])
        .lte('data_vencimento', em7dias)
        .order('data_vencimento', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000, // Atualizar a cada minuto
  });

  // Buscar contas a pagar vencidas ou próximas do vencimento
  const { data: contasPagarData, isLoading: isLoadingContasPagar } = useQuery({
    queryKey: ['contas-pagar-alertas'],
    queryFn: async () => {
      const em7dias = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('contas_pagar')
        .select('*')
        .in('status', ['pendente', 'atrasado'])
        .lte('data_vencimento', em7dias)
        .order('data_vencimento', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });

  const isLoading = isLoadingParcelas || isLoadingContasPagar;

  // Processar alertas
  const alertas: Alerta[] = [];

  // Processar parcelas
  (parcelasData || []).forEach((parcela: any) => {
    const dataVencimento = parseISO(parcela.data_vencimento);
    const diasAtraso = differenceInDays(new Date(), dataVencimento);
    const clienteNome = parcela.conta_receber?.cliente_nome || 'Cliente';
    
    let tipo: Alerta['tipo'];
    let prioridade: Alerta['prioridade'];

    if (isPast(dataVencimento) && !isToday(dataVencimento)) {
      tipo = 'parcela_vencida';
      prioridade = 'alta';
    } else if (isToday(dataVencimento)) {
      tipo = 'parcela_vence_hoje';
      prioridade = 'media';
    } else {
      tipo = 'parcela_vence_breve';
      prioridade = 'baixa';
    }

    alertas.push({
      id: `parcela-${parcela.id}`,
      tipo,
      titulo: `Parcela ${parcela.numero_parcela} - ${clienteNome}`,
      descricao: parcela.conta_receber?.descricao || 'Conta a receber',
      valor: Number(parcela.valor),
      dataVencimento,
      diasAtraso,
      prioridade,
      referencia: { tipo: 'parcela', id: parcela.id },
    });
  });

  // Processar contas a pagar
  (contasPagarData || []).forEach((conta: any) => {
    const dataVencimento = parseISO(conta.data_vencimento);
    const diasAtraso = differenceInDays(new Date(), dataVencimento);
    
    let tipo: Alerta['tipo'];
    let prioridade: Alerta['prioridade'];

    if (isPast(dataVencimento) && !isToday(dataVencimento)) {
      tipo = 'conta_pagar_vencida';
      prioridade = 'alta';
    } else if (isToday(dataVencimento)) {
      tipo = 'conta_pagar_vence_hoje';
      prioridade = 'media';
    } else {
      tipo = 'conta_pagar_vence_breve';
      prioridade = 'baixa';
    }

    alertas.push({
      id: `conta-pagar-${conta.id}`,
      tipo,
      titulo: conta.descricao,
      descricao: conta.fornecedor || 'Conta a pagar',
      valor: Number(conta.valor),
      dataVencimento,
      diasAtraso,
      prioridade,
      referencia: { tipo: 'conta_pagar', id: conta.id },
    });
  });

  // Ordenar por prioridade e data
  const alertasOrdenados = alertas
    .filter(a => !dismissedIds.has(a.id))
    .sort((a, b) => {
      const prioridadeOrder = { alta: 0, media: 1, baixa: 2 };
      if (prioridadeOrder[a.prioridade] !== prioridadeOrder[b.prioridade]) {
        return prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade];
      }
      return a.dataVencimento.getTime() - b.dataVencimento.getTime();
    });

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const handleAction = (alerta: Alerta) => {
    if (alerta.referencia.tipo === 'parcela') {
      // Buscar dados da parcela para abrir o dialog
      const parcela = parcelasData?.find((p: any) => p.id === alerta.referencia.id);
      if (parcela) {
        setParcelaSelecionada(parcela);
        setDialogRecebimentoOpen(true);
      }
    } else {
      // Navegar para contas a pagar (implementação futura)
      window.location.href = `/gerarorcamento?financeiro=contas-pagar`;
    }
  };

  // Contadores
  const totalAlta = alertasOrdenados.filter(a => a.prioridade === 'alta').length;
  const totalMedia = alertasOrdenados.filter(a => a.prioridade === 'media').length;
  const totalBaixa = alertasOrdenados.filter(a => a.prioridade === 'baixa').length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alertas de Vencimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alertasOrdenados.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alertas de Vencimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-3">
              <Bell className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="font-medium text-foreground">Tudo em dia!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Nenhuma conta vencida ou próxima do vencimento
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      totalAlta > 0 && "border-red-300 dark:border-red-800"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className={cn(
            "h-4 w-4",
            totalAlta > 0 ? "text-red-500" : totalMedia > 0 ? "text-amber-500" : "text-blue-500"
          )} />
          Alertas de Vencimento
          <div className="ml-auto flex items-center gap-1.5">
            {totalAlta > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                {totalAlta} urgente{totalAlta > 1 ? 's' : ''}
              </Badge>
            )}
            {totalMedia > 0 && (
              <Badge className="h-5 px-1.5 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                {totalMedia} hoje
              </Badge>
            )}
            {totalBaixa > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {totalBaixa} em breve
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px] pr-2">
          <div className="space-y-2">
            {alertasOrdenados.map((alerta) => (
              <AlertaItem 
                key={alerta.id} 
                alerta={alerta} 
                onDismiss={handleDismiss}
                onAction={handleAction}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>

      <DialogRegistrarRecebimento
        open={dialogRecebimentoOpen}
        onOpenChange={setDialogRecebimentoOpen}
        parcela={parcelaSelecionada}
      />
    </Card>
  );
}
