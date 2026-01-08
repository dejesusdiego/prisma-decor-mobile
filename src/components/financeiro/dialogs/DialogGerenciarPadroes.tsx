import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { Brain, Trash2, ToggleLeft, ToggleRight, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PadraoConciliacao {
  id: string;
  padrao_descricao: string;
  tipo_conciliacao: string;
  tipo_lancamento: string | null;
  vezes_usado: number;
  confianca: number;
  ativo: boolean;
  ultima_utilizacao: string;
  categoria?: { id: string; nome: string; tipo: string } | null;
}

export function DialogGerenciarPadroes() {
  const { user } = useAuth();
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: padroes = [], isLoading } = useQuery({
    queryKey: ['padroes-conciliacao-gerenciar', organizationId],
    queryFn: async (): Promise<PadraoConciliacao[]> => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('padroes_conciliacao')
        .select(`
          id,
          padrao_descricao,
          tipo_conciliacao,
          tipo_lancamento,
          vezes_usado,
          confianca,
          ativo,
          ultima_utilizacao,
          categoria:categorias_financeiras(id, nome, tipo)
        `)
        .eq('organization_id', organizationId)
        .order('vezes_usado', { ascending: false });

      if (error) throw error;
      return (data || []) as PadraoConciliacao[];
    },
    enabled: open && !!user && !!organizationId
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      if (!organizationId) throw new Error('Organization ID required');
      const { error } = await supabase
        .from('padroes_conciliacao')
        .update({ ativo: !ativo })
        .eq('id', id)
        .eq('organization_id', organizationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['padroes-conciliacao'] });
      queryClient.invalidateQueries({ queryKey: ['padroes-conciliacao-gerenciar'] });
      toast.success('Padrão atualizado');
    }
  });

  const deletarMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!organizationId) throw new Error('Organization ID required');
      const { error } = await supabase
        .from('padroes_conciliacao')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['padroes-conciliacao'] });
      queryClient.invalidateQueries({ queryKey: ['padroes-conciliacao-gerenciar'] });
      toast.success('Padrão removido');
    }
  });

  const getTipoConciliacaoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'lancamento': 'Lançamento',
      'conta_pagar': 'Conta a Pagar',
      'parcela_receber': 'Recebimento',
      'categoria': 'Categoria'
    };
    return labels[tipo] || tipo;
  };

  const getConfiancaColor = (confianca: number) => {
    if (confianca >= 80) return 'text-green-600';
    if (confianca >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const padroesAtivos = padroes.filter(p => p.ativo).length;
  const totalUsos = padroes.reduce((acc, p) => acc + p.vezes_usado, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Brain className="h-4 w-4 mr-2" />
          Padrões Aprendidos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Padrões Aprendidos pelo Sistema
          </DialogTitle>
          <DialogDescription>
            O sistema aprende padrões de conciliação com base no seu histórico. 
            Gerencie os padrões para melhorar as sugestões automáticas.
          </DialogDescription>
        </DialogHeader>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{padroes.length}</p>
            <p className="text-xs text-muted-foreground">Padrões Totais</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{padroesAtivos}</p>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{totalUsos}</p>
            <p className="text-xs text-muted-foreground">Utilizações</p>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : padroes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Sparkles className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-sm">Nenhum padrão aprendido ainda</p>
              <p className="text-xs mt-1">Concilie movimentações para o sistema aprender</p>
            </div>
          ) : (
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Padrão</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-center">Usos</TableHead>
                    <TableHead className="text-center">Confiança</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {padroes.map((padrao) => (
                    <TableRow key={padrao.id} className={!padrao.ativo ? 'opacity-50' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{padrao.padrao_descricao}</p>
                          <p className="text-xs text-muted-foreground">
                            Última utilização: {format(new Date(padrao.ultima_utilizacao), "dd/MM/yy", { locale: ptBR })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getTipoConciliacaoLabel(padrao.tipo_conciliacao)}
                        </Badge>
                        {padrao.tipo_lancamento && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {padrao.tipo_lancamento === 'entrada' ? 'Entrada' : 'Saída'}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {padrao.categoria ? (
                          <span className="text-sm">{padrao.categoria.nome}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <TrendingUp className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{padrao.vezes_usado}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`font-medium text-sm ${getConfiancaColor(padrao.confianca)}`}>
                            {padrao.confianca}%
                          </span>
                          <Progress value={padrao.confianca} className="h-1 w-12" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleAtivoMutation.mutate({ id: padrao.id, ativo: padrao.ativo })}
                              disabled={toggleAtivoMutation.isPending}
                            >
                              {padrao.ativo ? (
                                <ToggleRight className="h-5 w-5 text-green-600" />
                              ) : (
                                <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {padrao.ativo ? 'Desativar padrão' : 'Ativar padrão'}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => deletarMutation.mutate(padrao.id)}
                              disabled={deletarMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Remover padrão permanentemente</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TooltipProvider>
          )}
        </ScrollArea>

        <div className="text-xs text-muted-foreground mt-2 bg-muted/30 rounded-lg p-3">
          <p className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            <strong>Dica:</strong> Padrões com alta confiança (80%+) são usados para sugestões automáticas.
            Desative padrões que geram sugestões incorretas.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
