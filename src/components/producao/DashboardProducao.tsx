import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Truck, 
  LayoutGrid,
  Calendar,
  ArrowRight,
  Layers,
  FileBarChart
} from 'lucide-react';
import { useProducaoData, STATUS_PRODUCAO_LABELS, PRIORIDADE_LABELS } from '@/hooks/useProducaoData';
import { TipBanner } from '@/components/ui/TipBanner';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { PainelCapacidadeEtapas } from './PainelCapacidadeEtapas';
import { parseDateOnly, diasRestantesDateOnly, isPastDateOnly } from '@/lib/dateOnly';

interface DashboardProducaoProps {
  onNavigate: (view: string) => void;
  onVerPedido?: (pedidoId: string) => void;
}

export function DashboardProducao({ onNavigate, onVerPedido }: DashboardProducaoProps) {
  const { pedidos, metricas, isLoading } = useProducaoData();

  const pedidosPrioritarios = pedidos
    .filter(p => !['entregue', 'cancelado'].includes(p.status_producao))
    .sort((a, b) => {
      const prioridadeOrdem = { urgente: 0, alta: 1, normal: 2, baixa: 3 };
      return prioridadeOrdem[a.prioridade] - prioridadeOrdem[b.prioridade];
    })
    .slice(0, 5);

  const pedidosAtrasados = pedidos.filter(p => {
    if (!p.previsao_entrega || ['entregue', 'cancelado'].includes(p.status_producao)) return false;
    return isPastDateOnly(p.previsao_entrega);
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TipBanner
        id="producao-dashboard-welcome"
        title="Bem-vindo à Produção"
        variant="info"
      >
        Aqui você acompanha todos os pedidos em produção. Os pedidos são criados automaticamente 
        quando um orçamento atinge 40% de pagamento. Use o Kanban para gerenciar o fluxo de trabalho.
      </TipBanner>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => onNavigate('prodKanban')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Aguardando Materiais
                  <HelpTooltip content="Pedidos que estão esperando a compra ou chegada de materiais" />
                </p>
                <p className="text-3xl font-bold text-yellow-600">{metricas.aguardandoMateriais}</p>
              </div>
              <Package className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => onNavigate('prodKanban')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Em Produção
                  <HelpTooltip content="Pedidos com itens sendo cortados, costurados ou finalizados" />
                </p>
                <p className="text-3xl font-bold text-blue-600">{metricas.emProducao}</p>
              </div>
              <Layers className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => onNavigate('prodKanban')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Prontos
                  <HelpTooltip content="Pedidos finalizados aguardando instalação ou entrega" />
                </p>
                <p className="text-3xl font-bold text-green-600">{metricas.prontos}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => onNavigate('prodAgenda')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Instalações Pendentes
                  <HelpTooltip content="Instalações agendadas que ainda não foram realizadas" />
                </p>
                <p className="text-3xl font-bold text-indigo-600">{metricas.instalacoesPendentes}</p>
              </div>
              <Calendar className="h-8 w-8 text-indigo-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {(metricas.urgentes > 0 || pedidosAtrasados.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {metricas.urgentes > 0 && (
            <Card className="border-orange-500/50 bg-orange-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-orange-500" />
                  <div>
                    <p className="font-semibold text-orange-700 dark:text-orange-400">
                      {metricas.urgentes} pedido(s) urgente(s)
                    </p>
                    <p className="text-sm text-muted-foreground">Requerem atenção imediata</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {pedidosAtrasados.length > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-destructive" />
                  <div>
                    <p className="font-semibold text-destructive">
                      {pedidosAtrasados.length} pedido(s) atrasado(s)
                    </p>
                    <p className="text-sm text-muted-foreground">Passaram da previsão de entrega</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Ações Rápidas */}
      <div className="flex gap-3 flex-wrap">
        <Button onClick={() => onNavigate('prodKanban')} className="gap-2">
          <LayoutGrid className="h-4 w-4" />
          Ver Kanban
        </Button>
        <Button variant="outline" onClick={() => onNavigate('prodLista')} className="gap-2">
          <Package className="h-4 w-4" />
          Lista de Pedidos
        </Button>
        <Button variant="outline" onClick={() => onNavigate('prodAgenda')} className="gap-2">
          <Calendar className="h-4 w-4" />
          Agenda de Instalações
        </Button>
        <Button variant="outline" onClick={() => onNavigate('prodRelatorio')} className="gap-2">
          <FileBarChart className="h-4 w-4" />
          Relatórios
        </Button>
      </div>

      {/* Painel de Capacidade por Etapa */}
      <PainelCapacidadeEtapas />

      {/* Pedidos Prioritários */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Pedidos Prioritários
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('prodLista')} className="gap-1">
            Ver todos
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {pedidosPrioritarios.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum pedido em produção no momento
            </p>
          ) : (
            <div className="space-y-3">
              {pedidosPrioritarios.map(pedido => {
                const statusInfo = STATUS_PRODUCAO_LABELS[pedido.status_producao];
                const prioridadeInfo = PRIORIDADE_LABELS[pedido.prioridade];
                const diasRestantes = diasRestantesDateOnly(pedido.previsao_entrega);
                
                return (
                  <div 
                    key={pedido.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => onVerPedido ? onVerPedido(pedido.id) : onNavigate('prodLista')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-10 rounded-full ${prioridadeInfo.color}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{pedido.numero_pedido}</span>
                          <Badge variant="outline" className="text-xs">
                            {pedido.orcamento?.codigo}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {pedido.orcamento?.cliente_nome}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">
                          {pedido.itens_pedido?.length || 0} item(s)
                        </p>
                        {diasRestantes !== null && (
                          <p className={diasRestantes < 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                            {diasRestantes < 0 
                              ? `${Math.abs(diasRestantes)} dias atrasado`
                              : diasRestantes === 0 
                                ? 'Entrega hoje'
                                : `${diasRestantes} dias restantes`
                            }
                          </p>
                        )}
                      </div>
                      <Badge className={`${statusInfo.color} text-white`}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo de Entregas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Resumo de Produção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{metricas.totalPedidos}</p>
              <p className="text-sm text-muted-foreground">Total de Pedidos</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-green-600">{metricas.entregues}</p>
              <p className="text-sm text-muted-foreground">Entregues</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-blue-600">
                {metricas.aguardandoMateriais + metricas.emProducao + metricas.qualidade}
              </p>
              <p className="text-sm text-muted-foreground">Em Andamento</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-purple-600">{metricas.prontos}</p>
              <p className="text-sm text-muted-foreground">Prontos p/ Entrega</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
