import { useEffect, useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { RefreshCw, Calendar, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogContaPagarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta?: any;
}

const FREQUENCIAS = [
  { value: 'semanal', label: 'Semanal', icon: '7d', description: 'A cada 7 dias' },
  { value: 'quinzenal', label: 'Quinzenal', icon: '15d', description: 'A cada 15 dias' },
  { value: 'mensal', label: 'Mensal', icon: '1m', description: 'Todo mês' },
  { value: 'bimestral', label: 'Bimestral', icon: '2m', description: 'A cada 2 meses' },
  { value: 'trimestral', label: 'Trimestral', icon: '3m', description: 'A cada 3 meses' },
  { value: 'semestral', label: 'Semestral', icon: '6m', description: 'A cada 6 meses' },
  { value: 'anual', label: 'Anual', icon: '1a', description: 'Todo ano' },
];

export function DialogContaPagar({ open, onOpenChange, conta }: DialogContaPagarProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [recorrente, setRecorrente] = useState(false);
  const [frequencia, setFrequencia] = useState('mensal');
  
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
      setRecorrente(conta.recorrente || false);
      setFrequencia(conta.frequencia_recorrencia || 'mensal');
    } else {
      reset({
        descricao: '',
        fornecedor: '',
        valor: '',
        data_vencimento: '',
        categoria_id: '',
        observacoes: ''
      });
      setRecorrente(false);
      setFrequencia('mensal');
    }
  }, [conta, reset, open]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        descricao: data.descricao,
        fornecedor: data.fornecedor || null,
        valor: parseFloat(data.valor),
        data_vencimento: data.data_vencimento,
        categoria_id: data.categoria_id || null,
        observacoes: data.observacoes || null,
        recorrente,
        frequencia_recorrencia: recorrente ? frequencia : null,
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
      // Invalidação cruzada completa
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['contas-pagar-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['contas-pagar-previsao'] }); // Fluxo previsto
      queryClient.invalidateQueries({ queryKey: ['contas-recorrentes-previsao'] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos-financeiros'] }); // Dashboard
      queryClient.invalidateQueries({ queryKey: ['saldo-atual-caixa'] });
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
      <DialogContent className="max-w-lg">
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

          {/* Seção de Recorrência */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="recorrente" className="font-medium cursor-pointer">
                  Conta Recorrente
                </Label>
              </div>
              <Switch
                id="recorrente"
                checked={recorrente}
                onCheckedChange={setRecorrente}
              />
            </div>
            
            {recorrente && (
              <div className="space-y-3 pt-2">
                <Label className="text-sm text-muted-foreground">Frequência de repetição</Label>
                <div className="grid grid-cols-4 gap-2">
                  {FREQUENCIAS.slice(0, 4).map((freq) => (
                    <button
                      key={freq.value}
                      type="button"
                      onClick={() => setFrequencia(freq.value)}
                      className={cn(
                        "flex flex-col items-center p-3 rounded-lg border-2 transition-all",
                        frequencia === freq.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50 hover:bg-muted"
                      )}
                    >
                      <span className="text-xs font-bold">{freq.icon}</span>
                      <span className="text-xs mt-1">{freq.label}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {FREQUENCIAS.slice(4).map((freq) => (
                    <button
                      key={freq.value}
                      type="button"
                      onClick={() => setFrequencia(freq.value)}
                      className={cn(
                        "flex flex-col items-center p-3 rounded-lg border-2 transition-all",
                        frequencia === freq.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50 hover:bg-muted"
                      )}
                    >
                      <span className="text-xs font-bold">{freq.icon}</span>
                      <span className="text-xs mt-1">{freq.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Novas contas serão geradas automaticamente no dia 25 de cada mês
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea {...register('observacoes')} rows={2} />
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