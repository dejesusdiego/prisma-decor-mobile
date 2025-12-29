import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, DollarSign, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DialogRegistrarPagamentoRapidoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcelaId: string;
  valorParcela: number;
  clienteNome: string;
  numeroParcela: number;
}

export function DialogRegistrarPagamentoRapido({
  open,
  onOpenChange,
  parcelaId,
  valorParcela,
  clienteNome,
  numeroParcela
}: DialogRegistrarPagamentoRapidoProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [valorPago, setValorPago] = useState(valorParcela.toString());
  const [dataPagamento, setDataPagamento] = useState<Date>(new Date());
  const [formaPagamentoId, setFormaPagamentoId] = useState<string>('');
  const [observacoes, setObservacoes] = useState('');

  // Buscar formas de pagamento
  const { data: formasPagamento } = useQuery({
    queryKey: ['formas-pagamento-ativas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formas_pagamento')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  });

  const registrarPagamentoMutation = useMutation({
    mutationFn: async () => {
      const valor = parseFloat(valorPago);
      
      // 1. Atualizar parcela
      const { error: erroParcela } = await supabase
        .from('parcelas_receber')
        .update({
          status: 'pago',
          data_pagamento: format(dataPagamento, 'yyyy-MM-dd'),
          forma_pagamento_id: formaPagamentoId || null,
          observacoes: observacoes || null
        })
        .eq('id', parcelaId);
      
      if (erroParcela) throw erroParcela;

      // 2. Buscar conta_receber_id e atualizar valor_pago
      const { data: parcela, error: erroBusca } = await supabase
        .from('parcelas_receber')
        .select('conta_receber_id')
        .eq('id', parcelaId)
        .single();
      
      if (erroBusca) throw erroBusca;

      // 3. Atualizar conta_receber
      const { data: contaAtual, error: erroConta } = await supabase
        .from('contas_receber')
        .select('valor_pago, valor_total')
        .eq('id', parcela.conta_receber_id)
        .single();
      
      if (erroConta) throw erroConta;

      const novoValorPago = (contaAtual.valor_pago || 0) + valor;
      const novoStatus = novoValorPago >= contaAtual.valor_total ? 'pago' : 'parcial';

      const { error: erroAtualiza } = await supabase
        .from('contas_receber')
        .update({
          valor_pago: novoValorPago,
          status: novoStatus
        })
        .eq('id', parcela.conta_receber_id);
      
      if (erroAtualiza) throw erroAtualiza;

      // 4. Criar lançamento financeiro
      const { error: erroLancamento } = await supabase
        .from('lancamentos_financeiros')
        .insert({
          tipo: 'receita',
          descricao: `Recebimento parcela ${numeroParcela} - ${clienteNome}`,
          valor,
          data_lancamento: format(dataPagamento, 'yyyy-MM-dd'),
          forma_pagamento_id: formaPagamentoId || null,
          parcela_receber_id: parcelaId,
          created_by_user_id: user?.id
        });
      
      if (erroLancamento) throw erroLancamento;
    },
    onSuccess: () => {
      toast.success('Pagamento registrado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['parcelas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['contato-financeiro'] });
      queryClient.invalidateQueries({ queryKey: ['jornada-cliente'] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Erro ao registrar pagamento:', error);
      toast.error('Erro ao registrar pagamento');
    }
  });

  const handleSubmit = () => {
    if (!valorPago || parseFloat(valorPago) <= 0) {
      toast.error('Valor inválido');
      return;
    }
    registrarPagamentoMutation.mutate();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-500" />
            Registrar Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info da Parcela */}
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="font-medium">{clienteNome}</p>
            <p className="text-sm text-muted-foreground">
              Parcela {numeroParcela} • {formatCurrency(valorParcela)}
            </p>
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label>Valor Pago</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                step="0.01"
                value={valorPago}
                onChange={(e) => setValorPago(e.target.value)}
                className="pl-9"
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label>Data do Pagamento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataPagamento && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataPagamento ? format(dataPagamento, "PPP", { locale: ptBR }) : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataPagamento}
                  onSelect={(date) => date && setDataPagamento(date)}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-2">
            <Label>Forma de Pagamento (opcional)</Label>
            <Select value={formaPagamentoId} onValueChange={setFormaPagamentoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {formasPagamento?.map(fp => (
                  <SelectItem key={fp.id} value={fp.id}>{fp.nome}</SelectItem>
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
              placeholder="Detalhes do pagamento..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={registrarPagamentoMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {registrarPagamentoMutation.isPending ? 'Registrando...' : 'Registrar Pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
