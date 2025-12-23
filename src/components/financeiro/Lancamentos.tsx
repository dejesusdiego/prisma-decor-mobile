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
  ArrowUpCircle,
  ArrowDownCircle,
  Download
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
import { toast } from 'sonner';
import { DialogLancamento } from './dialogs/DialogLancamento';

type TipoFilter = 'todos' | 'entrada' | 'saida';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function Lancamentos() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lancamentoEditando, setLancamentoEditando] = useState<any>(null);

  const { data: lancamentos = [], isLoading } = useQuery({
    queryKey: ['lancamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .select(`
          *,
          categoria:categorias_financeiras(nome, cor),
          forma_pagamento:formas_pagamento(nome)
        `)
        .order('data_lancamento', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lancamentos_financeiros').delete().eq('id', id);
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
      format(new Date(l.data_lancamento), 'dd/MM/yyyy'),
      l.descricao,
      l.tipo === 'entrada' ? 'Entrada' : 'Saída',
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

  return (
    <div className="space-y-6">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totais.entradas - totais.saidas >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {formatCurrency(totais.entradas - totais.saidas)}
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
                      {format(new Date(lancamento.data_lancamento), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">{lancamento.descricao}</TableCell>
                    <TableCell>
                      {lancamento.tipo === 'entrada' ? (
                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                          <ArrowDownCircle className="h-3 w-3 mr-1" />
                          Entrada
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
                    <TableCell className={`font-medium ${lancamento.tipo === 'entrada' ? 'text-green-600' : 'text-destructive'}`}>
                      {lancamento.tipo === 'entrada' ? '+' : '-'} {formatCurrency(Number(lancamento.valor))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(lancamento)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(lancamento.id)}
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

      <DialogLancamento
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lancamento={lancamentoEditando}
      />
    </div>
  );
}
