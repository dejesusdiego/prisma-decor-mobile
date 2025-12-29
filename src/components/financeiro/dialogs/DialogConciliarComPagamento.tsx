import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreditCard, Check, AlertCircle, ArrowRight, Banknote } from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useFinanceiroInvalidation } from '@/hooks/useFinanceiroInvalidation';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

interface ContaPagar {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  status: string;
  fornecedor: string | null;
  orcamento_id: string | null;
  orcamento?: {
    id: string;
    codigo: string;
    cliente_nome: string;
  } | null;
  categoria?: {
    id: string;
    nome: string;
  } | null;
}

interface MovimentacaoExtrato {
  id: string;
  descricao: string;
  valor: number;
  data_movimentacao: string;
  tipo: string;
}

interface DialogConciliarComPagamentoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movimentacao: MovimentacaoExtrato | null;
  contaPagar: ContaPagar | null;
}

export function DialogConciliarComPagamento({
  open,
  onOpenChange,
  movimentacao,
  contaPagar
}: DialogConciliarComPagamentoProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { invalidateAfterPagamento, invalidateConciliacao } = useFinanceiroInvalidation();
  const [formaPagamentoId, setFormaPagamentoId] = useState<string>('');

  // Buscar formas de pagamento
  const { data: formasPagamento = [] } = useQuery({
    queryKey: ['formas-pagamento-ativas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formas_pagamento')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data;
    }
  });

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setFormaPagamentoId('');
    }
  }, [open]);

  // Calcular diferença
  const valorMov = movimentacao ? Math.abs(Number(movimentacao.valor)) : 0;
  const valorConta = contaPagar ? Number(contaPagar.valor) : 0;
  const diferenca = valorMov - valorConta;
  const isValorExato = Math.abs(diferenca) < 1;
  const isValorMaior = diferenca > 1;
  const isValorMenor = diferenca < -1;

  const registrarMutation = useMutation({
    mutationFn: async () => {
      if (!movimentacao || !contaPagar || !user) {
        throw new Error('Dados incompletos');
      }

      // 1. Atualizar conta a pagar como paga
      const { error: cpError } = await supabase
        .from('contas_pagar')
        .update({
          status: 'pago',
          data_pagamento: movimentacao.data_movimentacao,
          forma_pagamento_id: formaPagamentoId || null
        })
        .eq('id', contaPagar.id);

      if (cpError) throw cpError;

      // 2. Criar lançamento financeiro
      const { data: lancamento, error: lancError } = await supabase
        .from('lancamentos_financeiros')
        .insert({
          descricao: `Pagamento: ${contaPagar.descricao}${contaPagar.fornecedor ? ` - ${contaPagar.fornecedor}` : ''}`,
          valor: valorMov,
          data_lancamento: movimentacao.data_movimentacao,
          tipo: 'saida',
          conta_pagar_id: contaPagar.id,
          forma_pagamento_id: formaPagamentoId || null,
          categoria_id: contaPagar.categoria?.id || null,
          created_by_user_id: user.id
        })
        .select('id')
        .single();

      if (lancError) throw lancError;

      // 3. Vincular movimentação do extrato ao lançamento
      const { error: movError } = await supabase
        .from('movimentacoes_extrato')
        .update({
          lancamento_id: lancamento.id,
          conciliado: true
        })
        .eq('id', movimentacao.id);

      if (movError) throw movError;

      return { lancamentoId: lancamento.id };
    },
    onSuccess: () => {
      toast.success('Pagamento registrado e conciliado');
      invalidateAfterPagamento();
      invalidateConciliacao();
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-extrato'] });
      queryClient.invalidateQueries({ queryKey: ['contas-pagar-para-conciliacao'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error('Erro ao registrar: ' + error.message);
    }
  });

  if (!movimentacao || !contaPagar) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Registrar Pagamento
          </DialogTitle>
          <DialogDescription>
            Vincule o débito do extrato a uma conta a pagar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Movimentação do Extrato */}
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground mb-1">Débito no Extrato</p>
              <p className="font-medium truncate">{movimentacao.descricao}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">
                  {format(new Date(movimentacao.data_movimentacao), "dd/MM/yyyy", { locale: ptBR })}
                </span>
                <span className="text-lg font-bold text-destructive">
                  -{formatCurrency(valorMov)}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>

          {/* Conta a Pagar */}
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground mb-1">Conta a Pagar</p>
              <p className="font-medium truncate">{contaPagar.descricao}</p>
              {contaPagar.fornecedor && (
                <p className="text-sm text-muted-foreground">{contaPagar.fornecedor}</p>
              )}
              {contaPagar.orcamento && (
                <Badge variant="outline" className="mt-1">
                  {contaPagar.orcamento.codigo}
                </Badge>
              )}
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">
                  Venc: {format(new Date(contaPagar.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                </span>
                <span className="text-lg font-bold">
                  {formatCurrency(valorConta)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Status da comparação */}
          <div className="flex items-center justify-center gap-2">
            {isValorExato && (
              <Badge className="bg-green-500 gap-1">
                <Check className="h-3 w-3" />
                Valores coincidem
              </Badge>
            )}
            {isValorMaior && (
              <Badge variant="outline" className="text-amber-600 gap-1">
                <AlertCircle className="h-3 w-3" />
                Pago {formatCurrency(diferenca)} a mais
              </Badge>
            )}
            {isValorMenor && (
              <Badge variant="outline" className="text-amber-600 gap-1">
                <AlertCircle className="h-3 w-3" />
                Pago {formatCurrency(Math.abs(diferenca))} a menos
              </Badge>
            )}
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Forma de Pagamento</label>
            <Select value={formaPagamentoId} onValueChange={setFormaPagamentoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {formasPagamento.map(fp => (
                  <SelectItem key={fp.id} value={fp.id}>{fp.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => registrarMutation.mutate()}
            disabled={registrarMutation.isPending}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Registrar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
