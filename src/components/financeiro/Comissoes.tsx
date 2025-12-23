import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
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
import { DialogComissao } from './dialogs/DialogComissao';

type StatusFilter = 'todos' | 'pendente' | 'pago';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

interface ComissoesProps {
  onVisualizarOrcamento?: (orcamentoId: string) => void;
}

export function Comissoes({ onVisualizarOrcamento }: ComissoesProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [comissaoEditando, setComissaoEditando] = useState<any>(null);

  const { data: comissoes = [], isLoading } = useQuery({
    queryKey: ['comissoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comissoes')
        .select(`
          *,
          orcamento:orcamentos(id, codigo, cliente_nome, total_geral)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('comissoes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      toast.success('Comissão excluída com sucesso');
    },
    onError: () => {
      toast.error('Erro ao excluir comissão');
    }
  });

  const pagarMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('comissoes')
        .update({ status: 'pago', data_pagamento: new Date().toISOString().split('T')[0] })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      toast.success('Comissão marcada como paga');
    },
    onError: () => {
      toast.error('Erro ao pagar comissão');
    }
  });

  const filteredComissoes = comissoes.filter(comissao => {
    const matchesSearch = 
      comissao.vendedor_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comissao.orcamento?.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comissao.orcamento?.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'todos') return matchesSearch;
    return matchesSearch && comissao.status === statusFilter;
  });

  const totais = {
    pendente: filteredComissoes.filter(c => c.status === 'pendente').reduce((acc, c) => acc + Number(c.valor_comissao), 0),
    pago: filteredComissoes.filter(c => c.status === 'pago').reduce((acc, c) => acc + Number(c.valor_comissao), 0),
    total: filteredComissoes.reduce((acc, c) => acc + Number(c.valor_comissao), 0),
  };

  const handleEdit = (comissao: any) => {
    setComissaoEditando(comissao);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setComissaoEditando(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comissões</h1>
          <p className="text-muted-foreground">Gerencie as comissões dos vendedores</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Comissão
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totais.pendente)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totais.pago)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totais.total)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por vendedor, orçamento ou cliente..."
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
                <TableHead>Vendedor</TableHead>
                <TableHead>Orçamento</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor Base</TableHead>
                <TableHead>%</TableHead>
                <TableHead>Comissão</TableHead>
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
              ) : filteredComissoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8" />
                      <p>Nenhuma comissão encontrada</p>
                      <Button variant="outline" size="sm" onClick={handleNew}>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar primeira comissão
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredComissoes.map((comissao) => (
                  <TableRow key={comissao.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {comissao.vendedor_nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      {comissao.orcamento ? (
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-sm">{comissao.orcamento.codigo}</span>
                          {onVisualizarOrcamento && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => onVisualizarOrcamento(comissao.orcamento_id)}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ver orçamento</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{comissao.orcamento?.cliente_nome || '-'}</TableCell>
                    <TableCell>{formatCurrency(Number(comissao.valor_base))}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{comissao.percentual}%</Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      {formatCurrency(Number(comissao.valor_comissao))}
                    </TableCell>
                    <TableCell>
                      {comissao.status === 'pago' ? (
                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Pago
                          {comissao.data_pagamento && (
                            <span className="ml-1 text-[10px]">
                              ({format(new Date(comissao.data_pagamento), 'dd/MM', { locale: ptBR })})
                            </span>
                          )}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {comissao.status === 'pendente' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => pagarMutation.mutate(comissao.id)}
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Marcar como pago</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(comissao)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(comissao.id)}
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

      <DialogComissao
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        comissao={comissaoEditando}
      />
    </div>
  );
}