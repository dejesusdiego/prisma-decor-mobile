import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { addMonths, format } from 'date-fns';
import { parseDateOnly } from '@/lib/dateOnly';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface DialogContaReceberProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta?: any;
}

export function DialogContaReceber({ open, onOpenChange, conta }: DialogContaReceberProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      cliente_nome: '',
      cliente_telefone: '',
      descricao: '',
      valor_total: '',
      numero_parcelas: '1',
      data_vencimento: '',
      observacoes: ''
    }
  });

  useEffect(() => {
    if (conta) {
      reset({
        cliente_nome: conta.cliente_nome,
        cliente_telefone: conta.cliente_telefone || '',
        descricao: conta.descricao,
        valor_total: conta.valor_total.toString(),
        numero_parcelas: conta.numero_parcelas.toString(),
        data_vencimento: conta.data_vencimento,
        observacoes: conta.observacoes || ''
      });
    } else {
      reset({
        cliente_nome: '',
        cliente_telefone: '',
        descricao: '',
        valor_total: '',
        numero_parcelas: '1',
        data_vencimento: '',
        observacoes: ''
      });
    }
  }, [conta, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const valorTotal = parseFloat(data.valor_total);
      const numParcelas = parseInt(data.numero_parcelas);
      const valorParcela = valorTotal / numParcelas;

      if (conta) {
        // Apenas atualizar dados básicos
        const { error } = await supabase
          .from('contas_receber')
          .update({
            cliente_nome: data.cliente_nome,
            cliente_telefone: data.cliente_telefone || null,
            descricao: data.descricao,
            observacoes: data.observacoes || null,
          })
          .eq('id', conta.id);
        if (error) throw error;
      } else {
        // Criar conta a receber
        const { data: novaConta, error: errorConta } = await supabase
          .from('contas_receber')
          .insert({
            cliente_nome: data.cliente_nome,
            cliente_telefone: data.cliente_telefone || null,
            descricao: data.descricao,
            valor_total: valorTotal,
            numero_parcelas: numParcelas,
            data_vencimento: data.data_vencimento,
            observacoes: data.observacoes || null,
            created_by_user_id: user?.id
          })
          .select()
          .single();
        
        if (errorConta) throw errorConta;

        // Criar parcelas
        const parcelas = [];
        for (let i = 0; i < numParcelas; i++) {
          const dataVencimento = addMonths(parseDateOnly(data.data_vencimento) || new Date(), i);
          parcelas.push({
            conta_receber_id: novaConta.id,
            numero_parcela: i + 1,
            valor: valorParcela,
            data_vencimento: format(dataVencimento, 'yyyy-MM-dd'),
            status: 'pendente'
          });
        }

        const { error: errorParcelas } = await supabase
          .from('parcelas_receber')
          .insert(parcelas);
        
        if (errorParcelas) throw errorParcelas;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      toast.success(conta ? 'Conta atualizada' : 'Conta criada');
      onOpenChange(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao salvar conta');
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{conta ? 'Editar Conta a Receber' : 'Nova Conta a Receber'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Input {...register('cliente_nome', { required: true })} placeholder="Nome do cliente" />
          </div>

          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input {...register('cliente_telefone')} placeholder="(00) 00000-0000" />
          </div>

          <div className="space-y-2">
            <Label>Descrição *</Label>
            <Input {...register('descricao', { required: true })} placeholder="Ex: Venda de cortinas" />
          </div>

          {!conta && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Total *</Label>
                  <Input 
                    {...register('valor_total', { required: true })} 
                    type="number" 
                    step="0.01"
                    placeholder="0,00" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nº Parcelas *</Label>
                  <Input 
                    {...register('numero_parcelas', { required: true })} 
                    type="number" 
                    min="1"
                    max="24"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Primeira Parcela *</Label>
                <Input 
                  {...register('data_vencimento', { required: true })} 
                  type="date" 
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea {...register('observacoes')} rows={3} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
