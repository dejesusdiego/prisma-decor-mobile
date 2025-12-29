import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Search, Link2, CheckCircle2, AlertCircle, Calendar, Plus } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

interface OrcamentoParaVincular {
  id: string;
  codigo: string;
  clienteNome: string;
  valorTotal: number;
  status: string;
  createdAt: string;
  temContaReceber: boolean;
  valorRecebido: number;
}

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
  const [lancamentoSelecionado, setLancamentoSelecionado] = useState<string>('');

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

  const vincularMutation = useMutation({
    mutationFn: async () => {
      if (!lancamentoSelecionado || !orcamentoId || !user || !orcamento) {
        throw new Error('Dados insuficientes');
      }

      const lancamento = lancamentosDisponiveis.find(l => l.id === lancamentoSelecionado);
      if (!lancamento) throw new Error('Lançamento não encontrado');

      const valorRecebido = lancamento.valor;
      const valorOrcamento = orcamento.total_com_desconto || orcamento.total_geral || 0;
      let contaReceberId: string;
      let parcelaId: string;

      // Se já existe conta, usar a existente
      if (contaExistente) {
        contaReceberId = contaExistente.id;
        
        // Buscar parcela pendente mais próxima
        const parcelasPendentes = (contaExistente.parcelas_receber || [])
          .filter((p: any) => p.status === 'pendente')
          .sort((a: any, b: any) => 
            new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()
          );
        
        if (parcelasPendentes.length > 0) {
          parcelaId = parcelasPendentes[0].id;
        } else {
          // Criar nova parcela
          const { data: novaParcela, error: erroNovaParcela } = await supabase
            .from('parcelas_receber')
            .insert({
              conta_receber_id: contaReceberId,
              numero_parcela: (contaExistente.parcelas_receber?.length || 0) + 1,
              valor: valorRecebido,
              data_vencimento: lancamento.data_lancamento,
              status: 'pendente'
            })
            .select('id')
            .single();
          
          if (erroNovaParcela) throw erroNovaParcela;
          parcelaId = novaParcela.id;
        }
      } else {
        // Criar conta a receber com parcela única
        const { data: novaConta, error: erroConta } = await supabase
          .from('contas_receber')
          .insert({
            orcamento_id: orcamentoId,
            cliente_nome: orcamento.cliente_nome,
            descricao: `Orçamento ${orcamento.codigo}`,
            valor_total: valorOrcamento,
            valor_pago: 0,
            numero_parcelas: 1,
            data_vencimento: lancamento.data_lancamento,
            status: 'pendente',
            observacoes: 'Conta criada ao vincular lançamento existente',
            created_by_user_id: user.id
          })
          .select('id')
          .single();

        if (erroConta) throw erroConta;
        contaReceberId = novaConta.id;

        // Criar parcela única com o valor do orçamento
        const { data: novaParcela, error: erroParcela } = await supabase
          .from('parcelas_receber')
          .insert({
            conta_receber_id: contaReceberId,
            numero_parcela: 1,
            valor: valorOrcamento,
            data_vencimento: lancamento.data_lancamento,
            status: 'pendente'
          })
          .select('id')
          .single();

        if (erroParcela) throw erroParcela;
        parcelaId = novaParcela.id;
      }

      // Vincular lançamento à parcela
      const { error: erroLancamento } = await supabase
        .from('lancamentos_financeiros')
        .update({
          parcela_receber_id: parcelaId
        })
        .eq('id', lancamentoSelecionado);

      if (erroLancamento) throw erroLancamento;

      // Atualizar parcela como paga
      const { error: erroParcela } = await supabase
        .from('parcelas_receber')
        .update({
          status: 'pago',
          data_pagamento: lancamento.data_lancamento
        })
        .eq('id', parcelaId);

      if (erroParcela) throw erroParcela;

      // Atualizar conta receber
      const { data: contaAtual } = await supabase
        .from('contas_receber')
        .select('valor_pago, valor_total')
        .eq('id', contaReceberId)
        .single();

      if (contaAtual) {
        const novoValorPago = (contaAtual.valor_pago || 0) + valorRecebido;
        const novoStatus = novoValorPago >= contaAtual.valor_total ? 'pago' : 'parcial';
        
        await supabase
          .from('contas_receber')
          .update({
            valor_pago: novoValorPago,
            status: novoStatus
          })
          .eq('id', contaReceberId);
      }

      return { contaReceberId, parcelaId };
    },
    onSuccess: () => {
      toast.success('Lançamento vinculado ao orçamento com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['lancamentos-nao-vinculados'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['relatorio-conciliacao'] });
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      setLancamentoSelecionado('');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error('Erro ao vincular: ' + error.message);
    }
  });

  const lancamentoInfo = lancamentosDisponiveis.find(l => l.id === lancamentoSelecionado);
  const valorOrcamento = orcamento ? (orcamento.total_com_desconto || orcamento.total_geral || 0) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Vincular Lançamento ao Orçamento
          </DialogTitle>
          <DialogDescription>
            Selecione um lançamento existente para vincular a este orçamento
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
              <RadioGroup 
                value={lancamentoSelecionado} 
                onValueChange={setLancamentoSelecionado}
                className="p-2 space-y-2"
              >
                {lancamentosFiltrados.map((lancamento) => (
                  <div 
                    key={lancamento.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      lancamentoSelecionado === lancamento.id 
                        ? "border-primary bg-primary/5" 
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setLancamentoSelecionado(lancamento.id)}
                  >
                    <RadioGroupItem value={lancamento.id} id={lancamento.id} />
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
                ))}
              </RadioGroup>
            )}
          </ScrollArea>

          {/* Info do Match */}
          {lancamentoInfo && (
            <div className="p-3 border rounded-lg bg-green-50/50 dark:bg-green-950/20">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Lançamento selecionado</span>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Valor do lançamento: <span className="font-medium text-foreground">{formatCurrency(lancamentoInfo.valor)}</span>
                {valorOrcamento > 0 && (
                  <span className="ml-2">
                    ({Math.round((lancamentoInfo.valor / valorOrcamento) * 100)}% do orçamento)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => vincularMutation.mutate()}
            disabled={!lancamentoSelecionado || vincularMutation.isPending}
          >
            {vincularMutation.isPending ? 'Vinculando...' : 'Vincular Lançamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
