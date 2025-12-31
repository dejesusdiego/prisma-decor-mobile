import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Landmark,
  Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { DialogContaReceber } from './dialogs/DialogContaReceber';
import { DialogRegistrarRecebimento } from './dialogs/DialogRegistrarRecebimento';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { TipBanner } from '@/components/ui/TipBanner';
import { formatCurrency } from '@/lib/formatters';
import { BreadcrumbsFinanceiro } from './BreadcrumbsFinanceiro';

type StatusFilter = 'todos' | 'pendente' | 'parcial' | 'pago' | 'atrasado';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pago':
      return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Pago</Badge>;
    case 'parcial':
      return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"><Clock className="h-3 w-3 mr-1" />Parcial</Badge>;
    case 'atrasado':
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Atrasado</Badge>;
    default:
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
  }
};

interface ContasReceberProps {
  onNavigate?: (view: string) => void;
}

export function ContasReceber({ onNavigate }: ContasReceberProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogRecebimentoOpen, setDialogRecebimentoOpen] = useState(false);
  const [contaEditando, setContaEditando] = useState<any>(null);
  const [parcelaSelecionada, setParcelaSelecionada] = useState<any>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data: contas = [], isLoading } = useQuery({
    queryKey: ['contas-receber'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_receber')
        .select(`
          *,
          parcelas:parcelas_receber(*),
          orcamento:orcamentos(id, codigo, cliente_nome)
        `)
        .order('data_vencimento', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contas_receber').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      toast.success('Conta excluída com sucesso');
    },
    onError: () => {
      toast.error('Erro ao excluir conta');
    }
  });

  const filteredContas = contas.filter(conta => {
    const matchesSearch = conta.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'todos') return matchesSearch;
    return matchesSearch && conta.status === statusFilter;
  });

  const totais = {
    pendente: filteredContas.filter(c => c.status === 'pendente').reduce((acc, c) => acc + Number(c.valor_total) - Number(c.valor_pago), 0),
    parcial: filteredContas.filter(c => c.status === 'parcial').reduce((acc, c) => acc + Number(c.valor_total) - Number(c.valor_pago), 0),
    pago: filteredContas.filter(c => c.status === 'pago').reduce((acc, c) => acc + Number(c.valor_total), 0),
    atrasado: filteredContas.filter(c => c.status === 'atrasado').reduce((acc, c) => acc + Number(c.valor_total) - Number(c.valor_pago), 0),
  };

  const handleEdit = (conta: any) => {
    setContaEditando(conta);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setContaEditando(null);
    setDialogOpen(true);
  };

  const handleRegistrarRecebimento = (parcela: any) => {
    setParcelaSelecionada(parcela);
    setDialogRecebimentoOpen(true);
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <BreadcrumbsFinanceiro 
        currentView="finContasReceber" 
        onNavigate={onNavigate}
      />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contas a Receber</h1>
          <p className="text-muted-foreground">Gerencie seus recebíveis e parcelas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onNavigate?.('finConciliacao')}>
            <Landmark className="h-4 w-4 mr-2" />
            Ir para Conciliação
          </Button>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <HelpTooltip content="Valor total de parcelas ainda não pagas">
                Pendente
              </HelpTooltip>
            </CardTitle>
          </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totais.pendente)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  <HelpTooltip content="Contas com pelo menos uma parcela paga, mas não todas">
                    Parcial
                  </HelpTooltip>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totais.parcial)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  <HelpTooltip content="Parcelas com vencimento anterior a hoje que ainda não foram pagas">
                    Atrasado
                  </HelpTooltip>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(totais.atrasado)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  <HelpTooltip content="Valor total já recebido no período">
                    Recebido
                  </HelpTooltip>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totais.pago)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Dica */}
          <TipBanner id="financeiro-contas-receber-dica" variant="info">
            Clique no ícone <ChevronDown className="h-3 w-3 inline" /> para expandir uma conta e ver as parcelas. 
            Use o botão <strong>"Receber"</strong> para registrar pagamentos parciais ou totais.
            Para conciliar com o extrato bancário, use a aba <strong>Conciliação</strong>.
          </TipBanner>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Valor Pago</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : filteredContas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhuma conta encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContas.map((conta) => (
                      <Collapsible key={conta.id} asChild open={expandedRows.has(conta.id)}>
                        <>
                          <TableRow className="cursor-pointer" onClick={() => toggleRow(conta.id)}>
                            <TableCell>
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  {expandedRows.has(conta.id) ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {conta.cliente_nome}
                                {conta.orcamento && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <a
                                          href={`/gerarorcamento?visualizar=${conta.orcamento.id}`}
                                          className="text-primary hover:text-primary/80"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs">Ver orçamento {conta.orcamento.codigo}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{conta.descricao}</TableCell>
                            <TableCell>
                              {format(new Date(conta.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(Number(conta.valor_total))}</TableCell>
                            <TableCell className="text-green-600">{formatCurrency(Number(conta.valor_pago))}</TableCell>
                            <TableCell>{getStatusBadge(conta.status)}</TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(conta)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteMutation.mutate(conta.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          <CollapsibleContent asChild>
                            <TableRow className="bg-muted/50">
                              <TableCell colSpan={8} className="p-4">
                                <div className="space-y-2">
                                  <h4 className="font-medium text-sm">Parcelas</h4>
                                  <div className="grid gap-2">
                                    {conta.parcelas?.map((parcela: any) => (
                                      <div 
                                        key={parcela.id} 
                                        className="flex items-center justify-between p-3 bg-background rounded-lg border"
                                      >
                                        <div className="flex items-center gap-4">
                                          <span className="text-sm font-medium">
                                            Parcela {parcela.numero_parcela}
                                          </span>
                                          <span className="text-sm text-muted-foreground">
                                            Venc: {format(new Date(parcela.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                                          </span>
                                          <span className="text-sm font-medium">
                                            {formatCurrency(Number(parcela.valor))}
                                          </span>
                                          {getStatusBadge(parcela.status)}
                                        </div>
                                        {parcela.status !== 'pago' && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleRegistrarRecebimento(parcela)}
                                          >
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Receber
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          </CollapsibleContent>
                        </>
                      </Collapsible>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

      <DialogContaReceber
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        conta={contaEditando}
      />

      <DialogRegistrarRecebimento
        open={dialogRecebimentoOpen}
        onOpenChange={setDialogRecebimentoOpen}
        parcela={parcelaSelecionada}
      />
    </div>
  );
}
