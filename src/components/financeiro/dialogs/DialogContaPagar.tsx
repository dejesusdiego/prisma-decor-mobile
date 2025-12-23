import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface DialogContaPagarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta?: any;
}

export function DialogContaPagar({ open, onOpenChange, conta }: DialogContaPagarProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      descricao: '',
      fornecedor: '',
      valor: '',
      data_vencimento: '',
      categoria_id: '',
      observacoes: ''
    }
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias-despesa'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_financeiras')
        .select('*')
        .eq('tipo', 'despesa')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (conta) {
      reset({
        descricao: conta.descricao,
        fornecedor: conta.fornecedor || '',
        valor: conta.valor.toString(),
        data_vencimento: conta.data_vencimento,
        categoria_id: conta.categoria_id || '',
        observacoes: conta.observacoes || ''
      });
    } else {
      reset({
        descricao: '',
        fornecedor: '',
        valor: '',
        data_vencimento: '',
        categoria_id: '',
        observacoes: ''
      });
    }
  }, [conta, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        descricao: data.descricao,
        fornecedor: data.fornecedor || null,
        valor: parseFloat(data.valor),
        data_vencimento: data.data_vencimento,
        categoria_id: data.categoria_id || null,
        observacoes: data.observacoes || null,
        created_by_user_id: user?.id
      };

      if (conta) {
        const { error } = await supabase
          .from('contas_pagar')
          .update(payload)
          .eq('id', conta.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contas_pagar')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      toast.success(conta ? 'Conta atualizada' : 'Conta criada');
      onOpenChange(false);
    },
    onError: () => {
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
          <DialogTitle>{conta ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição *</Label>
            <Input {...register('descricao', { required: true })} placeholder="Ex: Aluguel" />
          </div>

          <div className="space-y-2">
            <Label>Fornecedor</Label>
            <Input {...register('fornecedor')} placeholder="Ex: Imobiliária XYZ" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor *</Label>
              <Input 
                {...register('valor', { required: true })} 
                type="number" 
                step="0.01"
                placeholder="0,00" 
              />
            </div>
            <div className="space-y-2">
              <Label>Vencimento *</Label>
              <Input 
                {...register('data_vencimento', { required: true })} 
                type="date" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select 
              value={watch('categoria_id')} 
              onValueChange={(v) => setValue('categoria_id', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.cor || '#6B7280' }}
                      />
                      {cat.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
