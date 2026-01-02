import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Power, Trash2, Loader2, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DialogServicoConfeccao } from './DialogServicoConfeccao';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { gerarCSV, downloadCSV } from '@/lib/parserCSVMateriais';

interface ServicoConfeccao {
  id: string;
  codigo_item: string | null;
  nome_modelo: string;
  unidade: string;
  preco_custo: number;
  preco_tabela: number;
  ativo: boolean;
}

export function ListaServicosConfeccao() {
  const [servicos, setServicos] = useState<ServicoConfeccao[]>([]);
  const [servicosFiltrados, setServicosFiltrados] = useState<ServicoConfeccao[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [dialogAberto, setDialogAberto] = useState(false);
  const [servicoEditando, setServicoEditando] = useState<ServicoConfeccao | null>(null);
  const [servicoDeletando, setServicoDeletando] = useState<ServicoConfeccao | null>(null);

  const carregarServicos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('servicos_confeccao')
        .select('*')
        .order('nome_modelo', { ascending: true });

      if (error) throw error;
      setServicos(data || []);
      setServicosFiltrados(data || []);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast({
        title: 'Erro ao carregar serviços',
        description: 'Não foi possível carregar a lista de serviços',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarServicos();
  }, []);

  useEffect(() => {
    let resultado = servicos;

    if (busca) {
      resultado = resultado.filter(
        (s) =>
          s.nome_modelo.toLowerCase().includes(busca.toLowerCase()) ||
          s.codigo_item?.toLowerCase().includes(busca.toLowerCase())
      );
    }

    if (statusFiltro === 'ativos') {
      resultado = resultado.filter((s) => s.ativo);
    } else if (statusFiltro === 'inativos') {
      resultado = resultado.filter((s) => !s.ativo);
    }

    setServicosFiltrados(resultado);
  }, [busca, statusFiltro, servicos]);

  const handleToggleStatus = async (servico: ServicoConfeccao) => {
    try {
      const { error } = await supabase
        .from('servicos_confeccao')
        .update({ ativo: !servico.ativo })
        .eq('id', servico.id);

      if (error) throw error;

      toast({
        title: servico.ativo ? 'Serviço desativado' : 'Serviço ativado',
        description: `${servico.nome_modelo} foi ${servico.ativo ? 'desativado' : 'ativado'} com sucesso`,
      });

      carregarServicos();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro ao alterar status',
        description: 'Não foi possível alterar o status do serviço',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!servicoDeletando) return;

    try {
      const { error } = await supabase
        .from('servicos_confeccao')
        .delete()
        .eq('id', servicoDeletando.id);

      if (error) throw error;

      toast({
        title: 'Serviço excluído',
        description: `${servicoDeletando.nome_modelo} foi excluído com sucesso`,
      });

      setServicoDeletando(null);
      carregarServicos();
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
      toast({
        title: 'Erro ao excluir serviço',
        description: 'Não foi possível excluir o serviço',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou código..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFiltro} onValueChange={setStatusFiltro}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativos">Ativos</SelectItem>
              <SelectItem value="inativos">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {servicosFiltrados.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const colunas = [
                  { campo: 'codigo_item', titulo: 'codigo_item' },
                  { campo: 'nome_modelo', titulo: 'nome_modelo' },
                  { campo: 'unidade', titulo: 'unidade' },
                  { campo: 'preco_custo', titulo: 'preco_custo' },
                  { campo: 'ativo', titulo: 'ativo' },
                ];
                const csv = gerarCSV(servicosFiltrados, colunas);
                downloadCSV(csv, `servicos-confeccao-${new Date().toISOString().split('T')[0]}.csv`);
                toast({ title: 'Exportação concluída', description: `${servicosFiltrados.length} serviços exportados` });
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          )}
          <Button onClick={() => { setServicoEditando(null); setDialogAberto(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Serviço
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome do Modelo</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Preço Custo</TableHead>
                <TableHead className="text-right">Preço Tabela</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum serviço encontrado
                  </TableCell>
                </TableRow>
              ) : (
                servicosFiltrados.map((servico) => (
                  <TableRow key={servico.id}>
                    <TableCell className="font-mono text-sm">{servico.codigo_item || '-'}</TableCell>
                    <TableCell className="font-medium">{servico.nome_modelo}</TableCell>
                    <TableCell>{servico.unidade}</TableCell>
                    <TableCell className="text-right">R$ {servico.preco_custo.toFixed(2)}</TableCell>
                    <TableCell className="text-right">R$ {servico.preco_tabela.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={servico.ativo ? 'default' : 'secondary'}>
                        {servico.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setServicoEditando(servico); setDialogAberto(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleStatus(servico)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setServicoDeletando(servico)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <DialogServicoConfeccao
        aberto={dialogAberto}
        servico={servicoEditando}
        onClose={(sucesso) => {
          setDialogAberto(false);
          setServicoEditando(null);
          if (sucesso) carregarServicos();
        }}
      />

      <AlertDialog open={!!servicoDeletando} onOpenChange={() => setServicoDeletando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o serviço "{servicoDeletando?.nome_modelo}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
