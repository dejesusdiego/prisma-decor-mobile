import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Plus,
  Clock,
  MessageSquare,
  Users,
  Pencil,
  DollarSign,
  TrendingUp,
  Package,
  Wallet,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Truck,
  Factory,
  CreditCard
} from 'lucide-react';
import { useContato, useAtividades, useOrcamentosDoContato, Contato } from '@/hooks/useCRMData';
import { useContatoFinanceiro, useContatoPedidos } from '@/hooks/useContatoFinanceiro';
import { useJornadaCliente, AlertaContextual } from '@/hooks/useJornadaCliente';
import { DialogContato } from './DialogContato';
import { DialogAtividade } from './DialogAtividade';
import { JornadaCliente } from './JornadaCliente';
import { AlertasContextuais } from './AlertasContextuais';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';

const formatCurrency = (value: number | null) => {
  if (!value) return 'R$ 0';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const TIPO_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  lead: { label: 'Lead', variant: 'secondary' },
  cliente: { label: 'Cliente', variant: 'default' },
  inativo: { label: 'Inativo', variant: 'outline' }
};

const TIPO_ATIVIDADE_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  ligacao: { icon: Phone, color: 'text-blue-500 bg-blue-500/10' },
  email: { icon: Mail, color: 'text-amber-500 bg-amber-500/10' },
  reuniao: { icon: Calendar, color: 'text-purple-500 bg-purple-500/10' },
  visita: { icon: Users, color: 'text-green-500 bg-green-500/10' },
  whatsapp: { icon: MessageSquare, color: 'text-emerald-500 bg-emerald-500/10' },
  outro: { icon: Clock, color: 'text-muted-foreground bg-muted' }
};

interface DetalheContatoProps {
  contatoId: string;
  onVoltar: () => void;
  onVisualizarOrcamento?: (orcamentoId: string) => void;
}

export function DetalheContato({ contatoId, onVoltar, onVisualizarOrcamento }: DetalheContatoProps) {
  const { data: contato, isLoading: loadingContato } = useContato(contatoId);
  const { data: atividades, isLoading: loadingAtividades } = useAtividades({ contatoId });
  const { data: orcamentos, isLoading: loadingOrcamentos } = useOrcamentosDoContato(contatoId);
  
  // Integrações com Financeiro e Produção
  const { data: financeiro, isLoading: loadingFinanceiro } = useContatoFinanceiro(
    contatoId, 
    contato?.telefone || null
  );
  const { data: pedidos, isLoading: loadingPedidos } = useContatoPedidos(
    contatoId, 
    contato?.telefone || null
  );
  
  // Hook de jornada do cliente (alertas, timeline expandida, estágios)
  const { estagios, alertas, timelineExpandida, isLoading: loadingJornada } = useJornadaCliente(contatoId);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [atividadeDialogOpen, setAtividadeDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('historico');

  // Usar timeline expandida do hook de jornada (inclui pagamentos, produção, instalações)
  const timeline = useMemo(() => {
    if (!timelineExpandida || timelineExpandida.length === 0) {
      // Fallback para timeline básica se o hook não retornou dados
      const items: Array<{
        id: string;
        tipo: 'atividade' | 'orcamento' | 'pagamento' | 'producao' | 'instalacao';
        data: Date;
        titulo: string;
        subtitulo?: string;
        iconType: string;
        status?: string;
        valor?: number;
        concluida?: boolean;
      }> = [];

      atividades?.forEach(atividade => {
        items.push({
          id: `ativ-${atividade.id}`,
          tipo: 'atividade',
          data: new Date(atividade.data_atividade),
          titulo: atividade.titulo,
          subtitulo: atividade.descricao || undefined,
          iconType: atividade.tipo,
          concluida: atividade.concluida
        });
      });

      orcamentos?.forEach(orcamento => {
        items.push({
          id: `orc-${orcamento.id}`,
          tipo: 'orcamento',
          data: new Date(orcamento.created_at),
          titulo: `Orçamento ${orcamento.codigo}`,
          subtitulo: orcamento.endereco || undefined,
          iconType: 'orcamento',
          status: orcamento.status,
          valor: orcamento.total_com_desconto || orcamento.total_geral
        });
      });

      return items.sort((a, b) => b.data.getTime() - a.data.getTime());
    }
    
    return timelineExpandida;
  }, [timelineExpandida, atividades, orcamentos]);

  // Mapear iconType para componentes de ícone
  const getIconForType = (iconType: string) => {
    const iconMap: Record<string, { icon: React.ElementType; color: string }> = {
      ligacao: { icon: Phone, color: 'text-blue-500 bg-blue-500/10' },
      email: { icon: Mail, color: 'text-amber-500 bg-amber-500/10' },
      reuniao: { icon: Calendar, color: 'text-purple-500 bg-purple-500/10' },
      visita: { icon: Users, color: 'text-green-500 bg-green-500/10' },
      whatsapp: { icon: MessageSquare, color: 'text-emerald-500 bg-emerald-500/10' },
      outro: { icon: Clock, color: 'text-muted-foreground bg-muted' },
      orcamento: { icon: FileText, color: 'text-primary bg-primary/10' },
      pagamento: { icon: CreditCard, color: 'text-emerald-600 bg-emerald-500/10' },
      producao: { icon: Factory, color: 'text-blue-600 bg-blue-500/10' },
      instalacao: { icon: Truck, color: 'text-purple-600 bg-purple-500/10' }
    };
    return iconMap[iconType] || iconMap.outro;
  };

  // Handler para ações dos alertas
  const handleAlertaAcao = (alerta: AlertaContextual) => {
    if (alerta.tipo === 'sem_contato') {
      setAtividadeDialogOpen(true);
    }
    // Outros alertas podem ter ações específicas no futuro
  };

  if (loadingContato) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-1" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!contato) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Contato não encontrado</p>
        <Button variant="link" onClick={onVoltar}>Voltar</Button>
      </div>
    );
  }

  const tipoConfig = TIPO_CONFIG[contato.tipo] || TIPO_CONFIG.lead;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onVoltar}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{contato.nome}</h1>
                <Badge variant={tipoConfig.variant}>{tipoConfig.label}</Badge>
              </div>
              {contato.tags && contato.tags.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {contato.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => {
                // Navegar para criar orçamento com dados pré-populados
                const params = new URLSearchParams({
                  contato_id: contatoId,
                  cliente_nome: contato.nome,
                  cliente_telefone: contato.telefone || '',
                  endereco: contato.endereco || '',
                  cidade: contato.cidade || ''
                });
                window.location.href = `/gerarorcamento?${params.toString()}`;
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Criar Orçamento
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAtividadeDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Atividade
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        {/* Jornada do Cliente */}
        {estagios && estagios.length > 0 && (
          <Card className="p-4">
            <JornadaCliente estagios={estagios} />
          </Card>
        )}

        {/* Alertas Contextuais */}
        <AlertasContextuais alertas={alertas} onAcao={handleAlertaAcao} />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Informações do Contato */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contato.telefone && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{contato.telefone}</p>
                  </div>
                </div>
              )}
              
              {contato.telefone_secundario && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone Secundário</p>
                    <p className="font-medium">{contato.telefone_secundario}</p>
                  </div>
                </div>
              )}

              {contato.email && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{contato.email}</p>
                  </div>
                </div>
              )}

              {(contato.cidade || contato.endereco) && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Localização</p>
                    <p className="font-medium">{contato.cidade}</p>
                    {contato.endereco && (
                      <p className="text-sm text-muted-foreground">{contato.endereco}</p>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <DollarSign className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
                  <p className="text-lg font-bold">{formatCurrency(contato.valor_total_gasto)}</p>
                  <p className="text-xs text-muted-foreground">Total Gasto</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <FileText className="h-5 w-5 mx-auto text-primary mb-1" />
                  <p className="text-lg font-bold">{orcamentos?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Orçamentos</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <TrendingUp className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                  <p className="text-lg font-bold">
                    {orcamentos && orcamentos.length > 0 
                      ? formatCurrency((orcamentos.reduce((sum, o) => sum + (o.total_com_desconto || o.total_geral || 0), 0)) / orcamentos.length)
                      : 'R$ 0'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Ticket Médio</p>
                </div>
              </div>

              {contato.origem && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Origem</p>
                    <p className="font-medium capitalize">{contato.origem.replace('_', ' ')}</p>
                  </div>
                </>
              )}

              {contato.observacoes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Observações</p>
                    <p className="text-sm">{contato.observacoes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Área de Abas */}
          <Card className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <CardHeader className="pb-2">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="historico" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Histórico
                  </TabsTrigger>
                  <TabsTrigger value="financeiro" className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Financeiro
                  </TabsTrigger>
                  <TabsTrigger value="producao" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Produção
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                {/* Aba Histórico */}
                <TabsContent value="historico" className="mt-0">
                  {(loadingAtividades || loadingOrcamentos) ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex gap-4">
                          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32 mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : timeline.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum histórico ainda</p>
                      <Button 
                        variant="link" 
                        className="mt-2"
                        onClick={() => setAtividadeDialogOpen(true)}
                      >
                        Registrar primeira atividade
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {timeline.map((item) => {
                          const iconConfig = getIconForType(item.iconType);
                          const Icon = iconConfig.icon;
                          return (
                            <div 
                              key={item.id}
                              className={cn(
                                "relative flex gap-4 pl-0",
                                item.tipo === 'orcamento' && onVisualizarOrcamento && "cursor-pointer hover:bg-muted/50 -mx-4 px-4 py-2 rounded-lg transition-colors"
                              )}
                              onClick={() => {
                                if (item.tipo === 'orcamento' && onVisualizarOrcamento) {
                                  onVisualizarOrcamento(item.id.replace('orc-', ''));
                                }
                              }}
                            >
                              <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center shrink-0 z-10",
                                iconConfig.color
                              )}>
                                <Icon className="h-5 w-5" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className={cn(
                                      "font-medium",
                                      item.concluida && "line-through text-muted-foreground"
                                    )}>
                                      {item.titulo}
                                    </p>
                                    {item.subtitulo && (
                                      <p className="text-sm text-muted-foreground line-clamp-1">
                                        {item.subtitulo}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {item.valor !== undefined && (
                                      <span className="text-sm font-medium">
                                        {formatCurrency(item.valor)}
                                      </span>
                                    )}
                                    {item.status && (
                                      <Badge variant="outline" className="text-xs capitalize">
                                        {item.status.replace('_', ' ')}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(item.data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                  {' · '}
                                  {formatDistanceToNow(item.data, { addSuffix: true, locale: ptBR })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Aba Financeiro */}
                <TabsContent value="financeiro" className="mt-0">
                  {loadingFinanceiro ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : !financeiro || financeiro.contasReceber.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma conta financeira</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Resumo Financeiro */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                          <p className="text-xs text-muted-foreground">Total Recebido</p>
                          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(financeiro.totalRecebido)}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                          <p className="text-xs text-muted-foreground">A Receber</p>
                          <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                            {formatCurrency(financeiro.totalAReceber)}
                          </p>
                        </div>
                      </div>

                      {/* Lista de Contas */}
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {financeiro.contasReceber.map((conta) => (
                          <div 
                            key={conta.id} 
                            className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">
                                {conta.orcamento?.codigo || 'Conta avulsa'}
                              </span>
                              <Badge 
                                variant={conta.status === 'pago' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {conta.status}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {conta.numero_parcelas}x de {formatCurrency(conta.valor_total / conta.numero_parcelas)}
                              </span>
                              <span className="font-medium">{formatCurrency(conta.valor_total)}</span>
                            </div>
                            {conta.parcelas && conta.parcelas.length > 0 && (
                              <div className="mt-2 pt-2 border-t">
                                <div className="flex flex-wrap gap-1">
                                  {conta.parcelas.map((p) => (
                                    <div 
                                      key={p.id} 
                                      className={cn(
                                        "px-2 py-0.5 rounded text-xs",
                                        p.status === 'pago' 
                                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                          : p.status === 'atrasado'
                                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                          : 'bg-muted text-muted-foreground'
                                      )}
                                    >
                                      {p.numero_parcela}ª {formatCurrency(p.valor)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Aba Produção */}
                <TabsContent value="producao" className="mt-0">
                  {loadingPedidos ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : !pedidos || pedidos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum pedido em produção</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {pedidos.map((pedido) => {
                        const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
                          aguardando_materiais: { color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30', icon: Clock },
                          em_producao: { color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', icon: Package },
                          pronto_instalacao: { color: 'text-green-600 bg-green-100 dark:bg-green-900/30', icon: CheckCircle },
                          pronto_entrega: { color: 'text-green-600 bg-green-100 dark:bg-green-900/30', icon: CheckCircle },
                          entregue: { color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle },
                          cancelado: { color: 'text-red-600 bg-red-100 dark:bg-red-900/30', icon: XCircle },
                        };
                        const config = statusConfig[pedido.status_producao] || statusConfig.aguardando_materiais;
                        const StatusIcon = config.icon;

                        return (
                          <div 
                            key={pedido.id} 
                            className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={cn("p-1.5 rounded-full", config.color)}>
                                  <StatusIcon className="h-4 w-4" />
                                </div>
                                <span className="font-medium">{pedido.numero_pedido}</span>
                              </div>
                              <Badge variant="outline" className="text-xs capitalize">
                                {pedido.status_producao.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-muted-foreground mb-2">
                              Orçamento: {pedido.orcamento?.codigo || '-'}
                            </div>

                            {pedido.previsao_entrega && (
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>Previsão: {format(new Date(pedido.previsao_entrega), 'dd/MM/yyyy', { locale: ptBR })}</span>
                              </div>
                            )}

                            {/* Instalações agendadas */}
                            {pedido.instalacoes && pedido.instalacoes.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                  <Truck className="h-3 w-3" />
                                  Instalações Agendadas
                                </p>
                                <div className="space-y-1">
                                  {pedido.instalacoes.map((inst) => (
                                    <div 
                                      key={inst.id} 
                                      className="flex items-center justify-between text-sm"
                                    >
                                      <span>
                                        {format(new Date(inst.data_agendada), 'dd/MM/yyyy', { locale: ptBR })} - {inst.turno}
                                      </span>
                                      <Badge 
                                        variant={inst.status === 'realizada' ? 'default' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {inst.status}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>

      <DialogContato 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen}
        contato={contato}
      />

      <DialogAtividade 
        open={atividadeDialogOpen} 
        onOpenChange={setAtividadeDialogOpen}
        contatoIdInicial={contatoId}
      />
    </>
  );
}
