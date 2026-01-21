import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFinanceiroInvalidation } from '@/hooks/useFinanceiroInvalidation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard, Loader2, Link2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface DialogPagamentoRapidoOrcamentoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamentoId: string;
  orcamentoCodigo: string;
  clienteNome: string;
  valorTotal: number;
  valorPago: number;
  contatoId?: string | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function DialogPagamentoRapidoOrcamento({
  open,
  onOpenChange,
  orcamentoId,
  orcamentoCodigo,
  clienteNome,
  valorTotal,
  valorPago,
  contatoId
}: DialogPagamentoRapidoOrcamentoProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { invalidateAfterRecebimento } = useFinanceiroInvalidation();
  
  const valorRestante = valorTotal - valorPago;
  
  const [valorPagamento, setValorPagamento] = useState(valorRestante.toString());
  const [dataPagamento, setDataPagamento] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formaPagamentoId, setFormaPagamentoId] = useState<string>('');
  const [conciliarComExtrato, setConciliarComExtrato] = useState(false);
  const [movimentacaoSelecionada, setMovimentacaoSelecionada] = useState<string>('');

  // Buscar formas de pagamento
  const { data: formasPagamento = [] } = useQuery({
    queryKey: ['formas-pagamento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formas_pagamento')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // Buscar conta a receber e parcela pendente
  const { data: contaReceber } = useQuery({
    queryKey: ['conta-receber-orcamento', orcamentoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_receber')
        .select(`
          id, valor_total, valor_pago,
          parcelas_receber(id, numero_parcela, valor, data_vencimento, status)
        `)
        .eq('orcamento_id', orcamentoId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: open && !!orcamentoId
  });

  // Buscar movimentações pendentes compatíveis (créditos não conciliados)
  const { data: movimentacoesPendentes = [] } = useQuery({
    queryKey: ['movimentacoes-compativeis', valorPagamento],
    queryFn: async () => {
      const valorNum = parseFloat(valorPagamento) || 0;
      if (valorNum <= 0) return [];
      
      const { data, error } = await supabase
        .from('movimentacoes_extrato')
        .select('id, descricao, valor, data_movimentacao')
        .eq('tipo', 'credito')
        .eq('conciliado', false)
        .eq('ignorado', false)
        .gte('valor', valorNum * 0.9)
        .lte('valor', valorNum * 1.1)
        .order('data_movimentacao', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: open && conciliarComExtrato && parseFloat(valorPagamento) > 0
  });

  // Próxima parcela pendente
  const parcelaPendente = useMemo(() => {
    if (!contaReceber?.parcelas_receber) return null;
    return contaReceber.parcelas_receber
      .filter((p: any) => p.status === 'pendente')
      .sort((a: any, b: any) => a.numero_parcela - b.numero_parcela)[0];
  }, [contaReceber]);

  // Mutation para registrar pagamento
  const registrarMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const valor = parseFloat(valorPagamento);
      if (isNaN(valor) || valor <= 0) throw new Error('Valor inválido');
      
      // 1. Criar lançamento financeiro
      const { data: lancamento, error: lancError } = await supabase
        .from('lancamentos_financeiros')
        .insert({
          descricao: `Recebimento: ${clienteNome} - ${orcamentoCodigo}${parcelaPendente ? ` (Parcela ${parcelaPendente.numero_parcela})` : ''}`,
          valor: valor,
          data_lancamento: dataPagamento,
          tipo: 'entrada',
          parcela_receber_id: parcelaPendente?.id,
          forma_pagamento_id: formaPagamentoId || null,
          created_by_user_id: user.id
        })
        .select('id')
        .single();

      if (lancError) throw lancError;

      // 2. Se tem parcela, atualizar
      // O trigger SQL vai atualizar automaticamente o status de contas_receber
      if (parcelaPendente) {
        const { error: parcelaError } = await supabase
          .from('parcelas_receber')
          .update({
            status: 'pago',
            data_pagamento: dataPagamento,
            forma_pagamento_id: formaPagamentoId || null
          })
          .eq('id', parcelaPendente.id);

        if (parcelaError) throw parcelaError;

        // Aguardar trigger executar e verificar se atualizou corretamente (fallback)
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (contaReceber) {
          const { data: contaAtualizada } = await supabase
            .from('contas_receber')
            .select('valor_pago, valor_total, status')
            .eq('id', contaReceber.id)
            .single();

          if (contaAtualizada) {
            // Verificar se precisa atualizar manualmente (fallback)
            const valorEsperado = (contaReceber.valor_pago || 0) + valor;
            const statusEsperado = valorEsperado >= contaReceber.valor_total ? 'pago' : 'parcial';
            
            if (Math.abs(Number(contaAtualizada.valor_pago) - valorEsperado) > 0.01 ||
                contaAtualizada.status !== statusEsperado) {
              console.warn('[DialogPagamentoRapidoOrcamento] Trigger não atualizou corretamente, atualizando manualmente');
              const { error: contaError } = await supabase
                .from('contas_receber')
                .update({
                  valor_pago: valorEsperado,
                  status: statusEsperado
                })
                .eq('id', contaReceber.id);

              if (contaError) throw contaError;
            }
          }
        }
      }

      // 4. Se marcou conciliar com extrato
      if (conciliarComExtrato && movimentacaoSelecionada) {
        const { error: movError } = await supabase
          .from('movimentacoes_extrato')
          .update({
            lancamento_id: lancamento.id,
            conciliado: true
          })
          .eq('id', movimentacaoSelecionada);

      if (movError) throw movError;
      }

      // NOTA: A sincronização de status do orçamento é feita automaticamente pelo trigger SQL
      // 'sincronizar_status_orcamento' quando contas_receber é atualizado.
      // A criação de atividades CRM também é feita pelo trigger 'create_atividade_from_orcamento_status'.

      return { valor, conciliado: !!movimentacaoSelecionada };
    },
    onSuccess: (result) => {
      toast.success(
        `Pagamento de ${formatCurrency(result.valor)} registrado${result.conciliado ? ' e conciliado' : ''}`
      );
      invalidateAfterRecebimento();
      queryClient.invalidateQueries({ queryKey: ['orcamento-financeiro'] });
      queryClient.invalidateQueries({ queryKey: ['conta-receber-orcamento'] });
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      queryClient.invalidateQueries({ queryKey: ['atividades-crm'] });
      queryClient.invalidateQueries({ queryKey: ['jornada-cliente'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error('Erro ao registrar pagamento: ' + error.message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Registrar Pagamento
          </DialogTitle>
          <DialogDescription>
            {orcamentoCodigo} • {clienteNome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg text-center">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-semibold">{formatCurrency(valorTotal)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pago</p>
              <p className="font-semibold text-green-600">{formatCurrency(valorPago)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Restante</p>
              <p className="font-semibold text-primary">{formatCurrency(valorRestante)}</p>
            </div>
          </div>

          {/* Valor do pagamento */}
          <div className="space-y-2">
            <Label htmlFor="valor">Valor do Pagamento</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              value={valorPagamento}
              onChange={(e) => setValorPagamento(e.target.value)}
              placeholder="0,00"
            />
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="data">Data do Pagamento</Label>
            <Input
              id="data"
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
            />
          </div>

          {/* Forma de pagamento */}
          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <Select value={formaPagamentoId} onValueChange={setFormaPagamentoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {formasPagamento.map((fp) => (
                  <SelectItem key={fp.id} value={fp.id}>{fp.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Opção de conciliar com extrato */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Checkbox
                id="conciliar"
                checked={conciliarComExtrato}
                onCheckedChange={(checked) => {
                  setConciliarComExtrato(!!checked);
                  if (!checked) setMovimentacaoSelecionada('');
                }}
              />
              <Label htmlFor="conciliar" className="flex items-center gap-2 cursor-pointer">
                <Link2 className="h-4 w-4" />
                Conciliar com movimentação do extrato
              </Label>
            </div>

            {conciliarComExtrato && (
              <div className="pl-6">
                {movimentacoesPendentes.length > 0 ? (
                  <ScrollArea className="h-32">
                    <RadioGroup 
                      value={movimentacaoSelecionada} 
                      onValueChange={setMovimentacaoSelecionada}
                    >
                      {movimentacoesPendentes.map((mov) => (
                        <div 
                          key={mov.id} 
                          className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50"
                        >
                          <RadioGroupItem value={mov.id} id={mov.id} />
                          <Label htmlFor={mov.id} className="flex-1 cursor-pointer">
                            <p className="text-sm truncate">{mov.descricao}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(mov.data_movimentacao).toLocaleDateString('pt-BR')}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {formatCurrency(mov.valor)}
                              </Badge>
                              {Math.abs(mov.valor - parseFloat(valorPagamento)) < 1 && (
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                              )}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma movimentação compatível encontrada
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => registrarMutation.mutate()}
            disabled={registrarMutation.isPending || !valorPagamento || parseFloat(valorPagamento) <= 0}
          >
            {registrarMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              'Registrar Pagamento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
