import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileQuestion, 
  Search, 
  Calendar, 
  TrendingUp, 
  Link2,
  CheckCircle2,
  AlertCircle,
  Filter,
  Wand2,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

interface LancamentoOrfao {
  id: string;
  descricao: string;
  valor: number;
  data_lancamento: string;
  tipo: string;
  categoria?: { nome: string } | null;
}

interface OrcamentoParaVincular {
  id: string;
  codigo: string;
  cliente_nome: string;
  total_com_desconto: number | null;
  total_geral: number | null;
  status: string;
  created_at: string;
}

import { 
  calcularScoreCombinado, 
  ScoreConciliacao 
} from '@/lib/conciliacaoInteligente';

interface SugestaoAutomatica {
  lancamento: LancamentoOrfao;
  orcamento: OrcamentoParaVincular;
  score: ScoreConciliacao;
}

interface TabOrfaosProps {
  dataInicio?: string;
}

export function TabOrfaos({ dataInicio }: TabOrfaosProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'saida'>('entrada');
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [dialogOrcamentoOpen, setDialogOrcamentoOpen] = useState(false);
  const [buscaOrcamento, setBuscaOrcamento] = useState('');
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<string | null>(null);
  const [dialogAutoOpen, setDialogAutoOpen] = useState(false);
  const [sugestoesAuto, setSugestoesAuto] = useState<SugestaoAutomatica[]>([]);
  const [processandoAuto, setProcessandoAuto] = useState(false);

  const { data: lancamentosOrfaos = [], isLoading } = useQuery({
    queryKey: ['lancamentos-orfaos', filtroTipo, dataInicio],
    queryFn: async () => {
      let query = supabase
        .from('lancamentos_financeiros')
        .select(`
          id, descricao, valor, data_lancamento, tipo,
          categoria:categorias_financeiras(nome)
        `)
        .is('parcela_receber_id', null)
        .is('conta_pagar_id', null)
        .order('data_lancamento', { ascending: false });

      if (filtroTipo !== 'todos') {
        query = query.eq('tipo', filtroTipo);
      }

      if (dataInicio) {
        query = query.gte('data_lancamento', dataInicio);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as LancamentoOrfao[];
    }
  });

  const { data: orcamentos = [] } = useQuery({
    queryKey: ['orcamentos-para-vincular-auto'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('id, codigo, cliente_nome, total_com_desconto, total_geral, status, created_at')
        .in('status', ['enviado', 'sem_resposta', 'pago_40', 'pago_parcial', 'pago_60', 'pago'])
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return (data || []) as OrcamentoParaVincular[];
    }
  });

  const lancamentosFiltrados = useMemo(() => {
    if (!busca.trim()) return lancamentosOrfaos;
    const termo = busca.toLowerCase();
    return lancamentosOrfaos.filter(l => 
      l.descricao.toLowerCase().includes(termo) ||
      formatCurrency(l.valor).includes(termo)
    );
  }, [lancamentosOrfaos, busca]);

  const orcamentosFiltrados = useMemo(() => {
    if (!buscaOrcamento.trim()) return orcamentos;
    const termo = buscaOrcamento.toLowerCase();
    return orcamentos.filter(o => 
      o.codigo.toLowerCase().includes(termo) ||
      o.cliente_nome.toLowerCase().includes(termo)
    );
  }, [orcamentos, buscaOrcamento]);

  const executarAutoConciliacao = () => {
    const sugestoes: SugestaoAutomatica[] = [];
    
    for (const lancamento of lancamentosOrfaos) {
      let melhorMatch: { orcamento: OrcamentoParaVincular; score: ScoreConciliacao } | null = null;
      
      for (const orcamento of orcamentos) {
        const valorOrcamento = orcamento.total_com_desconto || orcamento.total_geral || 0;
        
        const score = calcularScoreCombinado(
          lancamento.descricao,
          orcamento.cliente_nome,
          lancamento.valor,
          valorOrcamento,
          lancamento.data_lancamento,
          orcamento.created_at
        );
        
        // Aceitar matches com score >= 40 (mínimo para sugestão)
        if (score.scoreTotal >= 40) {
          if (!melhorMatch || score.scoreTotal > melhorMatch.score.scoreTotal) {
            melhorMatch = { orcamento, score };
          }
        }
      }
      
      if (melhorMatch) {
        sugestoes.push({
          lancamento,
          orcamento: melhorMatch.orcamento,
          score: melhorMatch.score
        });
      }
    }
    
    // Ordenar por score total (maior primeiro)
    sugestoes.sort((a, b) => b.score.scoreTotal - a.score.scoreTotal);
    
    setSugestoesAuto(sugestoes);
    setDialogAutoOpen(true);
  };

  const totais = useMemo(() => {
    const selecionadosData = lancamentosOrfaos.filter(l => selecionados.includes(l.id));
    return {
      quantidade: selecionados.length,
      valor: selecionadosData.reduce((acc, l) => acc + l.valor, 0),
      totalOrfaos: lancamentosOrfaos.length,
      valorTotalOrfaos: lancamentosOrfaos.reduce((acc, l) => acc + l.valor, 0)
    };
  }, [selecionados, lancamentosOrfaos]);

  const toggleSelecionado = (id: string) => {
    setSelecionados(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selecionarTodos = () => {
    if (selecionados.length === lancamentosFiltrados.length) {
      setSelecionados([]);
    } else {
      setSelecionados(lancamentosFiltrados.map(l => l.id));
    }
  };

  const vincularMutation = useMutation({
    mutationFn: async () => {
      if (!orcamentoSelecionado || selecionados.length === 0 || !user) {
        throw new Error('Dados insuficientes');
      }

      const orcamento = orcamentos.find(o => o.id === orcamentoSelecionado);
      if (!orcamento) throw new Error('Orçamento não encontrado');

      const lancamentosParaVincular = lancamentosOrfaos.filter(l => selecionados.includes(l.id));
      const valorOrcamento = orcamento.total_com_desconto || orcamento.total_geral || 0;

      const { data: contaExistente } = await supabase
        .from('contas_receber')
        .select('id, valor_pago, valor_total, numero_parcelas')
        .eq('orcamento_id', orcamentoSelecionado)
        .maybeSingle();

      let contaReceberId: string;
      let proximoNumeroParcela: number;

      if (contaExistente) {
        contaReceberId = contaExistente.id;
        proximoNumeroParcela = contaExistente.numero_parcelas + 1;
      } else {
        const { data: novaConta, error: erroConta } = await supabase
          .from('contas_receber')
          .insert({
            orcamento_id: orcamentoSelecionado,
            cliente_nome: orcamento.cliente_nome,
            descricao: `Orçamento ${orcamento.codigo}`,
            valor_total: valorOrcamento,
            valor_pago: 0,
            numero_parcelas: lancamentosParaVincular.length,
            data_vencimento: lancamentosParaVincular[0].data_lancamento,
            status: 'pendente',
            observacoes: 'Conta criada via vinculação em massa',
            created_by_user_id: user.id
          })
          .select('id')
          .single();

        if (erroConta) throw erroConta;
        contaReceberId = novaConta.id;
        proximoNumeroParcela = 1;
      }

      let valorTotalVinculado = 0;

      for (const lancamento of lancamentosParaVincular) {
        const { data: novaParcela, error: erroParcela } = await supabase
          .from('parcelas_receber')
          .insert({
            conta_receber_id: contaReceberId,
            numero_parcela: proximoNumeroParcela++,
            valor: lancamento.valor,
            data_vencimento: lancamento.data_lancamento,
            data_pagamento: lancamento.data_lancamento,
            status: 'pago'
          })
          .select('id')
          .single();

        if (erroParcela) throw erroParcela;

        await supabase
          .from('lancamentos_financeiros')
          .update({ parcela_receber_id: novaParcela.id })
          .eq('id', lancamento.id);

        valorTotalVinculado += lancamento.valor;
      }

      const valorPagoAtual = contaExistente?.valor_pago || 0;
      const novoValorPago = valorPagoAtual + valorTotalVinculado;
      const valorTotalConta = contaExistente?.valor_total || valorOrcamento;
      const novoStatus = novoValorPago >= valorTotalConta ? 'pago' : 'parcial';

      await supabase
        .from('contas_receber')
        .update({
          valor_pago: novoValorPago,
          status: novoStatus,
          numero_parcelas: proximoNumeroParcela - 1
        })
        .eq('id', contaReceberId);

      return { quantidade: lancamentosParaVincular.length };
    },
    onSuccess: (result) => {
      toast.success(`${result.quantidade} lançamento(s) vinculado(s) com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['lancamentos-orfaos'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      queryClient.invalidateQueries({ queryKey: ['relatorio-conciliacao'] });
      setSelecionados([]);
      setOrcamentoSelecionado(null);
      setDialogOrcamentoOpen(false);
    },
    onError: (error: Error) => {
      toast.error('Erro: ' + error.message);
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Órfãos</span>
            </div>
            <p className="text-2xl font-bold">{totais.totalOrfaos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Valor Total</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totais.valorTotalOrfaos)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Selecionados</span>
            </div>
            <p className="text-2xl font-bold">{totais.quantidade}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Valor Selecionado</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totais.valor)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e ações */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileQuestion className="h-5 w-5" />
              Lançamentos Órfãos
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={executarAutoConciliacao}
                disabled={lancamentosOrfaos.length === 0 || orcamentos.length === 0}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Auto-Conciliar
              </Button>
              {selecionados.length > 0 && (
                <Button onClick={() => setDialogOrcamentoOpen(true)}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Vincular {selecionados.length}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar lançamento..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filtroTipo} onValueChange={(v: any) => setFiltroTipo(v)}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="entrada">Entradas</SelectItem>
                <SelectItem value="saida">Saídas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selecionados.length === lancamentosFiltrados.length && lancamentosFiltrados.length > 0}
                      onCheckedChange={selecionarTodos}
                    />
                  </TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lancamentosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>Nenhum lançamento órfão encontrado!</p>
                      <p className="text-xs">Todos os lançamentos estão vinculados.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  lancamentosFiltrados.map((lancamento) => (
                    <TableRow 
                      key={lancamento.id}
                      className={cn(
                        "cursor-pointer",
                        selecionados.includes(lancamento.id) && "bg-primary/5"
                      )}
                      onClick={() => toggleSelecionado(lancamento.id)}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selecionados.includes(lancamento.id)}
                          onCheckedChange={() => toggleSelecionado(lancamento.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(lancamento.data_lancamento), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {lancamento.descricao}
                      </TableCell>
                      <TableCell>
                        {lancamento.categoria?.nome || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-medium",
                          lancamento.tipo === 'entrada' ? "text-green-600" : "text-red-600"
                        )}>
                          {lancamento.tipo === 'entrada' ? '+' : '-'} {formatCurrency(lancamento.valor)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Dialog para selecionar orçamento */}
      <Dialog open={dialogOrcamentoOpen} onOpenChange={setDialogOrcamentoOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Selecionar Orçamento
            </DialogTitle>
            <DialogDescription>
              Escolha o orçamento para vincular os {selecionados.length} lançamento(s) selecionado(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar orçamento..."
                value={buscaOrcamento}
                onChange={(e) => setBuscaOrcamento(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[250px] border rounded-lg">
              <div className="p-2 space-y-2">
                {orcamentosFiltrados.map((orc) => {
                  const valor = orc.total_com_desconto || orc.total_geral || 0;
                  return (
                    <div
                      key={orc.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                        orcamentoSelecionado === orc.id 
                          ? "border-primary bg-primary/5" 
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => setOrcamentoSelecionado(orc.id)}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{orc.codigo}</Badge>
                          <span className="text-sm font-medium">{orc.cliente_nome}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(orc.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                      <span className="font-semibold">{formatCurrency(valor)}</span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOrcamentoOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => vincularMutation.mutate()}
              disabled={!orcamentoSelecionado || vincularMutation.isPending}
            >
              {vincularMutation.isPending ? 'Vinculando...' : 'Vincular Lançamentos'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Auto-Conciliação */}
      <Dialog open={dialogAutoOpen} onOpenChange={setDialogAutoOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Conciliação Automática por Nome
            </DialogTitle>
            <DialogDescription>
              {sugestoesAuto.length > 0 
                ? `Encontramos ${sugestoesAuto.length} correspondência(s) baseadas na similaridade dos nomes`
                : 'Nenhuma correspondência encontrada'
              }
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-3">
              {sugestoesAuto.map((sugestao, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge 
                          variant={sugestao.score.confianca === 'alta' ? "default" : "secondary"}
                          className={cn(
                            sugestao.score.confianca === 'alta' && "bg-green-500",
                            sugestao.score.confianca === 'media' && "bg-amber-500"
                          )}
                        >
                          {sugestao.score.scoreTotal}% match
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Nome: {sugestao.score.scoreNome}%
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Valor: {sugestao.score.scoreValor}%
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(sugestao.lancamento.data_lancamento), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate mb-1">
                        <span className="text-muted-foreground">Lançamento:</span> {sugestao.lancamento.descricao}
                      </p>
                      <p className="text-sm truncate">
                        <span className="text-muted-foreground">Orçamento:</span>{' '}
                        <Badge variant="outline" className="mr-1">{sugestao.orcamento.codigo}</Badge>
                        {sugestao.orcamento.cliente_nome}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(sugestao.lancamento.valor)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Orç: {formatCurrency(sugestao.orcamento.total_com_desconto || sugestao.orcamento.total_geral || 0)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}

              {sugestoesAuto.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma correspondência encontrada.</p>
                  <p className="text-sm">Verifique se os nomes dos clientes nos lançamentos correspondem aos orçamentos.</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="border-t pt-4 mt-4">
            <Button variant="outline" onClick={() => setDialogAutoOpen(false)}>
              Cancelar
            </Button>
            {sugestoesAuto.length > 0 && (
              <Button 
                onClick={async () => {
                  setProcessandoAuto(true);
                  let vinculados = 0;
                  
                  try {
                    for (const sugestao of sugestoesAuto) {
                      const orcamento = sugestao.orcamento;
                      const lancamento = sugestao.lancamento;
                      const valorOrcamento = orcamento.total_com_desconto || orcamento.total_geral || 0;

                      const { data: contaExistente } = await supabase
                        .from('contas_receber')
                        .select('id, valor_pago, valor_total, numero_parcelas')
                        .eq('orcamento_id', orcamento.id)
                        .maybeSingle();

                      let contaReceberId: string;
                      let proximoNumeroParcela: number;

                      if (contaExistente) {
                        contaReceberId = contaExistente.id;
                        proximoNumeroParcela = contaExistente.numero_parcelas + 1;
                      } else {
                        const { data: novaConta, error: erroConta } = await supabase
                          .from('contas_receber')
                          .insert({
                            orcamento_id: orcamento.id,
                            cliente_nome: orcamento.cliente_nome,
                            descricao: `Orçamento ${orcamento.codigo}`,
                            valor_total: valorOrcamento,
                            valor_pago: 0,
                            numero_parcelas: 1,
                            data_vencimento: lancamento.data_lancamento,
                            status: 'pendente',
                            observacoes: 'Conta criada via auto-conciliação',
                            created_by_user_id: user!.id
                          })
                          .select('id')
                          .single();

                        if (erroConta) continue;
                        contaReceberId = novaConta.id;
                        proximoNumeroParcela = 1;
                      }

                      const { data: novaParcela, error: erroParcela } = await supabase
                        .from('parcelas_receber')
                        .insert({
                          conta_receber_id: contaReceberId,
                          numero_parcela: proximoNumeroParcela,
                          valor: lancamento.valor,
                          data_vencimento: lancamento.data_lancamento,
                          data_pagamento: lancamento.data_lancamento,
                          status: 'pago'
                        })
                        .select('id')
                        .single();

                      if (erroParcela) continue;

                      await supabase
                        .from('lancamentos_financeiros')
                        .update({ parcela_receber_id: novaParcela.id })
                        .eq('id', lancamento.id);

                      const valorPagoAtual = contaExistente?.valor_pago || 0;
                      const novoValorPago = valorPagoAtual + lancamento.valor;
                      const valorTotalConta = contaExistente?.valor_total || valorOrcamento;
                      const novoStatus = novoValorPago >= valorTotalConta ? 'pago' : 'parcial';

                      await supabase
                        .from('contas_receber')
                        .update({
                          valor_pago: novoValorPago,
                          status: novoStatus,
                          numero_parcelas: proximoNumeroParcela
                        })
                        .eq('id', contaReceberId);

                      vinculados++;
                    }

                    toast.success(`${vinculados} lançamento(s) vinculado(s) automaticamente!`);
                    queryClient.invalidateQueries({ queryKey: ['lancamentos-orfaos'] });
                    queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
                    queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
                    queryClient.invalidateQueries({ queryKey: ['relatorio-conciliacao'] });
                    setDialogAutoOpen(false);
                    setSugestoesAuto([]);
                  } catch (error: any) {
                    toast.error('Erro ao processar: ' + error.message);
                  } finally {
                    setProcessandoAuto(false);
                  }
                }}
                disabled={processandoAuto}
              >
                {processandoAuto ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Vincular Todos ({sugestoesAuto.length})
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
