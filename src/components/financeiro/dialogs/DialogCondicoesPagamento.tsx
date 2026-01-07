import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { addMonths, format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

interface DialogCondicoesPagamentoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamento: {
    id: string;
    codigo: string;
    cliente_nome: string;
    cliente_telefone: string;
    total_geral: number;
    total_com_desconto?: number | null;
  } | null;
  novoStatus: string;
  onSuccess: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function DialogCondicoesPagamento({ 
  open, 
  onOpenChange, 
  orcamento,
  novoStatus,
  onSuccess
}: DialogCondicoesPagamentoProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      numero_parcelas: '1',
      data_primeira_parcela: format(new Date(), 'yyyy-MM-dd'),
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

  const numParcelas = parseInt(watch('numero_parcelas') || '1');
  const valorTotal = orcamento?.total_com_desconto || orcamento?.total_geral || 0;
  const valorParcela = valorTotal / numParcelas;

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (!orcamento || !user) throw new Error('Dados inválidos');

      // 1. Atualizar status do orçamento
      const { error: errorOrc } = await supabase
        .from('orcamentos')
        .update({ status: novoStatus })
        .eq('id', orcamento.id);
      
      if (errorOrc) throw errorOrc;

      // 2. Verificar se já existe conta a receber para este orçamento
      const { data: contaExistente } = await supabase
        .from('contas_receber')
        .select('id')
        .eq('orcamento_id', orcamento.id)
        .maybeSingle();

      if (contaExistente) {
        // Já existe conta, apenas atualiza o status do orçamento
        return;
      }

      // 3. Criar conta a receber
      const { data: novaConta, error: errorConta } = await supabase
        .from('contas_receber')
        .insert({
          orcamento_id: orcamento.id,
          cliente_nome: orcamento.cliente_nome,
          cliente_telefone: orcamento.cliente_telefone || null,
          descricao: `Orçamento ${orcamento.codigo}`,
          valor_total: valorTotal,
          numero_parcelas: numParcelas,
          data_vencimento: data.data_primeira_parcela,
          status: 'pendente',
          created_by_user_id: user.id
        })
        .select()
        .single();
      
      if (errorConta) throw errorConta;

      // 4. Criar parcelas
      const parcelas = [];
      for (let i = 0; i < numParcelas; i++) {
        const dataVencimento = addMonths(new Date(data.data_primeira_parcela), i);
        parcelas.push({
          conta_receber_id: novaConta.id,
          numero_parcela: i + 1,
          valor: valorParcela,
          data_vencimento: format(dataVencimento, 'yyyy-MM-dd'),
          forma_pagamento_id: data.forma_pagamento_id || null,
          status: 'pendente'
        });
      }

      const { error: errorParcelas } = await supabase
        .from('parcelas_receber')
        .insert(parcelas);
      
      if (errorParcelas) throw errorParcelas;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      toast.success('Conta a receber criada automaticamente');
      reset();
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao processar pagamento');
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  if (!orcamento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Condições de Pagamento</DialogTitle>
          <DialogDescription>
            Configure as parcelas para o orçamento {orcamento.codigo}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted p-4 rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Valor Total</span>
            <span className="text-xl font-bold">{formatCurrency(valorTotal)}</span>
          </div>
          {numParcelas > 1 && (
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-muted-foreground">{numParcelas}x de</span>
              <span className="text-lg font-medium">{formatCurrency(valorParcela)}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nº de Parcelas *</Label>
              <Input 
                {...register('numero_parcelas', { required: true })} 
                type="number" 
                min="1"
                max="24"
              />
            </div>
            <div className="space-y-2">
              <Label>1ª Parcela *</Label>
              <Input 
                {...register('data_primeira_parcela', { required: true })} 
                type="date" 
              />
            </div>
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

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Criar Conta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
