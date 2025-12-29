import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Check, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { SugestoesConciliacao } from '@/components/financeiro/SugestoesConciliacao';
import { SugestoesPadroes } from '@/components/financeiro/SugestoesPadroes';
import { DialogConciliarComOrcamento } from './DialogConciliarComOrcamento';
import { usePadroesConciliacao } from '@/hooks/usePadroesConciliacao';
import { SugestaoOrcamento } from '@/hooks/useSugestoesConciliacao';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

interface MovimentacaoExtrato {
  id: string;
  data_movimentacao: string;
  descricao: string;
  valor: number;
  tipo: string | null;
}

interface DialogConciliarManualProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movimentacao: MovimentacaoExtrato | null;
}

export function DialogConciliarManual({ open, onOpenChange, movimentacao }: DialogConciliarManualProps) {
  const [busca, setBusca] = useState('');
  const [lancamentoSelecionado, setLancamentoSelecionado] = useState<string | null>(null);
  const [tabAtiva, setTabAtiva] = useState<'sugestoes' | 'todos'>('sugestoes');
  const queryClient = useQueryClient();
  const { salvarPadrao } = usePadroesConciliacao();
  
  // Dialog para vincular ao orçamento
  const [orcamentoDialogOpen, setOrcamentoDialogOpen] = useState(false);
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<SugestaoOrcamento | null>(null);

  const handleVincularOrcamento = (orcamento: SugestaoOrcamento) => {
    setOrcamentoSelecionado(orcamento);
    setOrcamentoDialogOpen(true);
  };

  // Buscar lançamentos não conciliados
  const { data: lancamentos = [], isLoading } = useQuery({
    queryKey: ['lancamentos-para-conciliar', movimentacao?.data_movimentacao],
    queryFn: async () => {
      if (!movimentacao) return [];
      
      // Buscar lançamentos em uma janela de 30 dias
      const dataBase = new Date(movimentacao.data_movimentacao);
      const dataInicio = new Date(dataBase);
      dataInicio.setDate(dataInicio.getDate() - 15);
      const dataFim = new Date(dataBase);
      dataFim.setDate(dataFim.getDate() + 15);
      
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .select(`
          id,
          data_lancamento,
          descricao,
          valor,
          tipo,
          categoria_id,
          categoria:categorias_financeiras(id, nome)
        `)
        .gte('data_lancamento', format(dataInicio, 'yyyy-MM-dd'))
        .lte('data_lancamento', format(dataFim, 'yyyy-MM-dd'))
        .order('data_lancamento', { ascending: false });
      
      if (error) throw error;
      
      // Filtrar lançamentos que já foram conciliados
      const { data: jaConciliados } = await supabase
        .from('movimentacoes_extrato')
        .select('lancamento_id')
        .not('lancamento_id', 'is', null);
      
      const idsJaConciliados = new Set((jaConciliados || []).map(m => m.lancamento_id));
      
      return (data || []).filter(l => !idsJaConciliados.has(l.id));
    },
    enabled: !!movimentacao
  });

  const conciliarMutation = useMutation({
    mutationFn: async (lancamentoId: string) => {
      if (!movimentacao) return;
      
      const { error } = await supabase
        .from('movimentacoes_extrato')
        .update({ 
          lancamento_id: lancamentoId,
          conciliado: true 
        })
        .eq('id', movimentacao.id);
      
      if (error) throw error;

      // Buscar dados do lançamento para salvar padrão
      const lancamento = lancamentos.find(l => l.id === lancamentoId);
      if (lancamento && movimentacao.descricao) {
        salvarPadrao({
          descricaoExtrato: movimentacao.descricao,
          tipoConciliacao: 'lancamento',
          categoriaId: lancamento.categoria_id || undefined,
          tipoLancamento: lancamento.tipo
        });
      }
    },
    onSuccess: () => {
      toast.success('Movimentação conciliada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-extrato'] });
      queryClient.invalidateQueries({ queryKey: ['extratos-bancarios'] });
      onOpenChange(false);
      setLancamentoSelecionado(null);
      setBusca('');
    },
    onError: (error: Error) => {
      toast.error('Erro ao conciliar: ' + error.message);
    }
  });

  const lancamentosFiltrados = lancamentos.filter(l => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return l.descricao.toLowerCase().includes(termo) ||
           l.valor.toString().includes(termo);
  });

  // Ordenar por compatibilidade com a movimentação
  const lancamentosOrdenados = [...lancamentosFiltrados].sort((a, b) => {
    if (!movimentacao) return 0;
    
    const diffA = Math.abs(Number(a.valor) - movimentacao.valor);
    const diffB = Math.abs(Number(b.valor) - movimentacao.valor);
    
    // Priorizar valores exatos ou próximos
    if (diffA < 1 && diffB >= 1) return -1;
    if (diffB < 1 && diffA >= 1) return 1;
    
    return diffA - diffB;
  });

  const handleConciliar = () => {
    if (!lancamentoSelecionado) {
      toast.error('Selecione um lançamento para conciliar');
      return;
    }
    conciliarMutation.mutate(lancamentoSelecionado);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Conciliar Movimentação</DialogTitle>
          <DialogDescription>
            Selecione o lançamento do sistema que corresponde a esta movimentação do extrato
          </DialogDescription>
        </DialogHeader>

        {movimentacao && (
          <div className="bg-muted/50 p-4 rounded-lg mb-4">
            <h4 className="font-medium mb-2">Movimentação do Extrato:</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Data:</span>
                <p className="font-medium">{format(new Date(movimentacao.data_movimentacao), "dd/MM/yyyy")}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Descrição:</span>
                <p className="font-medium">{movimentacao.descricao}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Valor:</span>
                <p className={`font-medium ${movimentacao.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}`}>
                  {movimentacao.tipo === 'credito' ? '+' : '-'} {formatCurrency(movimentacao.valor)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sugestões Inteligentes */}
        {movimentacao && (
          <div className="space-y-3 mb-4">
            <SugestoesConciliacao 
              movimentacao={movimentacao}
              onSelecionarRecebimento={(parcela) => {
                toast.info(`Parcela ${parcela.numeroParcela} de ${parcela.clienteNome} selecionada. Use a aba Contas a Receber para conciliar.`);
              }}
              onSelecionarPagamento={(conta) => {
                toast.info(`Conta "${conta.descricao}" selecionada. Use a aba Contas a Pagar para conciliar.`);
              }}
              onVincularOrcamento={handleVincularOrcamento}
            />
            <SugestoesPadroes 
              descricaoExtrato={movimentacao.descricao}
              tipoMovimento={movimentacao.tipo as 'credito' | 'debito'}
            />
          </div>
        )}

        <Tabs value={tabAtiva} onValueChange={(v) => setTabAtiva(v as 'sugestoes' | 'todos')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="sugestoes" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Mais Prováveis
            </TabsTrigger>
            <TabsTrigger value="todos">Todos os Lançamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="sugestoes">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição ou valor..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <ScrollArea className="h-[250px] border rounded-lg">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : lancamentosOrdenados.slice(0, 10).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <X className="h-8 w-8 mb-2 opacity-50" />
                  <p>Nenhum lançamento encontrado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lancamentosOrdenados.slice(0, 10).map((lanc) => {
                      const isSelected = lancamentoSelecionado === lanc.id;
                      const valorMatch = movimentacao && Math.abs(Number(lanc.valor) - movimentacao.valor) < 1;
                      
                      return (
                        <TableRow
                          key={lanc.id}
                          className={`cursor-pointer ${isSelected ? 'bg-primary/10' : ''}`}
                          onClick={() => setLancamentoSelecionado(lanc.id)}
                        >
                          <TableCell>
                            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center
                              ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}`}
                            >
                              {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                            </div>
                          </TableCell>
                          <TableCell>{format(new Date(lanc.data_lancamento), "dd/MM/yyyy")}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {lanc.descricao}
                              {valorMatch && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  Valor exato
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{lanc.categoria?.nome || '-'}</TableCell>
                          <TableCell className={`text-right font-medium ${lanc.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                            {lanc.tipo === 'entrada' ? '+' : '-'} {formatCurrency(Number(lanc.valor))}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="todos">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição ou valor..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <ScrollArea className="h-[250px] border rounded-lg">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : lancamentosOrdenados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <X className="h-8 w-8 mb-2 opacity-50" />
                  <p>Nenhum lançamento encontrado para conciliar</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lancamentosOrdenados.map((lanc) => {
                      const isSelected = lancamentoSelecionado === lanc.id;
                      const valorMatch = movimentacao && Math.abs(Number(lanc.valor) - movimentacao.valor) < 1;
                      
                      return (
                        <TableRow
                          key={lanc.id}
                          className={`cursor-pointer ${isSelected ? 'bg-primary/10' : ''}`}
                          onClick={() => setLancamentoSelecionado(lanc.id)}
                        >
                          <TableCell>
                            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center
                              ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}`}
                            >
                              {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                            </div>
                          </TableCell>
                          <TableCell>{format(new Date(lanc.data_lancamento), "dd/MM/yyyy")}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {lanc.descricao}
                              {valorMatch && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  Valor exato
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{lanc.categoria?.nome || '-'}</TableCell>
                          <TableCell className={`text-right font-medium ${lanc.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                            {lanc.tipo === 'entrada' ? '+' : '-'} {formatCurrency(Number(lanc.valor))}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConciliar} 
            disabled={!lancamentoSelecionado || conciliarMutation.isPending}
          >
            {conciliarMutation.isPending ? 'Conciliando...' : 'Conciliar'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Dialog para vincular ao orçamento */}
      <DialogConciliarComOrcamento
        open={orcamentoDialogOpen}
        onOpenChange={(open) => {
          setOrcamentoDialogOpen(open);
          if (!open) {
            onOpenChange(false);
          }
        }}
        movimentacao={movimentacao}
        orcamento={orcamentoSelecionado}
      />
    </Dialog>
  );
}
