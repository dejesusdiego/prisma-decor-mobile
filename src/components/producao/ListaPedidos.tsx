import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter,
  Eye,
  Package,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useProducaoData, STATUS_PRODUCAO_LABELS, PRIORIDADE_LABELS } from '@/hooks/useProducaoData';
import { usePedidosFinanceiros, STATUS_LIBERACAO_LABELS } from '@/hooks/usePedidoFinanceiro';
import { AlertaFinanceiroProducao } from './AlertaFinanceiroProducao';
import { BadgeStatusFinanceiro } from './BadgeStatusFinanceiro';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ListaPedidosProps {
  onVerPedido: (pedidoId: string) => void;
}

export function ListaPedidos({ onVerPedido }: ListaPedidosProps) {
  const { pedidos, isLoading } = useProducaoData();
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todas');
  const [filtroFinanceiro, setFiltroFinanceiro] = useState<string>('todos');

  const pedidoIds = useMemo(() => pedidos.map(p => p.id), [pedidos]);
  const { data: statusFinanceiroMap } = usePedidosFinanceiros(pedidoIds);

  const pedidosFiltrados = pedidos.filter(pedido => {
    const matchBusca = busca === '' || 
      pedido.numero_pedido.toLowerCase().includes(busca.toLowerCase()) ||
      pedido.orcamento?.cliente_nome.toLowerCase().includes(busca.toLowerCase()) ||
      pedido.orcamento?.codigo.toLowerCase().includes(busca.toLowerCase());
    
    const matchStatus = filtroStatus === 'todos' || pedido.status_producao === filtroStatus;
    const matchPrioridade = filtroPrioridade === 'todas' || pedido.prioridade === filtroPrioridade;
    
    const statusFin = statusFinanceiroMap?.[pedido.id];
    let matchFinanceiro = filtroFinanceiro === 'todos';
    if (!matchFinanceiro && statusFin) {
      matchFinanceiro = statusFin.statusLiberacao === filtroFinanceiro;
    }
    
    return matchBusca && matchStatus && matchPrioridade && matchFinanceiro;
  });

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AlertaFinanceiroProducao pedidoIds={pedidoIds} />

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, cliente ou orçamento..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  {Object.entries(STATUS_PRODUCAO_LABELS).map(([key, info]) => (
                    <SelectItem key={key} value={key}>{info.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {Object.entries(PRIORIDADE_LABELS).map(([key, info]) => (
                    <SelectItem key={key} value={key}>{info.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filtroFinanceiro} onValueChange={setFiltroFinanceiro}>
                <SelectTrigger className="w-[180px]">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status Financeiro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {Object.entries(STATUS_LIBERACAO_LABELS).map(([key, info]) => (
                    <SelectItem key={key} value={key}>{info.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pedidos em Produção
            <Badge variant="secondary" className="ml-2">{pedidosFiltrados.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pedidosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum pedido encontrado</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Financeiro</TableHead>
                    <TableHead>Previsão</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidosFiltrados.map(pedido => {
                    const statusInfo = STATUS_PRODUCAO_LABELS[pedido.status_producao];
                    const prioridadeInfo = PRIORIDADE_LABELS[pedido.prioridade];
                    const statusFinanceiro = statusFinanceiroMap?.[pedido.id];
                    const diasRestantes = pedido.previsao_entrega 
                      ? differenceInDays(new Date(pedido.previsao_entrega), new Date())
                      : null;
                    const isAtrasado = diasRestantes !== null && diasRestantes < 0;
                    const isBloqueado = statusFinanceiro?.statusLiberacao === 'bloqueado';
                    
                    return (
                      <TableRow 
                        key={pedido.id}
                        className={cn(
                          "cursor-pointer hover:bg-muted/50",
                          isAtrasado && "bg-destructive/5",
                          isBloqueado && "bg-red-50/50 dark:bg-red-950/10"
                        )}
                        onClick={() => onVerPedido(pedido.id)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{pedido.numero_pedido}</p>
                            <p className="text-xs text-muted-foreground">{pedido.orcamento?.codigo}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium truncate max-w-[200px]">{pedido.orcamento?.cliente_nome}</p>
                            <p className="text-xs text-muted-foreground">{pedido.orcamento?.cidade}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span>{pedido.itens_pedido?.length || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(statusInfo.color, "text-white")}>{statusInfo.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(prioridadeInfo.color, "text-white border-0")}>{prioridadeInfo.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <BadgeStatusFinanceiro status={statusFinanceiro} />
                        </TableCell>
                        <TableCell>
                          {pedido.previsao_entrega ? (
                            <div className="flex items-center gap-1">
                              <Calendar className={cn("h-4 w-4", isAtrasado ? "text-destructive" : "text-muted-foreground")} />
                              <span className={cn(isAtrasado && "text-destructive font-medium")}>
                                {format(new Date(pedido.previsao_entrega), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(pedido.orcamento?.total_com_desconto || pedido.orcamento?.total_geral)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onVerPedido(pedido.id); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
