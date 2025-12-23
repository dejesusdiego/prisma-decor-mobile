import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface DialogRegistrarRecebimentoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcela?: any;
}

export function DialogRegistrarRecebimento({ open, onOpenChange, parcela }: DialogRegistrarRecebimentoProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      data_pagamento: format(new Date(), 'yyyy-MM-dd'),
      forma_pagamento_id: ''
    }
  });

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

  useEffect(() => {
    if (open) {
      reset({
        data_pagamento: format(new Date(), 'yyyy-MM-dd'),
        forma_pagamento_id: ''
      });
    }
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // 1. Atualizar parcela
      const { error: errorParcela } = await supabase
        .from('parcelas_receber')
        .update({
          status: 'pago',
          data_pagamento: data.data_pagamento,
          forma_pagamento_id: data.forma_pagamento_id || null
        })
        .eq('id', parcela.id);
      
      if (errorParcela) throw errorParcela;

      // 2. Buscar conta a receber
      const { data: conta, error: errorConta } = await supabase
        .from('contas_receber')
        .select('*, parcelas:parcelas_receber(*)')
        .eq('id', parcela.conta_receber_id)
        .single();
      
      if (errorConta) throw errorConta;

      // 3. Calcular novo valor pago
      const novoValorPago = conta.parcelas
        .filter((p: any) => p.status === 'pago' || p.id === parcela.id)
        .reduce((acc: number, p: any) => acc + Number(p.valor), 0);

      // 4. Atualizar conta a receber
      const todasPagas = conta.parcelas.every(
        (p: any) => p.status === 'pago' || p.id === parcela.id
      );

      const { error: errorUpdateConta } = await supabase
        .from('contas_receber')
        .update({
          valor_pago: novoValorPago,
          status: todasPagas ? 'pago' : 'parcial'
        })
        .eq('id', parcela.conta_receber_id);
      
      if (errorUpdateConta) throw errorUpdateConta;

      // 5. Criar lançamento financeiro
      const { error: errorLancamento } = await supabase
        .from('lancamentos_financeiros')
        .insert({
          descricao: `Recebimento parcela ${parcela.numero_parcela} - ${conta.cliente_nome}`,
          tipo: 'entrada',
          valor: parcela.valor,
          data_lancamento: data.data_pagamento,
          parcela_receber_id: parcela.id,
          forma_pagamento_id: data.forma_pagamento_id || null,
          created_by_user_id: user?.id
        });
      
      if (errorLancamento) throw errorLancamento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      toast.success('Recebimento registrado');
      onOpenChange(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao registrar recebimento');
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  if (!parcela) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar Recebimento</DialogTitle>
        </DialogHeader>

        <div className="bg-muted p-3 rounded-lg mb-4">
          <p className="text-sm text-muted-foreground">Parcela {parcela.numero_parcela}</p>
          <p className="text-lg font-bold">{formatCurrency(Number(parcela.valor))}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Data do Pagamento *</Label>
            <Input 
              {...register('data_pagamento', { required: true })} 
              type="date" 
            />
          </div>

          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <Select 
              value={watch('forma_pagamento_id')} 
              onValueChange={(v) => setValue('forma_pagamento_id', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {formasPagamento.map((forma) => (
                  <SelectItem key={forma.id} value={forma.id}>
                    {forma.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Confirmar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
