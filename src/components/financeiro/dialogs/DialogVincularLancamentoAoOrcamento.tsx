import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Search, Link2, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

interface DialogVincularLancamentoAoOrcamentoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamentoId?: string | null;
}

export function DialogVincularLancamentoAoOrcamento({
  open,
  onOpenChange,
  orcamentoId
}: DialogVincularLancamentoAoOrcamentoProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState('');
  const [lancamentosSelecionados, setLancamentosSelecionados] = useState<string[]>([]);

  // Buscar orçamento específico se fornecido
  const { data: orcamento } = useQuery({
    queryKey: ['orcamento-para-vincular', orcamentoId],
    queryFn: async () => {
      if (!orcamentoId) return null;
      const { data, error } = await supabase
        .from('orcamentos')
        .select('id, codigo, cliente_nome, total_com_desconto, total_geral, status, created_at')
        .eq('id', orcamentoId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orcamentoId
  });

  // Buscar lançamentos de entrada não vinculados
  const { data: lancamentosDisponiveis = [], isLoading: loadingLancamentos } = useQuery({
    queryKey: ['lancamentos-nao-vinculados-para-orcamento', orcamentoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .select(`
          id, descricao, valor, data_lancamento, tipo,
          parcela_receber_id
        `)
        .eq('tipo', 'entrada')
        .is('parcela_receber_id', null)
        .order('data_lancamento', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: open
  });

  // Verificar se já existe conta a receber para este orçamento
  const { data: contaExistente } = useQuery({
    queryKey: ['conta-receber-para-vincular', orcamentoId],
    queryFn: async () => {
      if (!orcamentoId) return null;
      const { data } = await supabase
        .from('contas_receber')
        .select(`
          id, valor_total, valor_pago, status, numero_parcelas,
          parcelas_receber(id, numero_parcela, valor, data_vencimento, status)
        `)
        .eq('orcamento_id', orcamentoId)
        .maybeSingle();
      return data;
    },
    enabled: !!orcamentoId
  });

  // Filtrar lançamentos pela busca
  const lancamentosFiltrados = useMemo(() => {
    if (!busca.trim()) return lancamentosDisponiveis;
    const termoBusca = busca.toLowerCase();
    return lancamentosDisponiveis.filter(l => 
      l.descricao.toLowerCase().includes(termoBusca) ||
      formatCurrency(l.valor).includes(termoBusca)
    );
  }, [lancamentosDisponiveis, busca]);

  // Calcular total selecionado
  const totalSelecionado = useMemo(() => {
    return lancamentosSelecionados.reduce((acc, id) => {
      const lancamento = lancamentosDisponiveis.find(l => l.id === id);
      return acc + (lancamento?.valor || 0);
    }, 0);
  }, [lancamentosSelecionados, lancamentosDisponiveis]);

  const toggleLancamento = (id: string) => {
    setLancamentosSelecionados(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const vincularMutation = useMutation({
    mutationFn: async () => {
      if (lancamentosSelecionados.length === 0 || !orcamentoId || !user || !orcamento) {
        throw new Error('Dados insuficientes');
      }

      const lancamentosParaVincular = lancamentosDisponiveis.filter(l => 
        lancamentosSelecionados.includes(l.id)
      );
      
      const valorOrcamento = orcamento.total_com_desconto || orcamento.total_geral || 0;
      let contaReceberId: string;

      // Se já existe conta, usar a existente
      if (contaExistente) {
        contaReceberId = contaExistente.id;
      } else {
        // Criar conta a receber
        const { data: novaConta, error: erroConta } = await supabase
          .from('contas_receber')
          .insert({
            orcamento_id: orcamentoId,
            cliente_nome: orcamento.cliente_nome,
            descricao: `Orçamento ${orcamento.codigo}`,
            valor_total: valorOrcamento,
            valor_pago: 0,
            numero_parcelas: lancamentosParaVincular.length,
            data_vencimento: lancamentosParaVincular[0].data_lancamento,
            status: 'pendente',
            observacoes: 'Conta criada ao vincular lançamentos existentes',
            created_by_user_id: user.id
          })
          .select('id')
          .single();

        if (erroConta) throw erroConta;
        contaReceberId = novaConta.id;
      }

      // Processar cada lançamento selecionado
      let valorTotalVinculado = 0;
      const parcelasExistentes = contaExistente?.parcelas_receber || [];
      let proximoNumeroParcela = parcelasExistentes.length + 1;

      for (const lancamento of lancamentosParaVincular) {
        // Criar parcela para este lançamento
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

        // Vincular lançamento à parcela
        const { error: erroLancamento } = await supabase
          .from('lancamentos_financeiros')
          .update({
            parcela_receber_id: novaParcela.id
          })
          .eq('id', lancamento.id);

        if (erroLancamento) throw erroLancamento;

        valorTotalVinculado += lancamento.valor;
      }

      // Atualizar conta receber com o valor total vinculado
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

      return { contaReceberId, quantidadeVinculada: lancamentosParaVincular.length };
    },
    onSuccess: (result) => {
      toast.success(`${result.quantidadeVinculada} lançamento(s) vinculado(s) ao orçamento!`);
      queryClient.invalidateQueries({ queryKey: ['lancamentos-nao-vinculados'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['relatorio-conciliacao'] });
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      queryClient.invalidateQueries({ queryKey: ['orcamento-financeiro'] });
      setLancamentosSelecionados([]);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error('Erro ao vincular: ' + error.message);
    }
  });

  const valorOrcamento = orcamento ? (orcamento.total_com_desconto || orcamento.total_geral || 0) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Vincular Lançamentos ao Orçamento
          </DialogTitle>
          <DialogDescription>
            Selecione um ou mais lançamentos existentes para vincular a este orçamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info do Orçamento */}
          {orcamento && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline">{orcamento.codigo}</Badge>
                  <span className="text-sm font-medium">{orcamento.cliente_nome}</span>
                </div>
                <span className="font-semibold">{formatCurrency(valorOrcamento)}</span>
              </div>
              {contaExistente && (
                <div className="text-xs text-muted-foreground">
                  Já recebido: {formatCurrency(contaExistente.valor_pago)} de {formatCurrency(contaExistente.valor_total)}
                </div>
              )}
            </div>
          )}

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar lançamento por descrição ou valor..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Lista de Lançamentos */}
          <ScrollArea className="h-[250px] border rounded-lg">
            {loadingLancamentos ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : lancamentosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="text-sm">Nenhum lançamento de entrada disponível</p>
                <p className="text-xs">Apenas lançamentos não vinculados aparecem aqui</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {lancamentosFiltrados.map((lancamento) => {
                  const isSelected = lancamentosSelecionados.includes(lancamento.id);
                  return (
                    <div 
                      key={lancamento.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => toggleLancamento(lancamento.id)}
                    >
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => toggleLancamento(lancamento.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lancamento.descricao}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(lancamento.data_lancamento), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-green-600">
                          {formatCurrency(lancamento.valor)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Resumo da seleção */}
          {lancamentosSelecionados.length > 0 && (
            <div className="p-3 border rounded-lg bg-green-50/50 dark:bg-green-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {lancamentosSelecionados.length} lançamento(s) selecionado(s)
                  </span>
                </div>
                <span className="font-semibold text-green-600">
                  {formatCurrency(totalSelecionado)}
                </span>
              </div>
              {valorOrcamento > 0 && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {Math.round((totalSelecionado / valorOrcamento) * 100)}% do valor do orçamento
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => vincularMutation.mutate()}
            disabled={lancamentosSelecionados.length === 0 || vincularMutation.isPending}
          >
            {vincularMutation.isPending ? 'Vinculando...' : `Vincular ${lancamentosSelecionados.length} Lançamento(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
