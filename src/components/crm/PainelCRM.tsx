// Re-export the new version
export { PainelCRMV2 as PainelCRM } from './PainelCRMV2';

/* OLD VERSION - Kept for reference
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Target, 
  TrendingUp, 
  Clock,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  AlertCircle,
  FileText,
  DollarSign
} from 'lucide-react';
import { useCRMMetrics, useAtividades } from '@/hooks/useCRMData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { STATUS_PIPELINE_CONFIG } from '@/lib/mapearStatusEtapa';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const ETAPA_LABELS: Record<string, { label: string; color: string }> = {
  prospeccao: { label: 'Prospecção', color: 'bg-blue-500' },
  qualificacao: { label: 'Qualificação', color: 'bg-purple-500' },
  proposta: { label: 'Proposta', color: 'bg-amber-500' },
  negociacao: { label: 'Negociação', color: 'bg-orange-500' },
  fechado_ganho: { label: 'Ganho', color: 'bg-emerald-500' },
  fechado_perdido: { label: 'Perdido', color: 'bg-red-500' }
};

const TIPO_ATIVIDADE_ICONS: Record<string, React.ReactNode> = {
  ligacao: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  reuniao: <Calendar className="h-4 w-4" />,
  visita: <Users className="h-4 w-4" />,
  whatsapp: <MessageSquare className="h-4 w-4" />,
  outro: <Clock className="h-4 w-4" />
};

// Status relevantes para o resumo do pipeline
const STATUS_RESUMO = ['rascunho', 'enviado', 'sem_resposta', 'pago_40', 'pago'];

export function PainelCRM() {
  const { data: metrics, isLoading: loadingMetrics } = useCRMMetrics();
  const { data: atividadesRecentes, isLoading: loadingAtividades } = useAtividades();
  
  // Buscar resumo de orçamentos por status
  const { data: resumoOrcamentos, isLoading: loadingOrcamentos } = useQuery({
    queryKey: ['orcamentos-resumo-crm'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('status, total_com_desconto, total_geral');
      
      if (error) throw error;
      
      // Agrupar por status
      const resumo = STATUS_RESUMO.map(statusId => {
        const orcamentosStatus = data.filter(o => o.status === statusId);
        const config = STATUS_PIPELINE_CONFIG.find(s => s.id === statusId);
        return {
          id: statusId,
          label: config?.label || statusId,
          color: config?.color || '#6b7280',
          bgClass: config?.bgClass || 'bg-gray-500',
          quantidade: orcamentosStatus.length,
          valor: orcamentosStatus.reduce((sum, o) => sum + (o.total_com_desconto || o.total_geral || 0), 0)
        };
      });
      
      const total = data.reduce((sum, o) => sum + (o.total_com_desconto || o.total_geral || 0), 0);
      const totalQtd = data.length;
      
      return { resumo, total, totalQtd };
    }
  });

  if (loadingMetrics) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Contatos',
      value: metrics?.contatos.total || 0,
      description: `${metrics?.contatos.lead || 0} leads · ${metrics?.contatos.cliente || 0} clientes`,
      icon: Users,
      color: 'text-blue-500'
    },
    {
      title: 'Orçamentos',
      value: metrics?.orcamentos?.porStatus.total || 0,
      description: `${metrics?.orcamentos?.porStatus.pago || 0} pagos · ${formatCurrency(metrics?.orcamentos?.valorPago || 0)}`,
      icon: FileText,
      color: 'text-primary'
    },
    {
      title: 'Taxa Conversão Orç.',
      value: `${(metrics?.orcamentos?.taxaConversao || 0).toFixed(0)}%`,
      description: `${metrics?.orcamentos?.porStatus.pago || 0} pagos de ${metrics?.orcamentos?.porStatus.total || 0}`,
      icon: TrendingUp,
      color: 'text-emerald-500'
    },
    {
      title: 'Follow-ups Pendentes',
      value: metrics?.followUpsPendentes || 0,
      description: 'Atividades para hoje',
      icon: Clock,
      color: metrics?.followUpsPendentes && metrics.followUpsPendentes > 0 ? 'text-red-500' : 'text-muted-foreground'
    }
  ];

  const funilAberto = metrics?.funilVendas.filter(
    f => !['fechado_ganho', 'fechado_perdido'].includes(f.etapa)
  ) || [];
  const maxQuantidade = Math.max(...funilAberto.map(f => f.quantidade), 1);

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Follow-ups pendentes - Alerta */}
      {metrics?.followUpsPendentes && metrics.followUpsPendentes > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <div>
              <p className="font-medium">
                Você tem {metrics.followUpsPendentes} follow-up{metrics.followUpsPendentes > 1 ? 's' : ''} pendente{metrics.followUpsPendentes > 1 ? 's' : ''} para hoje
              </p>
              <p className="text-sm text-muted-foreground">
                Verifique suas atividades para não perder oportunidades
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Funil de Vendas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Funil de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {funilAberto.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma oportunidade aberta
              </p>
            ) : (
              funilAberto.map((etapa) => {
                const config = ETAPA_LABELS[etapa.etapa];
                const widthPercent = (etapa.quantidade / maxQuantidade) * 100;
                
                return (
                  <div key={etapa.etapa} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{config?.label || etapa.etapa}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {etapa.quantidade}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {formatCurrency(etapa.valor)}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all", config?.color || 'bg-primary')}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}

            {/* Resumo Ganhos/Perdidos */}
            <div className="pt-4 border-t flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Ganhos: {metrics?.oportunidades.ganhas || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span>Perdidos: {metrics?.oportunidades.perdidas || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Pipeline de Orçamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Pipeline de Orçamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOrcamentos ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : resumoOrcamentos ? (
              <div className="space-y-3">
                {resumoOrcamentos.resumo.map((status) => {
                  const maxQtd = Math.max(...resumoOrcamentos.resumo.map(s => s.quantidade), 1);
                  const widthPercent = (status.quantidade / maxQtd) * 100;
                  
                  return (
                    <div key={status.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{status.label}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {status.quantidade}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {formatCurrency(status.valor)}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all", status.bgClass)}
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                
                {/* Total */}
                <div className="pt-4 border-t flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Total no Pipeline
                  </span>
                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(resumoOrcamentos.total)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum orçamento encontrado
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Atividades Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAtividades ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : atividadesRecentes && atividadesRecentes.length > 0 ? (
              <div className="space-y-3">
                {atividadesRecentes.slice(0, 6).map((atividade) => (
                  <div key={atividade.id} className="flex items-start gap-3">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                      atividade.concluida ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                    )}>
                      {TIPO_ATIVIDADE_ICONS[atividade.tipo] || <Clock className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        atividade.concluida && "line-through text-muted-foreground"
                      )}>
                        {atividade.titulo}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {atividade.contato?.nome && `${atividade.contato.nome} · `}
                        {formatDistanceToNow(new Date(atividade.data_atividade), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </p>
                    </div>
                    {!atividade.concluida && (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        Pendente
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma atividade registrada
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribuição de Contatos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Distribuição de Contatos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-8 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <span className="text-xl font-bold text-blue-500">{metrics?.contatos.lead || 0}</span>
              </div>
              <div>
                <p className="font-medium">Leads</p>
                <p className="text-xs text-muted-foreground">Potenciais clientes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <span className="text-xl font-bold text-emerald-500">{metrics?.contatos.cliente || 0}</span>
              </div>
              <div>
                <p className="font-medium">Clientes</p>
                <p className="text-xs text-muted-foreground">Já compraram</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xl font-bold text-muted-foreground">{metrics?.contatos.inativo || 0}</span>
              </div>
              <div>
                <p className="font-medium">Inativos</p>
                <p className="text-xs text-muted-foreground">Sem atividade</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
