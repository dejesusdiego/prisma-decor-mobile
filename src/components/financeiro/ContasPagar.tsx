import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { parseDateOnly, formatDateOnly, startOfToday } from '@/lib/dateOnly';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Repeat,
  Loader2,
  ExternalLink
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { DialogContaPagar } from './dialogs/DialogContaPagar';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { TipBanner } from '@/components/ui/TipBanner';
import { BreadcrumbsFinanceiro } from './BreadcrumbsFinanceiro';

interface ContasPagarProps {
  onVisualizarOrcamento?: (orcamentoId: string) => void;
  onNavigate?: (view: string) => void;
}
type StatusFilter = 'todos' | 'pendente' | 'pago' | 'atrasado';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const getStatusBadge = (status: string, dataVencimento: string) => {
  const hoje = startOfToday();
  const vencimento = parseDateOnly(dataVencimento);
  const isAtrasado = status === 'pendente' && vencimento && vencimento < hoje;
  
  if (status === 'pago') {
    return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Pago</Badge>;
  }
  if (isAtrasado || status === 'atrasado') {
    return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Atrasado</Badge>;
  }
  return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
};

export function ContasPagar({ onVisualizarOrcamento, onNavigate }: ContasPagarProps) {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganizationContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contaEditando, setContaEditando] = useState<any>(null);
  const [gerandoRecorrentes, setGerandoRecorrentes] = useState(false);

  const { data: contas = [], isLoading } = useQuery({
    queryKey: ['contas-pagar', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_pagar')
        .select(`
          *,
          categoria:categorias_financeiras(nome, cor),
          forma_pagamento:formas_pagamento(nome),
          orcamento:orcamentos(id, codigo, cliente_nome)
        `)
        .eq('organization_id', organizationId)
        .order('data_vencimento', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contas_pagar').delete().eq('id', id).eq('organization_id', organizationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      toast.success('Conta excluída com sucesso');
    },
    onError: () => {
      toast.error('Erro ao excluir conta');
    }
  });

  const baixarMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contas_pagar')
        .update({ status: 'pago', data_pagamento: new Date().toISOString().split('T')[0] })
        .eq('id', id)
        .eq('organization_id', organizationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      toast.success('Conta baixada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao baixar conta');
    }
  });

  const filteredContas = contas.filter(conta => {
    const matchesSearch = conta.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'todos') return matchesSearch;
    if (statusFilter === 'atrasado') {
      const hoje = startOfToday();
      const vencimento = parseDateOnly(conta.data_vencimento);
      return matchesSearch && conta.status === 'pendente' && vencimento && vencimento < hoje;
    }
    return matchesSearch && conta.status === statusFilter;
  });

  const totais = {
    pendente: filteredContas.filter(c => c.status === 'pendente').reduce((acc, c) => acc + Number(c.valor), 0),
    pago: filteredContas.filter(c => c.status === 'pago').reduce((acc, c) => acc + Number(c.valor), 0),
    atrasado: filteredContas.filter(c => {
      const hoje = startOfToday();
      const vencimento = parseDateOnly(c.data_vencimento);
      return c.status === 'pendente' && vencimento && vencimento < hoje;
    }).reduce((acc, c) => acc + Number(c.valor), 0),
  };

  const handleEdit = (conta: any) => {
    setContaEditando(conta);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setContaEditando(null);
    setDialogOpen(true);
  };

  const handleGerarRecorrentes = async () => {
    setGerandoRecorrentes(true);
    try {
      const response = await supabase.functions.invoke('generate-recurring-bills');
      
      if (response.error) {
        throw response.error;
      }
      
      const data = response.data;
      
      if (data?.success) {
        queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
        toast.success(
          `Geração concluída: ${data.resumo.contas_geradas} conta(s) criada(s)`,
          {
            description: `${data.resumo.contas_ignoradas} já existiam ou não precisavam ser geradas`
          }
        );
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao gerar recorrentes:', error);
      toast.error('Erro ao gerar contas recorrentes');
    } finally {
      setGerandoRecorrentes(false);
    }
  };

  // Contar recorrentes
  const totalRecorrentes = contas.filter(c => c.recorrente).length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <BreadcrumbsFinanceiro currentView="finContasPagar" onNavigate={onNavigate} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contas a Pagar</h1>
          <p className="text-muted-foreground">Gerencie suas despesas e pagamentos</p>
        </div>
        <div className="flex gap-2">
          {totalRecorrentes > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    onClick={handleGerarRecorrentes}
                    disabled={gerandoRecorrentes}
                  >
                    {gerandoRecorrentes ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Gerar Recorrentes
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Gerar próximas contas para {totalRecorrentes} conta(s) recorrente(s)
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <HelpTooltip content="Valor total de contas ainda não pagas">
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
              <HelpTooltip content="Contas com vencimento anterior a hoje que ainda não foram pagas">
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
              <HelpTooltip content="Valor total já pago no período">
                Pago
              </HelpTooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totais.pago)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Dica sobre recorrentes */}
      {totalRecorrentes > 0 && (
        <TipBanner id="financeiro-contas-pagar-recorrentes" variant="tip">
          Você tem <strong>{totalRecorrentes}</strong> conta(s) recorrente(s). 
          Clique em <strong>"Gerar Recorrentes"</strong> para criar automaticamente as próximas parcelas.
        </TipBanner>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição ou fornecedor..."
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
                <TableHead>Descrição</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredContas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma conta encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredContas.map((conta) => (
                  <TableRow key={conta.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {conta.descricao}
                        {conta.recorrente && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="h-5 px-1.5 gap-0.5">
                                  <Repeat className="h-3 w-3" />
                                  <span className="text-[10px]">
                                    {conta.frequencia_recorrencia === 'semanal' ? '7d' :
                                     conta.frequencia_recorrencia === 'quinzenal' ? '15d' :
                                     conta.frequencia_recorrencia === 'mensal' ? '1m' :
                                     conta.frequencia_recorrencia === 'bimestral' ? '2m' :
                                     conta.frequencia_recorrencia === 'trimestral' ? '3m' :
                                     conta.frequencia_recorrencia === 'semestral' ? '6m' :
                                     conta.frequencia_recorrencia === 'anual' ? '1a' : ''}
                                  </span>
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Conta recorrente ({conta.frequencia_recorrencia})</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {conta.orcamento && onVisualizarOrcamento && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => onVisualizarOrcamento(conta.orcamento_id)}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Ver orçamento {conta.orcamento.codigo}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{conta.fornecedor || '-'}</TableCell>
                    <TableCell>
                      {conta.categoria ? (
                        <Badge 
                          variant="outline" 
                          style={{ borderColor: conta.categoria.cor, color: conta.categoria.cor }}
                        >
                          {conta.categoria.nome}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {formatDateOnly(conta.data_vencimento)}
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(Number(conta.valor))}</TableCell>
                    <TableCell>{getStatusBadge(conta.status, conta.data_vencimento)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {conta.status === 'pendente' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => baixarMutation.mutate(conta.id)}
                            title="Baixar"
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DialogContaPagar
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        conta={contaEditando}
      />
    </div>
  );
}
