import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface DialogFormaPagamentoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forma?: any;
}

export function DialogFormaPagamento({ open, onOpenChange, forma }: DialogFormaPagamentoProps) {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganizationContext();
  
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      nome: '',
      tipo: 'dinheiro',
      permite_parcelamento: false,
      max_parcelas: '1',
      taxa_percentual: '0'
    }
  });

  const permiteParcelamento = watch('permite_parcelamento');

  useEffect(() => {
    if (forma) {
      reset({
        nome: forma.nome,
        tipo: forma.tipo,
        permite_parcelamento: forma.permite_parcelamento,
        max_parcelas: forma.max_parcelas?.toString() || '1',
        taxa_percentual: forma.taxa_percentual?.toString() || '0'
      });
    } else {
      reset({
        nome: '',
        tipo: 'dinheiro',
        permite_parcelamento: false,
        max_parcelas: '1',
        taxa_percentual: '0'
      });
    }
  }, [forma, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (!organizationId) throw new Error('Organização não identificada');

      const payload = {
        nome: data.nome,
        tipo: data.tipo,
        permite_parcelamento: data.permite_parcelamento,
        max_parcelas: data.permite_parcelamento ? parseInt(data.max_parcelas) : 1,
        taxa_percentual: parseFloat(data.taxa_percentual) || 0,
        organization_id: organizationId
      };

      if (forma) {
        const { error } = await supabase
          .from('formas_pagamento')
          .update(payload)
          .eq('id', forma.id)
          .eq('organization_id', organizationId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('formas_pagamento')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formas-pagamento'] });
      toast.success(forma ? 'Forma atualizada' : 'Forma criada');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Erro ao salvar forma de pagamento');
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{forma ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input {...register('nome', { required: true })} placeholder="Ex: Cartão de Crédito" />
          </div>

          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select 
              value={watch('tipo')} 
              onValueChange={(v) => setValue('tipo', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Permite Parcelamento</Label>
            <Switch
              checked={watch('permite_parcelamento')}
              onCheckedChange={(checked) => setValue('permite_parcelamento', checked)}
            />
          </div>

          {permiteParcelamento && (
            <div className="space-y-2">
              <Label>Máximo de Parcelas</Label>
              <Input 
                {...register('max_parcelas')} 
                type="number" 
                min="1"
                max="24"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Taxa (%)</Label>
            <Input 
              {...register('taxa_percentual')} 
              type="number" 
              step="0.01"
              placeholder="0,00" 
            />
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
