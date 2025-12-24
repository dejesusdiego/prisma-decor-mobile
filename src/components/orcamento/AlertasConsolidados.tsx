import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  Bell, 
  Calendar, 
  Clock, 
  DollarSign, 
  FileText, 
  Package, 
  Phone,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { useAlertasConsolidados } from '@/hooks/useAlertasConsolidados';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AlertasConsolidadosProps {
  onNavigate: (view: string, id?: string) => void;
}

const TIPO_CONFIG = {
  follow_up: {
    icon: Phone,
    color: 'text-blue-500 bg-blue-500/10',
    label: 'Follow-up'
  },
  conta_vencer: {
    icon: DollarSign,
    color: 'text-amber-500 bg-amber-500/10',
    label: 'Conta a Vencer'
  },
  pedido_pronto: {
    icon: Package,
    color: 'text-emerald-500 bg-emerald-500/10',
    label: 'Pedido Pronto'
  },
  orcamento_sem_resposta: {
    icon: FileText,
    color: 'text-orange-500 bg-orange-500/10',
    label: 'Sem Resposta'
  }
};

export function AlertasConsolidados({ onNavigate }: AlertasConsolidadosProps) {
  const { data: alertas, isLoading } = useAlertasConsolidados();

  const handleAlertaClick = (alerta: any) => {
    switch (alerta.referenciaTipo) {
      case 'atividade':
        onNavigate('crm');
        break;
      case 'conta_pagar':
        onNavigate('finPagar');
        break;
      case 'pedido':
        onNavigate('producao');
        break;
      case 'orcamento':
        onNavigate('visualizar', alerta.referenciaId);
        break;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const alertasAlta = alertas?.filter(a => a.prioridade === 'alta') || [];
  const alertasNormal = alertas?.filter(a => a.prioridade === 'normal') || [];
  const totalAlertas = (alertas?.length || 0);

  if (totalAlertas === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle className="h-10 w-10 mx-auto mb-3 text-emerald-500/50" />
            <p className="text-sm">Nenhum alerta pendente</p>
            <p className="text-xs mt-1">Tudo em ordem!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(alertasAlta.length > 0 && "border-amber-500/50")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className={cn(
              "h-4 w-4",
              alertasAlta.length > 0 && "text-amber-500"
            )} />
            Alertas
            {totalAlertas > 0 && (
              <Badge variant={alertasAlta.length > 0 ? "destructive" : "secondary"} className="ml-1">
                {totalAlertas}
              </Badge>
            )}
          </CardTitle>
          {alertasAlta.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {alertasAlta.length} urgente{alertasAlta.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[350px] overflow-y-auto">
        {alertas?.slice(0, 8).map(alerta => {
          const config = TIPO_CONFIG[alerta.tipo];
          const Icon = config.icon;
          
          return (
            <button
              key={alerta.id}
              onClick={() => handleAlertaClick(alerta)}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-all hover:shadow-sm group",
                alerta.prioridade === 'alta' 
                  ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 hover:border-amber-300"
                  : "bg-muted/30 hover:bg-muted/50 border-transparent"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
                  config.color
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{alerta.titulo}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {alerta.descricao}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {config.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(alerta.dataReferencia, { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
        
        {totalAlertas > 8 && (
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              +{totalAlertas - 8} alertas adicionais
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
