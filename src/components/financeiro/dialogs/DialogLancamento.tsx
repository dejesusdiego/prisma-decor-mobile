import { useEffect, useMemo } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Info, Wallet } from 'lucide-react';

interface DialogLancamentoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lancamento?: any;
}

export function DialogLancamento({ open, onOpenChange, lancamento }: DialogLancamentoProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      descricao: '',
      tipo: 'saida',
      valor: '',
      data_lancamento: format(new Date(), 'yyyy-MM-dd'),
      categoria_id: '',
      forma_pagamento_id: '',
      observacoes: ''
    }
  });

  const tipoSelecionado = watch('tipo');
  const categoriaId = watch('categoria_id');

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias-financeiras', tipoSelecionado],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_financeiras')
        .select('*')
        .eq('tipo', tipoSelecionado === 'entrada' ? 'receita' : 'despesa')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data;
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

  // Verificar se a categoria selecionada é de empréstimo
  const isEmprestimo = useMemo(() => {
    if (!categoriaId || !categorias.length) return false;
    const categoria = categorias.find(c => c.id === categoriaId);
    return categoria?.nome?.toLowerCase().includes('empréstimo') || 
           categoria?.nome?.toLowerCase().includes('emprestimo');
  }, [categoriaId, categorias]);

  useEffect(() => {
    if (lancamento) {
      reset({
        descricao: lancamento.descricao,
        tipo: lancamento.tipo,
        valor: lancamento.valor.toString(),
        data_lancamento: lancamento.data_lancamento,
        categoria_id: lancamento.categoria_id || '',
        forma_pagamento_id: lancamento.forma_pagamento_id || '',
        observacoes: lancamento.observacoes || ''
      });
    } else {
      reset({
        descricao: '',
        tipo: 'saida',
        valor: '',
        data_lancamento: format(new Date(), 'yyyy-MM-dd'),
        categoria_id: '',
        forma_pagamento_id: '',
        observacoes: ''
      });
    }
  }, [lancamento, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        descricao: data.descricao,
        tipo: data.tipo,
        valor: parseFloat(data.valor),
        data_lancamento: data.data_lancamento,
        categoria_id: data.categoria_id || null,
        forma_pagamento_id: data.forma_pagamento_id || null,
        observacoes: data.observacoes || null,
        created_by_user_id: user?.id
      };

      if (lancamento) {
        const { error } = await supabase
          .from('lancamentos_financeiros')
          .update(payload)
          .eq('id', lancamento.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lancamentos_financeiros')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      toast.success(lancamento ? 'Lançamento atualizado' : 'Lançamento criado');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Erro ao salvar lançamento');
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{lancamento ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select 
              value={watch('tipo')} 
              onValueChange={(v) => {
                setValue('tipo', v);
                setValue('categoria_id', '');
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descrição *</Label>
            <Input {...register('descricao', { required: true })} placeholder="Ex: Pagamento fornecedor" />
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
              <Label>Data *</Label>
              <Input 
                {...register('data_lancamento', { required: true })} 
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

          {/* Banner informativo para empréstimos */}
          {isEmprestimo && (
            <Alert className="border-violet-500/50 bg-violet-50 dark:bg-violet-950/30">
              <Wallet className="h-4 w-4 text-violet-600" />
              <AlertDescription className="text-sm text-violet-800 dark:text-violet-200">
                <strong>Empréstimo detectado!</strong> Este lançamento criará automaticamente uma 
                conta a receber para devolução em <strong>30 dias</strong>.
              </AlertDescription>
            </Alert>
          )}

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
