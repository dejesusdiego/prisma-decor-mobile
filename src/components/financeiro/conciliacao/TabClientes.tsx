import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Search,
  ChevronDown,
  ChevronRight,
  Receipt,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

interface ClienteResumo {
  id: string;
  nome: string;
  telefone: string | null;
  totalEsperado: number;
  totalRecebido: number;
  totalPendente: number;
  percentualPago: number;
  status: 'em_dia' | 'parcial' | 'atrasado';
  parcelas: ParcelaDetalhe[];
  ultimoPagamento: string | null;
}

interface ParcelaDetalhe {
  id: string;
  numero: number;
  valor: number;
  vencimento: string;
  status: string;
  dataPagamento: string | null;
  orcamentoCodigo: string | null;
  movimentacaoConciliada: boolean;
}

type FiltroStatus = 'todos' | 'em_dia' | 'parcial' | 'atrasado';

export function TabClientes() {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos');
  const [clientesExpandidos, setClientesExpandidos] = useState<Set<string>>(new Set());

  const { data: dadosContas = [], isLoading } = useQuery({
    queryKey: ['relatorio-conciliacao-clientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_receber')
        .select(`
          id, cliente_nome, cliente_telefone, valor_total, valor_pago, status,
          orcamento:orcamentos(id, codigo),
          parcelas:parcelas_receber(
            id, numero_parcela, valor, data_vencimento, data_pagamento, status
          )
        `)
        .order('cliente_nome');

      if (error) throw error;
      return data || [];
    }
  });

  const { data: movimentacoesConciliadas = [] } = useQuery({
    queryKey: ['movimentacoes-conciliadas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .select('id, parcela_receber_id')
        .not('parcela_receber_id', 'is', null);

      if (error) throw error;
      return data || [];
    }
  });

  const clientesResumo = useMemo<ClienteResumo[]>(() => {
    const parcelasComConciliacao = new Set(
      movimentacoesConciliadas.map(m => m.parcela_receber_id)
    );

    const clientesMap = new Map<string, ClienteResumo>();

    for (const conta of dadosContas) {
      const clienteKey = conta.cliente_nome.toLowerCase().trim();
      const existing = clientesMap.get(clienteKey);

      const parcelas: ParcelaDetalhe[] = (conta.parcelas || []).map((p: any) => ({
        id: p.id,
        numero: p.numero_parcela,
        valor: Number(p.valor),
        vencimento: p.data_vencimento,
        status: p.status,
        dataPagamento: p.data_pagamento,
        orcamentoCodigo: (conta.orcamento as any)?.codigo || null,
        movimentacaoConciliada: parcelasComConciliacao.has(p.id)
      }));

      const totalEsperado = parcelas.reduce((acc, p) => acc + p.valor, 0);
      const totalRecebido = parcelas
        .filter(p => p.status === 'pago')
        .reduce((acc, p) => acc + p.valor, 0);
      const totalPendente = totalEsperado - totalRecebido;
      const percentualPago = totalEsperado > 0 ? (totalRecebido / totalEsperado) * 100 : 0;

      const temAtrasado = parcelas.some(p => p.status === 'atrasado');
      const temParcial = parcelas.some(p => p.status === 'parcial');
      const status: 'em_dia' | 'parcial' | 'atrasado' = 
        temAtrasado ? 'atrasado' : temParcial ? 'parcial' : 'em_dia';

      const ultimoPagamento = parcelas
        .filter(p => p.dataPagamento)
        .sort((a, b) => new Date(b.dataPagamento!).getTime() - new Date(a.dataPagamento!).getTime())[0]
        ?.dataPagamento || null;

      if (existing) {
        existing.totalEsperado += totalEsperado;
        existing.totalRecebido += totalRecebido;
        existing.totalPendente += totalPendente;
        existing.percentualPago = existing.totalEsperado > 0 
          ? (existing.totalRecebido / existing.totalEsperado) * 100 
          : 0;
        existing.parcelas.push(...parcelas);
        if (temAtrasado) existing.status = 'atrasado';
        else if (temParcial && existing.status !== 'atrasado') existing.status = 'parcial';
        if (ultimoPagamento && (!existing.ultimoPagamento || new Date(ultimoPagamento) > new Date(existing.ultimoPagamento))) {
          existing.ultimoPagamento = ultimoPagamento;
        }
      } else {
        clientesMap.set(clienteKey, {
          id: conta.id,
          nome: conta.cliente_nome,
          telefone: conta.cliente_telefone,
          totalEsperado,
          totalRecebido,
          totalPendente,
          percentualPago,
          status,
          parcelas,
          ultimoPagamento
        });
      }
    }

    return Array.from(clientesMap.values())
      .sort((a, b) => b.totalPendente - a.totalPendente);
  }, [dadosContas, movimentacoesConciliadas]);

  const clientesFiltrados = useMemo(() => {
    return clientesResumo.filter(cliente => {
      const matchBusca = cliente.nome.toLowerCase().includes(busca.toLowerCase()) ||
                         cliente.telefone?.includes(busca);
      const matchStatus = filtroStatus === 'todos' || cliente.status === filtroStatus;
      return matchBusca && matchStatus;
    });
  }, [clientesResumo, busca, filtroStatus]);

  const totais = useMemo(() => {
    const totalEsperado = clientesResumo.reduce((acc, c) => acc + c.totalEsperado, 0);
    const totalRecebido = clientesResumo.reduce((acc, c) => acc + c.totalRecebido, 0);
    const totalPendente = clientesResumo.reduce((acc, c) => acc + c.totalPendente, 0);
    const clientesEmDia = clientesResumo.filter(c => c.status === 'em_dia').length;
    const clientesAtrasados = clientesResumo.filter(c => c.status === 'atrasado').length;
    const clientesParciais = clientesResumo.filter(c => c.status === 'parcial').length;

    return { totalEsperado, totalRecebido, totalPendente, clientesEmDia, clientesAtrasados, clientesParciais };
  }, [clientesResumo]);

  const toggleCliente = (id: string) => {
    setClientesExpandidos(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return <Badge variant="default" className="bg-green-100 text-green-800">Pago</Badge>;
      case 'parcial':
        return <Badge variant="default" className="bg-amber-100 text-amber-800">Parcial</Badge>;
      case 'atrasado':
        return <Badge variant="destructive">Atrasado</Badge>;
      case 'pendente':
        return <Badge variant="outline">Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Recebido</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totais.totalRecebido)}</p>
            <p className="text-xs text-muted-foreground">
              {totais.totalEsperado > 0 ? ((totais.totalRecebido / totais.totalEsperado) * 100).toFixed(0) : 0}% do esperado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-muted-foreground">Pendente</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(totais.totalPendente)}</p>
            <p className="text-xs text-muted-foreground">A receber</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Em Dia</span>
            </div>
            <p className="text-2xl font-bold">{totais.clientesEmDia}</p>
            <p className="text-xs text-muted-foreground">clientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Atrasados</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{totais.clientesAtrasados}</p>
            <p className="text-xs text-muted-foreground">+ {totais.clientesParciais} parciais</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Visão por Cliente
          </CardTitle>
          <CardDescription>
            Recebimentos identificados vs esperados, valores pendentes e histórico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filtroStatus} onValueChange={(v: FiltroStatus) => setFiltroStatus(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="em_dia">Em Dia</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-2">
              {clientesFiltrados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum cliente encontrado
                </div>
              ) : (
                clientesFiltrados.map((cliente) => (
                  <Collapsible 
                    key={cliente.id}
                    open={clientesExpandidos.has(cliente.id)}
                    onOpenChange={() => toggleCliente(cliente.id)}
                  >
                    <Card className={cliente.status === 'atrasado' ? 'border-red-200 bg-red-50/30' : ''}>
                      <CollapsibleTrigger className="w-full">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {clientesExpandidos.has(cliente.id) ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">{cliente.nome}</p>
                                {getStatusBadge(cliente.status)}
                              </div>
                              {cliente.telefone && (
                                <p className="text-sm text-muted-foreground">{cliente.telefone}</p>
                              )}
                            </div>

                            <div className="flex-shrink-0 text-right">
                              <div className="flex items-center gap-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">Recebido</p>
                                  <p className="font-medium text-green-600">{formatCurrency(cliente.totalRecebido)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Pendente</p>
                                  <p className="font-medium text-amber-600">{formatCurrency(cliente.totalPendente)}</p>
                                </div>
                              </div>
                              <Progress 
                                value={cliente.percentualPago} 
                                className="h-1 w-32 mt-1"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <Separator />
                        <div className="p-4 bg-muted/30">
                          <p className="text-sm font-medium mb-3">Histórico de Parcelas</p>
                          <div className="space-y-2">
                            {cliente.parcelas
                              .sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime())
                              .map((parcela) => (
                              <div 
                                key={parcela.id}
                                className="flex items-center justify-between p-2 bg-background rounded-lg border"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <Receipt className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                      Parcela {parcela.numero}
                                    </span>
                                  </div>
                                  {parcela.orcamentoCodigo && (
                                    <Badge variant="outline" className="text-xs">
                                      {parcela.orcamentoCodigo}
                                    </Badge>
                                  )}
                                  {parcela.movimentacaoConciliada && (
                                    <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                                      Conciliado
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-sm font-medium">{formatCurrency(parcela.valor)}</p>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      <span>Venc: {format(new Date(parcela.vencimento), 'dd/MM/yyyy')}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="w-20">
                                    {getStatusBadge(parcela.status)}
                                  </div>
                                  
                                  {parcela.dataPagamento && (
                                    <div className="text-xs text-green-600">
                                      <DollarSign className="h-3 w-3 inline" />
                                      {format(new Date(parcela.dataPagamento), 'dd/MM')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {cliente.ultimoPagamento && (
                            <p className="text-xs text-muted-foreground mt-3">
                              Último pagamento: {format(new Date(cliente.ultimoPagamento), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
