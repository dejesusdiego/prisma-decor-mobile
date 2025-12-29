import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Receipt, User, FileText, Calendar, CheckCircle2, CreditCard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

interface ParcelaReceber {
  id: string;
  numero_parcela: number;
  valor: number;
  data_vencimento: string;
  status: string;
  conta_receber: {
    id: string;
    cliente_nome: string;
    cliente_telefone: string | null;
    orcamento_id: string | null;
    orcamento?: {
      id: string;
      codigo: string;
      cliente_nome: string;
    } | null;
  };
}

interface MovimentacaoExtrato {
  id: string;
  data_movimentacao: string;
  descricao: string;
  valor: number;
  tipo: string | null;
}

interface DialogConciliarComRecebimentoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movimentacao: MovimentacaoExtrato | null;
  parcela: ParcelaReceber | null;
}

export function DialogConciliarComRecebimento({
  open,
  onOpenChange,
  movimentacao,
  parcela
}: DialogConciliarComRecebimentoProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formaPagamentoId, setFormaPagamentoId] = useState('');

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

  // Registrar recebimento e conciliar
  const registrarMutation = useMutation({
    mutationFn: async () => {
      if (!movimentacao || !parcela || !user) throw new Error('Dados inválidos');

      // 1. Atualizar parcela como paga
      const { error: parcelaError } = await supabase
        .from('parcelas_receber')
        .update({
          status: 'pago',
          data_pagamento: movimentacao.data_movimentacao,
          forma_pagamento_id: formaPagamentoId || null
        })
        .eq('id', parcela.id);

      if (parcelaError) throw parcelaError;

      // 2. Criar lançamento financeiro
      const { data: lancamento, error: lancError } = await supabase
        .from('lancamentos_financeiros')
        .insert({
          descricao: `Recebimento: ${parcela.conta_receber.cliente_nome} - Parcela ${parcela.numero_parcela}`,
          valor: movimentacao.valor,
          data_lancamento: movimentacao.data_movimentacao,
          tipo: 'entrada',
          parcela_receber_id: parcela.id,
          forma_pagamento_id: formaPagamentoId || null,
          created_by_user_id: user.id
        })
        .select('id')
        .single();

      if (lancError) throw lancError;

      // 3. Vincular movimentação ao lançamento
      const { error: movError } = await supabase
        .from('movimentacoes_extrato')
        .update({
          lancamento_id: lancamento.id,
          conciliado: true
        })
        .eq('id', movimentacao.id);

      if (movError) throw movError;

      // 4. Atualizar valor_pago da conta_receber
      const { data: contaAtual } = await supabase
        .from('contas_receber')
        .select('valor_pago, valor_total')
        .eq('id', parcela.conta_receber.id)
        .single();

      if (contaAtual) {
        const novoValorPago = (contaAtual.valor_pago || 0) + movimentacao.valor;
        const novoStatus = novoValorPago >= contaAtual.valor_total ? 'pago' : 'parcial';

        await supabase
          .from('contas_receber')
          .update({
            valor_pago: novoValorPago,
            status: novoStatus
          })
          .eq('id', parcela.conta_receber.id);
      }

      return { lancamentoId: lancamento.id };
    },
    onSuccess: () => {
      toast.success('Recebimento registrado e conciliado!');
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-extrato'] });
      queryClient.invalidateQueries({ queryKey: ['parcelas-para-conciliacao'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error('Erro: ' + error.message);
    }
  });

  if (!movimentacao || !parcela) return null;

  const valorDiferenca = movimentacao.valor - parcela.valor;
  const valorMatch = Math.abs(valorDiferenca) < 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Registrar Recebimento
          </DialogTitle>
          <DialogDescription>
            Conciliar movimentação com parcela e registrar pagamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cliente info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{parcela.conta_receber.cliente_nome}</p>
                  {parcela.conta_receber.cliente_telefone && (
                    <p className="text-sm text-muted-foreground">{parcela.conta_receber.cliente_telefone}</p>
                  )}
                  {parcela.conta_receber.orcamento && (
                    <Badge variant="outline" className="mt-1">
                      <FileText className="h-3 w-3 mr-1" />
                      {parcela.conta_receber.orcamento.codigo}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparação valores */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Extrato</p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(movimentacao.valor)}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(movimentacao.data_movimentacao), "dd/MM/yyyy")}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Parcela {parcela.numero_parcela}</p>
              <p className="text-lg font-bold">
                {formatCurrency(parcela.valor)}
              </p>
              <p className="text-xs text-muted-foreground">
                Venc: {format(new Date(parcela.data_vencimento), "dd/MM/yyyy")}
              </p>
            </div>
          </div>

          {/* Status match */}
          {valorMatch ? (
            <div className="flex items-center gap-2 p-2 bg-green-50 text-green-700 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Valores correspondem</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 bg-amber-50 text-amber-700 rounded-lg">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm">
                Diferença: {formatCurrency(valorDiferenca)}
              </span>
            </div>
          )}

          <Separator />

          {/* Forma de pagamento */}
          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => registrarMutation.mutate()} disabled={registrarMutation.isPending}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {registrarMutation.isPending ? 'Registrando...' : 'Registrar Recebimento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
