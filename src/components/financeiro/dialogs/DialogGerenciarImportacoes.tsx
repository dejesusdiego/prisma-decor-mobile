import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Trash2, Eye, Database, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface DialogGerenciarImportacoesProps {
  onSelectExtrato: (id: string) => void;
}

export function DialogGerenciarImportacoes({ onSelectExtrato }: DialogGerenciarImportacoesProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Buscar extratos com estatísticas
  const { data: extratos = [], isLoading } = useQuery({
    queryKey: ['extratos-bancarios-detalhados'],
    queryFn: async () => {
      const { data: extratosData, error: extError } = await supabase
        .from('extratos_bancarios')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (extError) throw extError;

      // Buscar estatísticas para cada extrato
      const extratosComStats = await Promise.all(
        (extratosData || []).map(async (ext) => {
          const { data: movs } = await supabase
            .from('movimentacoes_extrato')
            .select('id, conciliado, ignorado')
            .eq('extrato_id', ext.id);

          const total = movs?.length || 0;
          const conciliados = movs?.filter(m => m.conciliado).length || 0;
          const ignorados = movs?.filter(m => m.ignorado).length || 0;
          const pendentes = total - conciliados - ignorados;

          return {
            ...ext,
            stats: { total, conciliados, ignorados, pendentes }
          };
        })
      );

      return extratosComStats;
    },
    enabled: open
  });

  // Deletar extrato (cascade deleta movimentações)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Primeiro deletar movimentações
      const { error: movError } = await supabase
        .from('movimentacoes_extrato')
        .delete()
        .eq('extrato_id', id);
      
      if (movError) throw movError;

      // Depois deletar extrato
      const { error } = await supabase
        .from('extratos_bancarios')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Importação excluída');
      queryClient.invalidateQueries({ queryKey: ['extratos-bancarios'] });
      queryClient.invalidateQueries({ queryKey: ['extratos-bancarios-detalhados'] });
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir: ' + error.message);
    }
  });

  const handleView = (id: string) => {
    onSelectExtrato(id);
    setOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Database className="h-4 w-4 mr-2" />
            Gerenciar Importações
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Importações de Extratos
            </DialogTitle>
            <DialogDescription>
              Visualize e gerencie os extratos importados
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : extratos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-30" />
                <p>Nenhum extrato importado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Banco</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extratos.map((ext) => (
                    <TableRow key={ext.id}>
                      <TableCell className="font-medium max-w-[150px] truncate">
                        {ext.nome_arquivo}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(ext.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{ext.banco || '-'}</TableCell>
                      <TableCell className="text-center font-medium">
                        {ext.stats.total}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {ext.stats.conciliados > 0 && (
                            <Badge variant="default" className="bg-green-500 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {ext.stats.conciliados}
                            </Badge>
                          )}
                          {ext.stats.pendentes > 0 && (
                            <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {ext.stats.pendentes}
                            </Badge>
                          )}
                          {ext.stats.ignorados > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <XCircle className="h-3 w-3 mr-1" />
                              {ext.stats.ignorados}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(ext.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(ext.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir importação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá excluir o extrato e todas as suas movimentações. 
              Lançamentos vinculados NÃO serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
