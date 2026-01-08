import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { formatDateOnly } from '@/lib/dateOnly';
import { 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  Download,
  RefreshCw,
  ArrowLeftRight
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
import { DialogLancamento } from './dialogs/DialogLancamento';
import { DialogDevolucaoEmprestimo } from './dialogs/DialogDevolucaoEmprestimo';
import { BreadcrumbsFinanceiro } from './BreadcrumbsFinanceiro';

type TipoFilter = 'todos' | 'entrada' | 'saida' | 'emprestimo';

interface EmprestimoParaDevolucao {
  id: string;
  descricao: string;
  valor: number;
  data_lancamento: string;
  contaReceber?: {
    id: string;
    valor_total: number;
    valor_pago: number;
    status: string;
    data_vencimento: string;
    parcelas?: Array<{
      id: string;
      valor: number;
      status: string;
    }>;
  };
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

interface LancamentosProps {
  onNavigate?: (view: string) => void;
}

export function Lancamentos({ onNavigate }: LancamentosProps = {}) {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganizationContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lancamentoEditando, setLancamentoEditando] = useState<any>(null);
  const [dialogDevolucaoOpen, setDialogDevolucaoOpen] = useState(false);
  const [emprestimoParaDevolucao, setEmprestimoParaDevolucao] = useState<EmprestimoParaDevolucao | null>(null);

  const { data: lancamentos = [], isLoading } = useQuery({
    queryKey: ['lancamentos', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .select(`
          *,
          categoria:categorias_financeiras(nome, cor),
          forma_pagamento:formas_pagamento(nome)
        `)
        .eq('organization_id', organizationId)
        .order('data_lancamento', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lancamentos_financeiros').delete().eq('id', id).eq('organization_id', organizationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      toast.success('Lançamento excluído com sucesso');
    },
    onError: () => {
      toast.error('Erro ao excluir lançamento');
    }
  });

  const filteredLancamentos = lancamentos.filter(lanc => {
    const matchesSearch = lanc.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (tipoFilter === 'todos') return matchesSearch;
    return matchesSearch && lanc.tipo === tipoFilter;
  });

  const totais = {
    entradas: filteredLancamentos.filter(l => l.tipo === 'entrada').reduce((acc, l) => acc + Number(l.valor), 0),
    saidas: filteredLancamentos.filter(l => l.tipo === 'saida').reduce((acc, l) => acc + Number(l.valor), 0),
    emprestimos: filteredLancamentos.filter(l => l.tipo === 'emprestimo').reduce((acc, l) => acc + Number(l.valor), 0),
  };

  const handleEdit = (lancamento: any) => {
    setLancamentoEditando(lancamento);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setLancamentoEditando(null);
    setDialogOpen(true);
  };

  const handleExport = () => {
    // Gerar CSV simples
    const headers = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Valor'];
    const rows = filteredLancamentos.map(l => [
      formatDateOnly(l.data_lancamento),
      l.descricao,
      l.tipo === 'entrada' ? 'Entrada' : l.tipo === 'emprestimo' ? 'Empréstimo' : 'Saída',
      l.categoria?.nome || '',
      l.valor
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lancamentos_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    
    toast.success('Arquivo exportado com sucesso');
  };

  const handleDevolucao = async (lancamento: any) => {
    // Buscar conta a receber vinculada ao empréstimo
    const { data: contaReceber } = await supabase
      .from('contas_receber')
      .select('*, parcelas:parcelas_receber(*)')
      .eq('lancamento_origem_id', lancamento.id)
      .single();

    setEmprestimoParaDevolucao({
      id: lancamento.id,
      descricao: lancamento.descricao,
      valor: Number(lancamento.valor),
      data_lancamento: lancamento.data_lancamento,
      contaReceber: contaReceber || undefined,
    });
    setDialogDevolucaoOpen(true);
  };

  // Query para buscar status de devolução dos empréstimos
  const { data: statusEmprestimos = {} } = useQuery({
    queryKey: ['status-emprestimos', organizationId],
    queryFn: async () => {
      const { data: contasReceber } = await supabase
        .from('contas_receber')
        .select('lancamento_origem_id, status, valor_total, valor_pago')
        .eq('organization_id', organizationId)
        .not('lancamento_origem_id', 'is', null);

      const statusMap: Record<string, { status: string; valorPago: number; valorTotal: number }> = {};
      (contasReceber || []).forEach((cr: any) => {
        statusMap[cr.lancamento_origem_id] = {
          status: cr.status,
          valorPago: Number(cr.valor_pago),
          valorTotal: Number(cr.valor_total),
        };
      });
      return statusMap;
    },
    enabled: !!organizationId,
  });

  const getEmprestimoStatusBadge = (lancamentoId: string) => {
    const status = statusEmprestimos[lancamentoId];
    if (!status) return null;

    if (status.status === 'pago') {
      return <Badge className="bg-green-500/10 text-green-600 ml-2">Devolvido</Badge>;
    }
    if (status.valorPago > 0) {
      return <Badge className="bg-blue-500/10 text-blue-600 ml-2">Parcial</Badge>;
    }
    return <Badge variant="outline" className="ml-2">Pendente</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <BreadcrumbsFinanceiro currentView="finLancamentos" onNavigate={onNavigate} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lançamentos</h1>
          <p className="text-muted-foreground">Histórico de entradas e saídas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Lançamento
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4 text-green-600" />
              Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totais.entradas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4 text-destructive" />
              Saídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totais.saidas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-violet-600" />
              Empréstimos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-violet-600">{formatCurrency(totais.emprestimos)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totais.entradas - totais.saidas >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {formatCurrency(totais.entradas - totais.saidas)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              (empréstimos não afetam o saldo)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={tipoFilter} onValueChange={(v) => setTipoFilter(v as TipoFilter)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="saida">Saídas</SelectItem>
            <SelectItem value="emprestimo">Empréstimos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Forma Pagamento</TableHead>
                <TableHead>Valor</TableHead>
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
              ) : filteredLancamentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum lançamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredLancamentos.map((lancamento) => (
                  <TableRow key={lancamento.id}>
                    <TableCell>
                      {formatDateOnly(lancamento.data_lancamento)}
                    </TableCell>
                    <TableCell className="font-medium">{lancamento.descricao}</TableCell>
                    <TableCell>
                      {lancamento.tipo === 'entrada' ? (
                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                          <ArrowDownCircle className="h-3 w-3 mr-1" />
                          Entrada
                        </Badge>
                      ) : lancamento.tipo === 'emprestimo' ? (
                        <Badge className="bg-violet-500/10 text-violet-600 hover:bg-violet-500/20">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Empréstimo
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <ArrowUpCircle className="h-3 w-3 mr-1" />
                          Saída
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {lancamento.categoria ? (
                        <Badge 
                          variant="outline" 
                          style={{ borderColor: lancamento.categoria.cor, color: lancamento.categoria.cor }}
                        >
                          {lancamento.categoria.nome}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{lancamento.forma_pagamento?.nome || '-'}</TableCell>
                    <TableCell className={`font-medium ${
                      lancamento.tipo === 'entrada' ? 'text-green-600' : 
                      lancamento.tipo === 'emprestimo' ? 'text-violet-600' : 'text-destructive'
                    }`}>
                      {lancamento.tipo === 'entrada' ? '+' : '-'} {formatCurrency(Number(lancamento.valor))}
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <div className="flex justify-end gap-1">
                          {lancamento.tipo === 'emprestimo' && statusEmprestimos[lancamento.id]?.status !== 'pago' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDevolucao(lancamento)}
                                  className="text-violet-600 hover:text-violet-700"
                                >
                                  <ArrowLeftRight className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Registrar devolução</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(lancamento)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteMutation.mutate(lancamento.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Excluir</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DialogLancamento
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lancamento={lancamentoEditando}
      />

      <DialogDevolucaoEmprestimo
        open={dialogDevolucaoOpen}
        onOpenChange={setDialogDevolucaoOpen}
        emprestimo={emprestimoParaDevolucao}
      />
    </div>
  );
}
