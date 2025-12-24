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
  DialogDescription,
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
import { DollarSign, Percent } from 'lucide-react';
import { VendedorAutocomplete } from '../VendedorAutocomplete';

interface DialogComissaoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comissao?: any;
}

interface FormData {
  vendedor_nome: string;
  orcamento_id: string;
  percentual: number;
  valor_base: number;
  valor_comissao: number;
  observacoes: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function DialogComissao({ open, onOpenChange, comissao }: DialogComissaoProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      vendedor_nome: '',
      orcamento_id: '',
      percentual: 5,
      valor_base: 0,
      valor_comissao: 0,
      observacoes: ''
    }
  });

  const percentual = watch('percentual');
  const valorBase = watch('valor_base');
  const orcamentoId = watch('orcamento_id');

  // Buscar orçamentos aprovados/pagos para vincular
  const { data: orcamentos = [] } = useQuery({
    queryKey: ['orcamentos-para-comissao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('id, codigo, cliente_nome, total_geral, status')
        .in('status', ['aprovado', 'pago', 'pago_40', 'pago_parcial', 'pago_60', 'em_producao', 'instalado'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Preencher dados quando editar ou selecionar orçamento
  useEffect(() => {
    if (comissao) {
      reset({
        vendedor_nome: comissao.vendedor_nome || '',
        orcamento_id: comissao.orcamento_id || '',
        percentual: comissao.percentual || 5,
        valor_base: comissao.valor_base || 0,
        valor_comissao: comissao.valor_comissao || 0,
        observacoes: comissao.observacoes || ''
      });
    } else {
      reset({
        vendedor_nome: '',
        orcamento_id: '',
        percentual: 5,
        valor_base: 0,
        valor_comissao: 0,
        observacoes: ''
      });
    }
  }, [comissao, open, reset]);

  // Atualizar valor base quando selecionar orçamento
  useEffect(() => {
    if (orcamentoId && !comissao) {
      const orcamento = orcamentos.find(o => o.id === orcamentoId);
      if (orcamento) {
        setValue('valor_base', orcamento.total_geral || 0);
      }
    }
  }, [orcamentoId, orcamentos, setValue, comissao]);

  // Calcular comissão automaticamente
  useEffect(() => {
    const comissaoCalculada = (valorBase * percentual) / 100;
    setValue('valor_comissao', comissaoCalculada);
  }, [valorBase, percentual, setValue]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!user) throw new Error('Usuário não autenticado');

      const payload = {
        vendedor_nome: data.vendedor_nome,
        orcamento_id: data.orcamento_id || null,
        percentual: data.percentual,
        valor_base: data.valor_base,
        valor_comissao: data.valor_comissao,
        observacoes: data.observacoes || null,
        created_by_user_id: user.id
      };

      if (comissao) {
        const { error } = await supabase
          .from('comissoes')
          .update(payload)
          .eq('id', comissao.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('comissoes')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      toast.success(comissao ? 'Comissão atualizada!' : 'Comissão criada!');
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error(error);
      toast.error('Erro ao salvar comissão');
    }
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const orcamentoSelecionado = orcamentos.find(o => o.id === orcamentoId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {comissao ? 'Editar Comissão' : 'Nova Comissão'}
          </DialogTitle>
          <DialogDescription>
            {comissao ? 'Atualize os dados da comissão' : 'Registre uma nova comissão de vendedor'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <VendedorAutocomplete
            value={watch('vendedor_nome')}
            onChange={(v) => setValue('vendedor_nome', v)}
            label="Nome do Vendedor"
            placeholder="Digite ou selecione o vendedor..."
          />
          {errors.vendedor_nome && (
            <p className="text-xs text-destructive">Campo obrigatório</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="orcamento_id">Orçamento (opcional)</Label>
            <Select
              value={orcamentoId}
              onValueChange={(v) => setValue('orcamento_id', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um orçamento..." />
              </SelectTrigger>
              <SelectContent>
                {orcamentos.map((orc) => (
                  <SelectItem key={orc.id} value={orc.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{orc.codigo}</span>
                      <span className="text-muted-foreground">-</span>
                      <span>{orc.cliente_nome}</span>
                      <span className="text-muted-foreground">
                        ({formatCurrency(orc.total_geral || 0)})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {orcamentoSelecionado && (
              <p className="text-xs text-muted-foreground">
                Cliente: {orcamentoSelecionado.cliente_nome} | Status: {orcamentoSelecionado.status}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_base">Valor Base *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="valor_base"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-10"
                  {...register('valor_base', { required: true, valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="percentual">Percentual *</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="percentual"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  className="pl-10"
                  {...register('percentual', { required: true, valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Valor da Comissão</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(watch('valor_comissao') || 0)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(valorBase || 0)} × {percentual || 0}% = {formatCurrency(watch('valor_comissao') || 0)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações adicionais..."
              {...register('observacoes')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : comissao ? 'Atualizar' : 'Criar Comissão'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}