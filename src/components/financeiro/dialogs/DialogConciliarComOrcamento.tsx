import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateOnly, formatDateOnly } from '@/lib/dateOnly';
import { FileText, ArrowRight, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

interface MovimentacaoExtrato {
  id: string;
  descricao: string;
  valor: number;
  tipo: string | null;
  data_movimentacao: string;
}

interface OrcamentoSugestao {
  orcamentoId: string;
  codigo: string;
  clienteNome: string;
  valorTotal: number;
  similaridade: number;
}

interface DialogConciliarComOrcamentoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movimentacao: MovimentacaoExtrato | null;
  orcamento: OrcamentoSugestao | null;
}

export function DialogConciliarComOrcamento({
  open,
  onOpenChange,
  movimentacao,
  orcamento
}: DialogConciliarComOrcamentoProps) {
  const { user } = useAuth();
  const { organizationId } = useOrganizationContext();
  const queryClient = useQueryClient();
  const [numeroParcelas, setNumeroParcelas] = useState('1');
  const [dataPrimeiraParcela, setDataPrimeiraParcela] = useState<Date>(new Date());
  const [formaPagamentoId, setFormaPagamentoId] = useState<string>('');
  const [observacoes, setObservacoes] = useState('');

  // Buscar formas de pagamento
  const { data: formasPagamento = [] } = useQuery({
    queryKey: ['formas-pagamento-ativas', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formas_pagamento')
        .select('*')
        .eq('ativo', true)
        .eq('organization_id', organizationId)
        .order('nome');
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId
  });

  // Verificar se já existe conta a receber para este orçamento
  const { data: contaExistente } = useQuery({
    queryKey: ['conta-receber-orcamento', orcamento?.orcamentoId],
    queryFn: async () => {
      if (!orcamento?.orcamentoId) return null;
      const { data } = await supabase
        .from('contas_receber')
        .select(`
          id, valor_total, valor_pago, status, numero_parcelas,
          parcelas_receber(id, numero_parcela, valor, data_vencimento, status)
        `)
        .eq('orcamento_id', orcamento.orcamentoId)
        .single();
      return data;
    },
    enabled: !!orcamento?.orcamentoId
  });

  const registrarMutation = useMutation({
    mutationFn: async () => {
      if (!movimentacao || !orcamento || !user) {
        throw new Error('Dados insuficientes');
      }

      const valorRecebido = Math.abs(movimentacao.valor);
      let contaReceberId: string;
      let parcelaId: string;

      // Se já existe conta, usar a existente
      if (contaExistente) {
        contaReceberId = contaExistente.id;
        
        // Buscar parcela pendente mais próxima
        const parcelasPendentes = (contaExistente.parcelas_receber || [])
          .filter((p: any) => p.status === 'pendente')
          .sort((a: any, b: any) => 
            (parseDateOnly(a.data_vencimento)?.getTime() || 0) - (parseDateOnly(b.data_vencimento)?.getTime() || 0)
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
              data_vencimento: movimentacao.data_movimentacao,
              status: 'pendente'
            })
            .select('id')
            .single();
          
          if (erroNovaParcela) throw erroNovaParcela;
          parcelaId = novaParcela.id;
        }
      } else {
        // Criar conta a receber com parcelas
        const valorTotal = orcamento.valorTotal;
        const numParcelas = parseInt(numeroParcelas);
        const valorParcela = valorTotal / numParcelas;

        // Criar conta a receber
        const { data: novaConta, error: erroConta } = await supabase
          .from('contas_receber')
          .insert({
            orcamento_id: orcamento.orcamentoId,
            cliente_nome: orcamento.clienteNome,
            descricao: `Orçamento ${orcamento.codigo}`,
            valor_total: valorTotal,
            valor_pago: 0,
            numero_parcelas: numParcelas,
            data_vencimento: dataPrimeiraParcela.toISOString().split('T')[0],
            status: 'pendente',
            observacoes: observacoes || 'Conta criada via conciliação bancária',
            created_by_user_id: user.id,
            organization_id: organizationId
          })
          .select('id')
          .single();

        if (erroConta) throw erroConta;
        contaReceberId = novaConta.id;

        // Criar parcelas
        const parcelas = [];
        for (let i = 0; i < numParcelas; i++) {
          const dataVenc = new Date(dataPrimeiraParcela);
          dataVenc.setMonth(dataVenc.getMonth() + i);
          
          parcelas.push({
            conta_receber_id: contaReceberId,
            numero_parcela: i + 1,
            valor: valorParcela,
            data_vencimento: dataVenc.toISOString().split('T')[0],
            status: 'pendente'
          });
        }

        const { data: parcelasCriadas, error: erroParcelas } = await supabase
          .from('parcelas_receber')
          .insert(parcelas)
          .select('id');

        if (erroParcelas) throw erroParcelas;
        parcelaId = parcelasCriadas[0].id;
      }

      // Criar lançamento financeiro
      const { data: lancamento, error: erroLancamento } = await supabase
        .from('lancamentos_financeiros')
        .insert({
          descricao: `Recebimento: ${orcamento.clienteNome} - ${orcamento.codigo}`,
          valor: valorRecebido,
          tipo: 'entrada',
          data_lancamento: movimentacao.data_movimentacao,
          parcela_receber_id: parcelaId,
          forma_pagamento_id: formaPagamentoId || null,
          observacoes: `Conciliado via extrato bancário`,
          created_by_user_id: user.id,
          organization_id: organizationId
        })
        .select('id')
        .single();

      if (erroLancamento) throw erroLancamento;

      // Atualizar movimentação do extrato
      const { error: erroMov } = await supabase
        .from('movimentacoes_extrato')
        .update({
          lancamento_id: lancamento.id,
          conciliado: true
        })
        .eq('id', movimentacao.id);

      if (erroMov) throw erroMov;

      // Atualizar parcela como paga
      const { error: erroParcela } = await supabase
        .from('parcelas_receber')
        .update({
          status: 'pago',
          data_pagamento: movimentacao.data_movimentacao,
          forma_pagamento_id: formaPagamentoId || null
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

      return { contaReceberId, parcelaId, lancamentoId: lancamento.id };
    },
    onSuccess: () => {
      toast.success('Pagamento vinculado ao orçamento com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-extrato'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['parcelas-para-conciliacao'] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos-financeiros'] });
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error('Erro ao vincular: ' + error.message);
    }
  });

  if (!movimentacao || !orcamento) return null;

  const valorMovimentacao = Math.abs(movimentacao.valor);
  const valorOrcamento = orcamento.valorTotal;
  const isValorExato = Math.abs(valorMovimentacao - valorOrcamento) < 1;
  const isPagamentoParcial = valorMovimentacao < valorOrcamento * 0.99;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Vincular ao Orçamento
          </DialogTitle>
          <DialogDescription>
            Criar conta a receber e registrar o pagamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info do Orçamento */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{orcamento.codigo}</Badge>
                <span className="text-sm font-medium">{orcamento.clienteNome}</span>
              </div>
              <Badge 
                variant="outline" 
                className={cn(
                  orcamento.similaridade >= 80 
                    ? 'border-green-500 text-green-600' 
                    : 'border-amber-500 text-amber-600'
                )}
              >
                {orcamento.similaridade}% match
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Valor orçamento:</span>
                <span className="ml-2 font-medium">{formatCurrency(valorOrcamento)}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground">Valor recebido:</span>
                <span className="ml-2 font-medium text-green-600">{formatCurrency(valorMovimentacao)}</span>
              </div>
            </div>
          </div>

          {/* Status do match */}
          {isValorExato ? (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span>Valor exato! Pagamento total do orçamento.</span>
            </div>
          ) : isPagamentoParcial ? (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>
                Pagamento parcial ({Math.round((valorMovimentacao / valorOrcamento) * 100)}% do total)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-blue-600 text-sm">
              <Plus className="h-4 w-4" />
              <span>Valor acima do orçamento - diferença será registrada</span>
            </div>
          )}

          {/* Se já existe conta */}
          {contaExistente && (
            <div className="p-3 border border-blue-200 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Já existe conta a receber para este orçamento. O pagamento será vinculado à parcela pendente.
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                Valor pago: {formatCurrency(contaExistente.valor_pago)} / {formatCurrency(contaExistente.valor_total)}
              </div>
            </div>
          )}

          {/* Campos para nova conta */}
          {!contaExistente && (
            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nº de Parcelas</Label>
                  <Select value={numeroParcelas} onValueChange={setNumeroParcelas}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 10, 12].map(n => (
                        <SelectItem key={n} value={String(n)}>
                          {n}x de {formatCurrency(valorOrcamento / n)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data 1ª Parcela</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {format(dataPrimeiraParcela, 'dd/MM/yyyy', { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dataPrimeiraParcela}
                        onSelect={(d) => d && setDataPrimeiraParcela(d)}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}

          {/* Forma de pagamento */}
          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <Select value={formaPagamentoId} onValueChange={setFormaPagamentoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {formasPagamento.map((fp) => (
                  <SelectItem key={fp.id} value={fp.id}>
                    {fp.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre o pagamento..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => registrarMutation.mutate()}
            disabled={registrarMutation.isPending}
          >
            {registrarMutation.isPending ? 'Vinculando...' : 'Vincular e Registrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
