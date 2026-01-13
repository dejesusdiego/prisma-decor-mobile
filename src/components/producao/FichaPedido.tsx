import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  ArrowLeft,
  Package,
  User,
  MapPin,
  Phone,
  Clock,
  Calendar,
  CheckCircle2,
  Printer,
  FileText,
  Truck,
  History,
  FileDown,
  Zap
} from 'lucide-react';
import { gerarPdfProducao } from '@/lib/gerarPdfProducao';
import { toast } from 'sonner';
import { 
  useProducaoData, 
  STATUS_PRODUCAO_LABELS, 
  STATUS_ITEM_LABELS,
  PRIORIDADE_LABELS,
  HistoricoProducao
} from '@/hooks/useProducaoData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDateOnly } from '@/lib/dateOnly';
import { cn } from '@/lib/utils';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { ListaMateriaisPedido } from './ListaMateriaisPedido';

interface FichaPedidoProps {
  pedidoId: string;
  onVoltar: () => void;
  onAgendarInstalacao?: () => void;
}

export function FichaPedido({ pedidoId, onVoltar, onAgendarInstalacao }: FichaPedidoProps) {
  const { pedidos, isLoading, atualizarStatusPedido, atualizarPrioridade, atualizarStatusItem, fetchHistorico } = useProducaoData();
  const [historico, setHistorico] = useState<HistoricoProducao[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  const pedido = pedidos.find(p => p.id === pedidoId);

  useEffect(() => {
    if (pedidoId) {
      setLoadingHistorico(true);
      fetchHistorico(pedidoId)
        .then(setHistorico)
        .finally(() => setLoadingHistorico(false));
    }
  }, [pedidoId, fetchHistorico]);

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (isLoading || !pedido) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const statusInfo = STATUS_PRODUCAO_LABELS[pedido.status_producao];
  const prioridadeInfo = PRIORIDADE_LABELS[pedido.prioridade];
  const todosItensProntos = pedido.itens_pedido?.every(i => i.status_item === 'pronto');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onVoltar}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{pedido.numero_pedido}</h1>
              <Badge className={cn(statusInfo.color, "text-white")}>
                {statusInfo.label}
              </Badge>
              <Badge variant="outline" className={cn(prioridadeInfo.color, "text-white border-0")}>
                {prioridadeInfo.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Orçamento: {pedido.orcamento?.codigo}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={async () => {
              try {
                await gerarPdfProducao(pedidoId);
                toast.success('PDF de produção gerado!');
              } catch (error) {
                toast.error('Erro ao gerar PDF');
              }
            }}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Ficha PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          {todosItensProntos && pedido.status_producao !== 'entregue' && (
            <Button size="sm" onClick={onAgendarInstalacao}>
              <Truck className="h-4 w-4 mr-2" />
              Agendar Instalação
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Dados do Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">{pedido.orcamento?.cliente_nome}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                {pedido.orcamento?.cliente_telefone}
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-1 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p>{pedido.orcamento?.endereco}</p>
                <p className="text-muted-foreground">{pedido.orcamento?.cidade}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Controles
              <HelpTooltip content="Altere o status geral e a prioridade do pedido" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Status do Pedido</label>
              <Select 
                value={pedido.status_producao} 
                onValueChange={(value) => atualizarStatusPedido({ pedidoId: pedido.id, novoStatus: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_PRODUCAO_LABELS).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", info.color)} />
                        {info.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Prioridade</label>
              <Select 
                value={pedido.prioridade} 
                onValueChange={(value) => atualizarPrioridade({ pedidoId: pedido.id, novaPrioridade: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORIDADE_LABELS).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", info.color)} />
                        {info.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Datas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Datas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Entrada:</span>
              <span className="font-medium">
                {format(new Date(pedido.data_entrada), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Previsão:</span>
              <span className="font-medium">
                {formatDateOnly(pedido.previsao_entrega)}
              </span>
            </div>
            {pedido.data_pronto && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pronto em:</span>
                <span className="font-medium text-green-600">
                  {formatDateOnly(pedido.data_pronto)}
                </span>
              </div>
            )}
            <Separator />
            <div className="text-sm">
              <p className="font-medium">
                Valor: {formatCurrency(pedido.orcamento?.total_com_desconto || pedido.orcamento?.total_geral)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Itens do Pedido */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Itens do Pedido
            <Badge variant="secondary">{pedido.itens_pedido?.length || 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pedido.itens_pedido?.map((item, index) => {
              const itemStatusInfo = STATUS_ITEM_LABELS[item.status_item];
              
              return (
                <div 
                  key={item.id}
                  className="p-4 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-muted-foreground">#{index + 1}</span>
                        <h4 className="font-medium">
                          {item.cortina_item?.nome_identificacao || 'Item sem nome'}
                        </h4>
                        <Badge className={cn(itemStatusInfo.color, "text-white text-xs")}>
                          {itemStatusInfo.label}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Tipo:</span>
                          <p>{item.cortina_item?.tipo_cortina}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Produto:</span>
                          <p>{item.cortina_item?.tipo_produto}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Dimensões:</span>
                          <p>{item.cortina_item?.largura}m × {item.cortina_item?.altura}m</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Quantidade:</span>
                          <p>{item.cortina_item?.quantidade || 1}</p>
                        </div>
                        {item.cortina_item?.ambiente && (
                          <div>
                            <span className="text-muted-foreground">Ambiente:</span>
                            <p>{item.cortina_item.ambiente}</p>
                          </div>
                        )}
                        {item.cortina_item?.motorizada && (
                          <div>
                            <span className="text-muted-foreground">Motorização:</span>
                            <p className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-medium">
                              <Zap className="h-3 w-3" />
                              Motorizada
                            </p>
                          </div>
                        )}
                        {item.responsavel && (
                          <div>
                            <span className="text-muted-foreground">Responsável:</span>
                            <p>{item.responsavel}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Select 
                        value={item.status_item} 
                        onValueChange={(value) => atualizarStatusItem({ itemId: item.id, novoStatus: value })}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_ITEM_LABELS).map(([key, info]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", info.color)} />
                                {info.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Materiais */}
      <ListaMateriaisPedido 
        pedidoId={pedido.id} 
        statusPedido={pedido.status_producao} 
      />

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Produção
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistorico ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : historico.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum registro no histórico
            </p>
          ) : (
            <div className="space-y-3">
              {historico.map(evento => (
                <div 
                  key={evento.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                >
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm">{evento.descricao}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(evento.data_evento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      <span>•</span>
                      <User className="h-3 w-3" />
                      {evento.usuario_nome}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Observações */}
      {pedido.observacoes_producao && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{pedido.observacoes_producao}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
