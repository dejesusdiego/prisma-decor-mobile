import { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, AlertCircle, Calendar, Package, Eye, DollarSign, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotificacoes, Notificacao } from '@/hooks/useNotificacoes';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const TIPO_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  follow_up: { icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  conta_vencer: { icon: DollarSign, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  pedido_pronto: { icon: Package, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  visita_nova: { icon: Calendar, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  orcamento_vencendo: { icon: AlertCircle, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  pagamento_atrasado: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  emprestimo_vencendo: { icon: RefreshCw, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  emprestimo_atrasado: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
};

const PRIORIDADE_CONFIG: Record<string, { color: string }> = {
  baixa: { color: 'text-muted-foreground' },
  normal: { color: 'text-foreground' },
  alta: { color: 'text-amber-600' },
  urgente: { color: 'text-red-600' },
};

interface NotificationCenterProps {
  onNavigate?: (view: string, params?: Record<string, string>) => void;
}

export function NotificationCenter({ onNavigate }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const { 
    notificacoes, 
    countNaoLidas, 
    isLoading, 
    marcarComoLida, 
    marcarTodasComoLidas, 
    deletarNotificacao 
  } = useNotificacoes();

  const handleNotificationClick = (notificacao: Notificacao) => {
    if (!notificacao.lida) {
      marcarComoLida(notificacao.id);
    }

    // Navegar para a referência se houver
    if (onNavigate && notificacao.referencia_tipo && notificacao.referencia_id) {
      const navMap: Record<string, string> = {
        visita: 'solicitacoesVisita',
        pedido: 'producao',
        orcamento: 'visualizar',
        conta_pagar: 'finContasPagar',
        conta_receber: 'finContasReceber',
        contato: 'crm',
        emprestimo: 'finRelatorios',
      };
      
      const view = navMap[notificacao.referencia_tipo];
      if (view) {
        onNavigate(view);
        setOpen(false);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {countNaoLidas > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {countNaoLidas > 9 ? '9+' : countNaoLidas}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <h3 className="font-semibold">Notificações</h3>
            {countNaoLidas > 0 && (
              <Badge variant="secondary" className="text-xs">
                {countNaoLidas} nova{countNaoLidas > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {countNaoLidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => marcarTodasComoLidas()}
              className="text-xs h-7"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : notificacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notificacoes.map((notificacao) => {
                const tipoConfig = TIPO_CONFIG[notificacao.tipo] || TIPO_CONFIG.follow_up;
                const prioridadeConfig = PRIORIDADE_CONFIG[notificacao.prioridade] || PRIORIDADE_CONFIG.normal;
                const Icon = tipoConfig.icon;

                return (
                  <div
                    key={notificacao.id}
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-colors cursor-pointer relative group",
                      !notificacao.lida && "bg-primary/5"
                    )}
                    onClick={() => handleNotificationClick(notificacao)}
                  >
                    <div className="flex gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                        tipoConfig.bgColor
                      )}>
                        <Icon className={cn("h-5 w-5", tipoConfig.color)} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            "font-medium text-sm",
                            prioridadeConfig.color,
                            !notificacao.lida && "font-semibold"
                          )}>
                            {notificacao.titulo}
                          </p>
                          {!notificacao.lida && (
                            <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notificacao.mensagem}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notificacao.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      {!notificacao.lida && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            marcarComoLida(notificacao.id);
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletarNotificacao(notificacao.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
