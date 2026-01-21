import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDateOnly } from '@/lib/dateOnly';
import { Receipt, User, FileText, Calendar, CheckCircle2, CreditCard, AlertTriangle } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
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
  isPagamentoParcial?: boolean;
}

export function DialogConciliarComRecebimento({
  open,
  onOpenChange,
  movimentacao,
  parcela,
  isPagamentoParcial = false
}: DialogConciliarComRecebimentoProps) {
  const { user } = useAuth();
  const { organizationId } = useOrganizationContext();
  const queryClient = useQueryClient();
  const [formaPagamentoId, setFormaPagamentoId] = useState('');
  const [valorRecebido, setValorRecebido] = useState<string>('');
  const [registrarComoParcial, setRegistrarComoParcial] = useState(isPagamentoParcial);

  // Inicializar valor quando abrir dialog
  useEffect(() => {
    if (open && movimentacao) {
      setValorRecebido(movimentacao.valor.toString());
      setRegistrarComoParcial(isPagamentoParcial);
    }
  }, [open, movimentacao, isPagamentoParcial]);

  // Buscar formas de pagamento
  const { data: formasPagamento = [] } = useQuery({
    queryKey: ['formas-pagamento', organizationId],
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
    enabled: open && !!organizationId
  });

  // Registrar recebimento e conciliar
  const registrarMutation = useMutation({
    mutationFn: async () => {
      if (!movimentacao || !parcela || !user) throw new Error('Dados inválidos');

      const valorEfetivo = parseFloat(valorRecebido) || movimentacao.valor;
      const isParcial = valorEfetivo < parcela.valor;
      const novoStatusParcela = isParcial ? 'parcial' : 'pago';

      // 1. Atualizar parcela
      const { error: parcelaError } = await supabase
        .from('parcelas_receber')
        .update({
          status: novoStatusParcela,
          data_pagamento: movimentacao.data_movimentacao,
          forma_pagamento_id: formaPagamentoId || null,
          observacoes: isParcial 
            ? `Pagamento parcial de ${formatCurrency(valorEfetivo)} (esperado: ${formatCurrency(parcela.valor)})`
            : null
        })
        .eq('id', parcela.id);

      if (parcelaError) throw parcelaError;

      // 2. Criar lançamento financeiro
      const descricaoLancamento = isParcial
        ? `Recebimento PARCIAL: ${parcela.conta_receber.cliente_nome} - Parcela ${parcela.numero_parcela}`
        : `Recebimento: ${parcela.conta_receber.cliente_nome} - Parcela ${parcela.numero_parcela}`;

      const { data: lancamento, error: lancError } = await supabase
        .from('lancamentos_financeiros')
        .insert({
          descricao: descricaoLancamento,
          valor: valorEfetivo,
          data_lancamento: movimentacao.data_movimentacao,
          tipo: 'entrada',
          parcela_receber_id: parcela.id,
          forma_pagamento_id: formaPagamentoId || null,
          created_by_user_id: user.id,
          organization_id: organizationId
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

      // 4. Atualizar parcela (se ainda não estiver paga)
      // O trigger SQL vai atualizar automaticamente o status de contas_receber
      if (parcela.status !== 'pago') {
        const { error: parcelaError } = await supabase
          .from('parcelas_receber')
          .update({
            status: 'pago',
            data_pagamento: dataPagamento
          })
          .eq('id', parcela.id);

        if (parcelaError) throw parcelaError;

        // Aguardar trigger executar e verificar se atualizou corretamente (fallback)
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data: contaAtual } = await supabase
          .from('contas_receber')
          .select('valor_pago, valor_total, status')
          .eq('id', parcela.conta_receber.id)
          .single();

        if (contaAtual) {
          // Buscar todas as parcelas pagas para calcular valor correto
          const { data: parcelasPagas } = await supabase
            .from('parcelas_receber')
            .select('valor')
            .eq('conta_receber_id', parcela.conta_receber.id)
            .eq('status', 'pago');

          const valorEsperado = parcelasPagas?.reduce((acc, p) => acc + Number(p.valor), 0) || 0;
          const statusEsperado = valorEsperado >= contaAtual.valor_total ? 'pago' : 'parcial';

          // Verificar se precisa atualizar manualmente (fallback)
          if (Math.abs(Number(contaAtual.valor_pago) - valorEsperado) > 0.01 ||
              contaAtual.status !== statusEsperado) {
            console.warn('[DialogConciliarComRecebimento] Trigger não atualizou corretamente, atualizando manualmente');
            await supabase
              .from('contas_receber')
              .update({
                valor_pago: valorEsperado,
                status: statusEsperado
              })
              .eq('id', parcela.conta_receber.id);
          }
        }
      }

      return { lancamentoId: lancamento.id, isParcial };
    },
    onSuccess: (result) => {
      if (result?.isParcial) {
        toast.success('Pagamento PARCIAL registrado e conciliado!');
      } else {
        toast.success('Recebimento registrado e conciliado!');
      }
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

  const valorNum = parseFloat(valorRecebido) || movimentacao.valor;
  const valorDiferenca = valorNum - parcela.valor;
  const valorMatch = Math.abs(valorDiferenca) < 1;
  const isParcial = valorNum < parcela.valor;
  const percentual = (valorNum / parcela.valor) * 100;

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
                {formatDateOnly(movimentacao.data_movimentacao)}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Parcela {parcela.numero_parcela}</p>
              <p className="text-lg font-bold">
                {formatCurrency(parcela.valor)}
              </p>
              <p className="text-xs text-muted-foreground">
                Venc: {formatDateOnly(parcela.data_vencimento)}
              </p>
            </div>
          </div>

          {/* Status match */}
          {valorMatch ? (
            <div className="flex items-center gap-2 p-2 bg-green-50 text-green-700 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Valores correspondem</span>
            </div>
          ) : isParcial ? (
            <div className="flex items-center gap-2 p-2 bg-amber-50 text-amber-700 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                Pagamento parcial: {percentual.toFixed(0)}% do valor (faltam {formatCurrency(Math.abs(valorDiferenca))})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 bg-blue-50 text-blue-700 rounded-lg">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm">
                Valor excedente: +{formatCurrency(valorDiferenca)}
              </span>
            </div>
          )}

          <Separator />

          {/* Campo de valor (editável para pagamentos parciais) */}
          {isPagamentoParcial && (
            <div className="space-y-2">
              <Label htmlFor="valorRecebido">Valor Recebido</Label>
              <Input
                id="valorRecebido"
                type="number"
                step="0.01"
                value={valorRecebido}
                onChange={(e) => setValorRecebido(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Valor original da movimentação: {formatCurrency(movimentacao.valor)}
              </p>
            </div>
          )}

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
            {registrarMutation.isPending ? 'Registrando...' : isParcial ? 'Registrar Pagamento Parcial' : 'Registrar Recebimento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
