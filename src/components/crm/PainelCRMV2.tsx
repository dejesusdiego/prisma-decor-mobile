import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  TrendingUp, 
  Clock,
  Phone,
  Calendar,
  MessageSquare,
  AlertCircle,
  FileText,
  DollarSign,
  ChevronRight,
  Flame,
  CalendarClock,
  ArrowRight
} from 'lucide-react';
import { useCRMMetrics, useAtividades } from '@/hooks/useCRMData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format, isToday, isTomorrow, isPast } from 'date-fns';
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

const TIPO_ATIVIDADE_ICONS: Record<string, React.ReactNode> = {
  ligacao: <Phone className="h-4 w-4" />,
  email: <MessageSquare className="h-4 w-4" />,
  reuniao: <Calendar className="h-4 w-4" />,
  visita: <Users className="h-4 w-4" />,
  whatsapp: <MessageSquare className="h-4 w-4" />,
  outro: <Clock className="h-4 w-4" />
};

// Status relevantes para o pipeline
const STATUS_ATIVOS = ['rascunho', 'enviado', 'sem_resposta', 'pago_40', 'pago_parcial', 'pago_60'];

interface PainelCRMV2Props {
  onVerContato?: (contatoId: string) => void;
  onVerOrcamento?: (orcamentoId: string) => void;
}

export function PainelCRMV2({ onVerContato, onVerOrcamento }: PainelCRMV2Props) {
  const { data: metrics, isLoading: loadingMetrics } = useCRMMetrics();
  const { data: atividadesRecentes, isLoading: loadingAtividades } = useAtividades();
  
  // Buscar ações urgentes
  const { data: acoesUrgentes, isLoading: loadingAcoes } = useQuery({
    queryKey: ['acoes-urgentes-crm'],
    queryFn: async () => {
      // Orçamentos enviados há mais de 3 dias sem resposta
      const { data: orcamentosPendentes, error: e1 } = await supabase
        .from('orcamentos')
        .select('id, codigo, cliente_nome, cliente_telefone, status, total_com_desconto, total_geral, status_updated_at, contato_id')
        .in('status', ['enviado', 'sem_resposta'])
        .order('status_updated_at', { ascending: true })
        .limit(10);
      
      if (e1) throw e1;
      
      // Atividades pendentes para hoje ou atrasadas
      const hoje = new Date().toISOString().split('T')[0];
      const { data: atividadesPendentes, error: e2 } = await supabase
        .from('atividades_crm')
        .select('id, titulo, tipo, data_atividade, contato_id, contato:contatos(nome)')
        .eq('concluida', false)
        .lte('data_atividade', hoje + 'T23:59:59')
        .order('data_atividade', { ascending: true })
        .limit(10);
      
      if (e2) throw e2;
      
      // Visitas pendentes
      const { data: visitasPendentes, error: e3 } = await supabase
        .from('solicitacoes_visita')
        .select('id, nome, telefone, data_agendada, horario_agendado, status')
        .eq('status', 'pendente')
        .order('data_agendada', { ascending: true })
        .limit(5);
      
      if (e3) throw e3;
      
      return {
        orcamentos: orcamentosPendentes || [],
        atividades: atividadesPendentes || [],
        visitas: visitasPendentes || []
      };
    }
  });

  // Buscar resumo do pipeline
  const { data: resumoPipeline, isLoading: loadingPipeline } = useQuery({
    queryKey: ['pipeline-resumo-crm'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('status, total_com_desconto, total_geral');
      
      if (error) throw error;
      
      const resumo = STATUS_ATIVOS.map(statusId => {
        const orcamentosStatus = data.filter(o => o.status === statusId);
        const config = STATUS_PIPELINE_CONFIG.find(s => s.id === statusId);
        return {
          id: statusId,
          label: config?.label || statusId,
          bgClass: config?.bgClass || 'bg-gray-500',
          quantidade: orcamentosStatus.length,
          valor: orcamentosStatus.reduce((sum, o) => sum + (o.total_com_desconto || o.total_geral || 0), 0)
        };
      });
      
      const totalAtivo = resumo.reduce((sum, s) => sum + s.valor, 0);
      const totalQtd = resumo.reduce((sum, s) => sum + s.quantidade, 0);
      
      return { resumo, totalAtivo, totalQtd };
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
      title: 'Pipeline Ativo',
      value: formatCurrency(resumoPipeline?.totalAtivo || 0),
      description: `${resumoPipeline?.totalQtd || 0} orçamentos em aberto`,
      icon: DollarSign,
      color: 'text-emerald-500'
    },
    {
      title: 'Taxa Conversão',
      value: `${(metrics?.orcamentos?.taxaConversao || 0).toFixed(0)}%`,
      description: `${metrics?.orcamentos?.porStatus.pago || 0} vendas fechadas`,
      icon: TrendingUp,
      color: 'text-blue-500'
    },
    {
      title: 'Contatos',
      value: metrics?.contatos.total || 0,
      description: `${metrics?.contatos.lead || 0} leads · ${metrics?.contatos.cliente || 0} clientes`,
      icon: Users,
      color: 'text-primary'
    },
    {
      title: 'Tarefas Hoje',
      value: acoesUrgentes?.atividades.length || 0,
      description: acoesUrgentes?.atividades.length ? 'Pendentes' : 'Nenhuma pendente',
      icon: CalendarClock,
      color: (acoesUrgentes?.atividades.length || 0) > 0 ? 'text-amber-500' : 'text-muted-foreground'
    }
  ];

  const totalAcoesUrgentes = (acoesUrgentes?.orcamentos.length || 0) + 
                            (acoesUrgentes?.atividades.length || 0) + 
                            (acoesUrgentes?.visitas.length || 0);

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

      {/* Ações Urgentes */}
      {totalAcoesUrgentes > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Ações Urgentes
              <Badge variant="secondary" className="ml-2 bg-amber-500/20 text-amber-700">
                {totalAcoesUrgentes}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Atividades pendentes para hoje */}
            {acoesUrgentes?.atividades && acoesUrgentes.atividades.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Follow-ups para Hoje
                </h4>
                <div className="space-y-2">
                  {acoesUrgentes.atividades.slice(0, 3).map((ativ: any) => (
                    <div 
                      key={ativ.id} 
                      className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background cursor-pointer"
                      onClick={() => ativ.contato_id && onVerContato?.(ativ.contato_id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                          {TIPO_ATIVIDADE_ICONS[ativ.tipo] || <Clock className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{ativ.titulo}</p>
                          <p className="text-xs text-muted-foreground">
                            {ativ.contato?.nome && `${ativ.contato.nome} · `}
                            {isPast(new Date(ativ.data_atividade)) ? (
                              <span className="text-red-500">Atrasado</span>
                            ) : (
                              format(new Date(ativ.data_atividade), "HH:mm")
                            )}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orçamentos aguardando resposta */}
            {acoesUrgentes?.orcamentos && acoesUrgentes.orcamentos.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-500" />
                  Orçamentos Aguardando Resposta
                </h4>
                <div className="space-y-2">
                  {acoesUrgentes.orcamentos.slice(0, 3).map((orc: any) => {
                    const diasSemResposta = Math.floor(
                      (Date.now() - new Date(orc.status_updated_at).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div 
                        key={orc.id} 
                        className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background cursor-pointer"
                        onClick={() => onVerOrcamento?.(orc.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center",
                            orc.status === 'sem_resposta' ? "bg-red-500/10" : "bg-amber-500/10"
                          )}>
                            <FileText className={cn(
                              "h-4 w-4",
                              orc.status === 'sem_resposta' ? "text-red-500" : "text-amber-500"
                            )} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{orc.codigo} - {orc.cliente_nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(orc.total_com_desconto || orc.total_geral)} · 
                              <span className={diasSemResposta >= 7 ? "text-red-500" : ""}>
                                {' '}{diasSemResposta} dias
                              </span>
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={orc.status === 'sem_resposta' ? "border-red-500/30 text-red-600" : ""}
                        >
                          {orc.status === 'sem_resposta' ? 'Sem Resposta' : 'Enviado'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Visitas pendentes */}
            {acoesUrgentes?.visitas && acoesUrgentes.visitas.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  Visitas para Confirmar
                </h4>
                <div className="space-y-2">
                  {acoesUrgentes.visitas.slice(0, 3).map((visita: any) => (
                    <div 
                      key={visita.id} 
                      className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{visita.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(visita.data_agendada), "dd/MM")} às {visita.horario_agendado}
                          </p>
                        </div>
                      </div>
                      <a 
                        href={`https://wa.me/55${visita.telefone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button size="sm" variant="outline" className="h-7 gap-1">
                          <MessageSquare className="h-3 w-3" />
                          WhatsApp
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline de Orçamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Pipeline de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPipeline ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : resumoPipeline ? (
              <div className="space-y-3">
                {resumoPipeline.resumo.filter(s => s.quantidade > 0).map((status) => {
                  const maxQtd = Math.max(...resumoPipeline.resumo.map(s => s.quantidade), 1);
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
                
                {resumoPipeline.resumo.filter(s => s.quantidade > 0).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum orçamento em aberto
                  </p>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

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
                  <div 
                    key={atividade.id} 
                    className="flex items-start gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg -mx-2"
                    onClick={() => atividade.contato_id && onVerContato?.(atividade.contato_id)}
                  >
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

      {/* Leads Quentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Resumo de Contatos
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
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">{formatCurrency(metrics?.orcamentos?.valorPago || 0)}</span>
              </div>
              <div>
                <p className="font-medium">Faturado</p>
                <p className="text-xs text-muted-foreground">Total em vendas</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
