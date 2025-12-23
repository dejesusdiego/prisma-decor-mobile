import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

interface DialogCategoriaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoria?: any;
}

const CORES = [
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#F97316', label: 'Laranja' },
  { value: '#EAB308', label: 'Amarelo' },
  { value: '#22C55E', label: 'Verde' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#3B82F6', label: 'Azul' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#6B7280', label: 'Cinza' },
];

export function DialogCategoria({ open, onOpenChange, categoria }: DialogCategoriaProps) {
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      nome: '',
      tipo: 'despesa',
      cor: '#6B7280'
    }
  });

  useEffect(() => {
    if (categoria) {
      reset({
        nome: categoria.nome,
        tipo: categoria.tipo,
        cor: categoria.cor || '#6B7280'
      });
    } else {
      reset({
        nome: '',
        tipo: 'despesa',
        cor: '#6B7280'
      });
    }
  }, [categoria, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        nome: data.nome,
        tipo: data.tipo,
        cor: data.cor
      };

      if (categoria) {
        const { error } = await supabase
          .from('categorias_financeiras')
          .update(payload)
          .eq('id', categoria.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categorias_financeiras')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-financeiras'] });
      toast.success(categoria ? 'Categoria atualizada' : 'Categoria criada');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Erro ao salvar categoria');
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{categoria ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input {...register('nome', { required: true })} placeholder="Ex: Material de escritório" />
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
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <Select 
              value={watch('cor')} 
              onValueChange={(v) => setValue('cor', v)}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: watch('cor') }}
                    />
                    {CORES.find(c => c.value === watch('cor'))?.label || 'Selecione'}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CORES.map((cor) => (
                  <SelectItem key={cor.value} value={cor.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: cor.value }}
                      />
                      {cor.label}
                    </div>
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
              {mutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
