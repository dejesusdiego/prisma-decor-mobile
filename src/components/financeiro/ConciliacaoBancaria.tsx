import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Link2,
  Link2Off,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { parseExtrato, autoMatch } from './utils/parserOFX';
import { DialogConciliarManual } from './dialogs/DialogConciliarManual';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

type StatusFilter = 'todos' | 'conciliados' | 'pendentes' | 'ignorados';

export function ConciliacaoBancaria() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extratoSelecionado, setExtratoSelecionado] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [dialogConciliarOpen, setDialogConciliarOpen] = useState(false);
  const [movimentacaoParaConciliar, setMovimentacaoParaConciliar] = useState<any>(null);

  // Buscar extratos importados
  const { data: extratos = [], isLoading: loadingExtratos } = useQuery({
    queryKey: ['extratos-bancarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('extratos_bancarios')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Buscar movimentações do extrato selecionado
  const { data: movimentacoes = [], isLoading: loadingMovimentacoes } = useQuery({
    queryKey: ['movimentacoes-extrato', extratoSelecionado],
    queryFn: async () => {
      if (!extratoSelecionado) return [];
      
      const { data, error } = await supabase
        .from('movimentacoes_extrato')
        .select(`
          *,
          lancamento:lancamentos_financeiros(id, descricao, valor, data_lancamento)
        `)
        .eq('extrato_id', extratoSelecionado)
        .order('data_movimentacao', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!extratoSelecionado
  });

  // Estatísticas
  const estatisticas = {
    total: movimentacoes.length,
    conciliados: movimentacoes.filter(m => m.conciliado).length,
    pendentes: movimentacoes.filter(m => !m.conciliado && !m.ignorado).length,
    ignorados: movimentacoes.filter(m => m.ignorado).length,
    valorTotal: movimentacoes.reduce((acc, m) => acc + (m.tipo === 'credito' ? Number(m.valor) : -Number(m.valor)), 0),
    valorConciliado: movimentacoes.filter(m => m.conciliado).reduce((acc, m) => acc + Number(m.valor), 0)
  };

  const percentualConciliado = estatisticas.total > 0 
    ? (estatisticas.conciliados / estatisticas.total) * 100 
    : 0;

  // Upload de arquivo
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const content = await file.text();
      const dados = parseExtrato(content, file.name);

      if (dados.movimentacoes.length === 0) {
        throw new Error('Nenhuma movimentação encontrada no arquivo');
      }

      // Criar extrato e inserir movimentações (com rollback se falhar)
      let extratoId: string | null = null;

      try {
        const { data: extrato, error: extratoError } = await supabase
          .from('extratos_bancarios')
          .insert({
            nome_arquivo: file.name,
            banco: dados.banco,
            conta: dados.conta,
            data_inicio: dados.data_inicio,
            data_fim: dados.data_fim,
            status: 'concluido',
            created_by_user_id: user?.id,
          })
          .select()
          .single();

        if (extratoError) throw extratoError;
        extratoId = extrato.id;

        // Inserir movimentações - filtrar inválidas (NaN/Infinity viram null no JSON)
        const movimentacoesInsert = dados.movimentacoes
          .map((m) => {
            const valor = Number(m.valor);
            if (!m.data_movimentacao) return null;
            if (!Number.isFinite(valor)) return null;

            return {
              extrato_id: extrato.id,
              data_movimentacao: m.data_movimentacao,
              descricao: m.descricao || 'Sem descrição',
              valor,
              tipo: m.tipo,
              numero_documento: m.numero_documento,
            };
          })
          .filter(Boolean);

        if (movimentacoesInsert.length === 0) {
          throw new Error('Nenhuma movimentação válida encontrada no arquivo');
        }

        const { error: movError } = await supabase
          .from('movimentacoes_extrato')
          .insert(movimentacoesInsert);

        if (movError) throw movError;

        return { extrato, count: movimentacoesInsert.length };
      } catch (err) {
        if (extratoId) {
          await supabase.from('extratos_bancarios').delete().eq('id', extratoId);
        }
        throw err;
      }
    },
    onSuccess: (data) => {
      toast.success(`Extrato importado com ${data.count} movimentações válidas`);
      queryClient.invalidateQueries({ queryKey: ['extratos-bancarios'] });
      setExtratoSelecionado(data.extrato.id);
    },
    onError: (error: Error) => {
      toast.error('Erro ao importar extrato: ' + error.message);
    },
  });

  // Auto-conciliar
  const autoConciliarMutation = useMutation({
    mutationFn: async () => {
      if (!extratoSelecionado) return;
      
      const movPendentes = movimentacoes.filter(m => !m.conciliado && !m.ignorado);
      
      // Buscar lançamentos no período
      const extrato = extratos.find(e => e.id === extratoSelecionado);
      if (!extrato) return;
      
      const { data: lancamentos } = await supabase
        .from('lancamentos_financeiros')
        .select('id, data_lancamento, descricao, valor')
        .gte('data_lancamento', extrato.data_inicio)
        .lte('data_lancamento', extrato.data_fim);
      
      if (!lancamentos || lancamentos.length === 0) return;
      
      // Buscar IDs já conciliados
      const { data: jaConciliados } = await supabase
        .from('movimentacoes_extrato')
        .select('lancamento_id')
        .not('lancamento_id', 'is', null);
      
      const idsJaConciliados = new Set((jaConciliados || []).map(m => m.lancamento_id));
      const lancamentosDisponiveis = lancamentos.filter(l => !idsJaConciliados.has(l.id));
      
      const movParaMatch = movPendentes.map(m => ({
        id: m.id,
        data: m.data_movimentacao,
        valor: Number(m.valor),
        descricao: m.descricao
      }));
      
      const lancParaMatch = lancamentosDisponiveis.map(l => ({
        id: l.id,
        data: l.data_lancamento,
        valor: Number(l.valor),
        descricao: l.descricao
      }));
      
      const matches = autoMatch(movParaMatch, lancParaMatch);
      
      // Aplicar matches
      for (const match of matches) {
        await supabase
          .from('movimentacoes_extrato')
          .update({ 
            lancamento_id: match.lancamentoId,
            conciliado: true 
          })
          .eq('id', match.movimentacaoId);
      }
      
      return matches.length;
    },
    onSuccess: (count) => {
      if (count && count > 0) {
        toast.success(`${count} movimentação(ões) conciliada(s) automaticamente`);
      } else {
        toast.info('Nenhuma correspondência automática encontrada');
      }
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-extrato'] });
    }
  });

  // Ignorar movimentação
  const ignorarMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('movimentacoes_extrato')
        .update({ ignorado: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Movimentação ignorada');
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-extrato'] });
    }
  });

  // Desfazer conciliação
  const desfazerConciliacaoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('movimentacoes_extrato')
        .update({ 
          lancamento_id: null,
          conciliado: false,
          ignorado: false 
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Conciliação desfeita');
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-extrato'] });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConciliarManual = (movimentacao: any) => {
    setMovimentacaoParaConciliar(movimentacao);
    setDialogConciliarOpen(true);
  };

  const movimentacoesFiltradas = movimentacoes.filter(m => {
    if (statusFilter === 'conciliados') return m.conciliado;
    if (statusFilter === 'pendentes') return !m.conciliado && !m.ignorado;
    if (statusFilter === 'ignorados') return m.ignorado;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Extrato Bancário
          </CardTitle>
          <CardDescription>
            Faça upload de arquivos OFX ou CSV para conciliar com os lançamentos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".ofx,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="w-full sm:w-auto"
            >
              <FileText className="h-4 w-4 mr-2" />
              {uploadMutation.isPending ? 'Processando...' : 'Selecionar Arquivo (OFX/CSV)'}
            </Button>
            
            {extratos.length > 0 && (
              <Select 
                value={extratoSelecionado || ''} 
                onValueChange={setExtratoSelecionado}
              >
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Selecione um extrato importado" />
                </SelectTrigger>
                <SelectContent>
                  {extratos.map(e => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome_arquivo} ({format(new Date(e.created_at), "dd/MM/yyyy", { locale: ptBR })})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {extratoSelecionado && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{estatisticas.total}</p>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Conciliados</p>
                    <p className="text-2xl font-bold text-green-600">{estatisticas.conciliados}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500/50" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                    <p className="text-2xl font-bold text-amber-600">{estatisticas.pendentes}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-amber-500/50" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ignorados</p>
                    <p className="text-2xl font-bold text-muted-foreground">{estatisticas.ignorados}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progresso */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso da Conciliação</span>
                  <span className="font-medium">{percentualConciliado.toFixed(0)}%</span>
                </div>
                <Progress value={percentualConciliado} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {estatisticas.conciliados} de {estatisticas.total} movimentações conciliadas
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Ações e Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => autoConciliarMutation.mutate()}
                disabled={autoConciliarMutation.isPending || estatisticas.pendentes === 0}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoConciliarMutation.isPending ? 'animate-spin' : ''}`} />
                Auto-Conciliar
              </Button>
            </div>
            
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="conciliados">Conciliados</SelectItem>
                <SelectItem value="pendentes">Pendentes</SelectItem>
                <SelectItem value="ignorados">Ignorados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela de Movimentações */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {loadingMovimentacoes ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : movimentacoesFiltradas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mb-4 opacity-30" />
                    <p>Nenhuma movimentação encontrada</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição Extrato</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Lançamento Vinculado</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movimentacoesFiltradas.map((mov) => (
                        <TableRow key={mov.id} className={mov.ignorado ? 'opacity-50' : ''}>
                          <TableCell>
                            {mov.conciliado ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Conciliado
                              </Badge>
                            ) : mov.ignorado ? (
                              <Badge variant="secondary">
                                <XCircle className="h-3 w-3 mr-1" />
                                Ignorado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-300">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Pendente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(mov.data_movimentacao), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {mov.descricao}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${mov.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}`}>
                            {mov.tipo === 'credito' ? '+' : '-'} {formatCurrency(Number(mov.valor))}
                          </TableCell>
                          <TableCell>
                            {mov.lancamento ? (
                              <div className="text-sm">
                                <p className="font-medium">{mov.lancamento.descricao}</p>
                                <p className="text-muted-foreground text-xs">
                                  {format(new Date(mov.lancamento.data_lancamento), "dd/MM/yyyy")} - {formatCurrency(Number(mov.lancamento.valor))}
                                </p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <TooltipProvider>
                                {!mov.conciliado && !mov.ignorado && (
                                  <>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          onClick={() => handleConciliarManual(mov)}
                                        >
                                          <Link2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Conciliar manualmente</TooltipContent>
                                    </Tooltip>
                                    
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          onClick={() => ignorarMutation.mutate(mov.id)}
                                        >
                                          <XCircle className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Ignorar</TooltipContent>
                                    </Tooltip>
                                  </>
                                )}
                                
                                {(mov.conciliado || mov.ignorado) && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => desfazerConciliacaoMutation.mutate(mov.id)}
                                      >
                                        <Link2Off className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Desfazer</TooltipContent>
                                  </Tooltip>
                                )}
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialog de Conciliação Manual */}
      <DialogConciliarManual
        open={dialogConciliarOpen}
        onOpenChange={setDialogConciliarOpen}
        movimentacao={movimentacaoParaConciliar}
      />
    </div>
  );
}
