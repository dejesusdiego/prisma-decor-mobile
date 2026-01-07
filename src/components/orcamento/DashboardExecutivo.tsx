import { useState } from 'react';
import { useDashboardUnificado, ProximaAcao } from '@/hooks/useDashboardUnificado';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp,
  DollarSign,
  FileText,
  Users,
  Hammer,
  Truck,
  CalendarCheck,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Clock,
  Target,
  Zap,
  Phone,
  CircleDollarSign,
  Factory,
  Calendar,
  ChevronRight,
  LayoutDashboard,
  BarChart3,
  LineChart,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardExecutivoMetricas } from './DashboardExecutivoMetricas';
import { DashboardExecutivoTendencias } from './DashboardExecutivoTendencias';
import { RelatorioAuditoriaConsistencia } from './RelatorioAuditoriaConsistencia';

interface DashboardExecutivoProps {
  onNavigate: (view: string, params?: Record<string, string>) => void;
}

const KPISkeleton = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map(i => (
      <Card key={i}>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-28" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const AcaoCard = ({ acao, onNavigate }: { acao: ProximaAcao; onNavigate: DashboardExecutivoProps['onNavigate'] }) => {
  const icones = {
    instalacao: <Truck className="h-4 w-4 text-primary" />,
    follow_up: <Phone className="h-4 w-4 text-amber-500" />,
    parcela: <CircleDollarSign className="h-4 w-4 text-emerald-500" />,
    pedido_pronto: <Factory className="h-4 w-4 text-blue-500" />,
    sem_resposta: <Clock className="h-4 w-4 text-orange-500" />
  };
  
  const cores = {
    alta: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-900',
    media: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-900',
    baixa: 'bg-muted text-muted-foreground'
  };

  const handleClick = () => {
    switch (acao.referencia.tipo) {
      case 'instalacao':
        onNavigate('prodAgenda');
        break;
      case 'pedido':
        onNavigate('prodKanban');
        break;
      case 'contato':
        onNavigate('crmContatos', { contatoId: acao.referencia.id });
        break;
      case 'orcamento':
        onNavigate('visualizar', { id: acao.referencia.id });
        break;
      case 'parcela':
        onNavigate('finContasReceber');
        break;
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
        cores[acao.prioridade]
      )}
    >
      <div className="shrink-0">{icones[acao.tipo]}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{acao.titulo}</p>
        <p className="text-xs text-muted-foreground truncate">{acao.descricao}</p>
      </div>
      {acao.data && (
        <span className="text-xs shrink-0">{format(new Date(acao.data), 'dd/MM')}</span>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
    </div>
  );
};

export function DashboardExecutivo({ onNavigate }: DashboardExecutivoProps) {
  const [activeTab, setActiveTab] = useState('visao-geral');
  const { data, isLoading, refetch } = useDashboardUnificado();
  const metricas = data?.metricas;
  const proximasAcoes = data?.proximasAcoes || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-10" />
        </div>
        <KPISkeleton />
        <div className="grid lg:grid-cols-3 gap-4">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  const metaConversao = 30;
  const progressoConversao = metricas ? Math.min((metricas.taxaConversao / metaConversao) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            Dashboard Executivo
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Tabs de navegação */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="visao-geral" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="metricas" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Métricas</span>
          </TabsTrigger>
          <TabsTrigger value="tendencias" className="gap-2">
            <LineChart className="h-4 w-4" />
            <span className="hidden sm:inline">Tendências</span>
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Auditoria</span>
          </TabsTrigger>
        </TabsList>

        {/* Aba Visão Geral - conteúdo original */}
        <TabsContent value="visao-geral" className="mt-6 space-y-6">

      {/* KPIs principais - 4 colunas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Financeiro */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">A Receber</span>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metricas?.totalAReceber || 0)}</p>
            {(metricas?.totalVencido || 0) > 0 && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {formatCurrency(metricas?.totalVencido || 0)} vencido
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pipeline */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">Pipeline Ativo</span>
              <Target className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metricas?.valorPipelineAtivo || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metricas?.orcamentosSemResposta || 0} orçamentos aguardando
            </p>
          </CardContent>
        </Card>

        {/* Produção */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">Em Produção</span>
              <Factory className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold">{metricas?.pedidosEmProducao || 0}</p>
            <p className="text-xs text-emerald-600 mt-1">
              {metricas?.pedidosProntos || 0} prontos para entrega
            </p>
          </CardContent>
        </Card>

        {/* CRM */}
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">Follow-ups</span>
              <Users className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold">{metricas?.followUpsPendentes || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metricas?.contatosSemInteracao7d || 0} sem interação 7d
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Linha 2 - Taxa conversão + Semana + Recebido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Taxa de Conversão</span>
              <span className="text-lg font-bold">{(metricas?.taxaConversao || 0).toFixed(1)}%</span>
            </div>
            <Progress value={progressoConversao} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">Meta: {metaConversao}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CalendarCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metricas?.instalacoesEstaSemana || 0}</p>
                <p className="text-sm text-muted-foreground">Instalações esta semana</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(metricas?.recebidoMes || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Recebido este mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Linha 3 - Próximas Ações + Acesso Rápido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próximas Ações */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Próximas Ações
              </CardTitle>
              <Badge variant="secondary">{proximasAcoes.length} itens</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {proximasAcoes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Nenhuma ação pendente!</p>
              </div>
            ) : (
              proximasAcoes.slice(0, 6).map((acao, i) => (
                <AcaoCard key={i} acao={acao} onNavigate={onNavigate} />
              ))
            )}
          </CardContent>
        </Card>

        {/* Acesso Rápido */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => onNavigate('wizard')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Novo Orçamento
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => onNavigate('finDashboard')}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Financeiro
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => onNavigate('prodKanban')}
            >
              <Hammer className="h-4 w-4 mr-2" />
              Produção
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => onNavigate('crmPainel')}
            >
              <Users className="h-4 w-4 mr-2" />
              CRM
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => onNavigate('calendarioGeral')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Calendário Geral
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Alertas por módulo */}
      {((metricas?.totalVencido || 0) > 0 || 
        (metricas?.pedidosProntos || 0) > 0 || 
        (metricas?.followUpsPendentes || 0) > 3) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(metricas?.totalVencido || 0) > 0 && (
            <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <p className="font-medium text-red-700 dark:text-red-400">Parcelas Vencidas</p>
                    <p className="text-sm text-red-600/80">{formatCurrency(metricas?.totalVencido || 0)}</p>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => onNavigate('finContasReceber')}>
                    Ver
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {(metricas?.pedidosProntos || 0) > 0 && (
            <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Factory className="h-5 w-5 text-emerald-600" />
                  <div className="flex-1">
                    <p className="font-medium text-emerald-700 dark:text-emerald-400">Pedidos Prontos</p>
                    <p className="text-sm text-emerald-600/80">{metricas?.pedidosProntos} aguardando entrega</p>
                  </div>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onNavigate('prodKanban')}>
                    Ver
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {(metricas?.followUpsPendentes || 0) > 3 && (
            <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-700 dark:text-amber-400">Follow-ups Pendentes</p>
                    <p className="text-sm text-amber-600/80">{metricas?.followUpsPendentes} atividades</p>
                  </div>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => onNavigate('crmPainel')}>
                    Ver
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
        </TabsContent>

        {/* Aba Métricas Avançadas */}
        <TabsContent value="metricas" className="mt-6">
          <DashboardExecutivoMetricas onNavigate={onNavigate} />
        </TabsContent>

        {/* Aba Tendências */}
        <TabsContent value="tendencias" className="mt-6">
          <DashboardExecutivoTendencias />
        </TabsContent>

        {/* Aba Auditoria de Consistência */}
        <TabsContent value="auditoria" className="mt-6">
          <RelatorioAuditoriaConsistencia 
            onNavigate={(v, id) => {
              if (v === 'visualizarOrcamento' && id) {
                onNavigate('visualizar', { id });
              } else {
                onNavigate(v);
              }
            }} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
