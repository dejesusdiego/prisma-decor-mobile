import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateOnly, formatDateOnly } from '@/lib/dateOnly';
import { CalendarIcon, Upload, X, RefreshCw } from 'lucide-react';
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
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Emprestimo {
  id: string;
  descricao: string;
  valor: number;
  data_lancamento: string;
  contaReceber?: {
    id: string;
    valor_total: number;
    valor_pago: number;
    status: string;
    data_vencimento: string;
    parcelas?: Array<{
      id: string;
      valor: number;
      status: string;
    }>;
  };
}

interface DialogDevolucaoEmprestimoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emprestimo?: Emprestimo | null;
}

interface FormData {
  data_devolucao: Date;
  forma_pagamento_id: string;
  valor_devolvido: number;
}

export function DialogDevolucaoEmprestimo({
  open,
  onOpenChange,
  emprestimo,
}: DialogDevolucaoEmprestimoProps) {
  const queryClient = useQueryClient();
  const [arquivo, setArquivo] = useState<File | null>(null);

  const valorPendente = emprestimo?.contaReceber 
    ? Number(emprestimo.contaReceber.valor_total) - Number(emprestimo.contaReceber.valor_pago)
    : emprestimo?.valor || 0;

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      data_devolucao: new Date(),
      forma_pagamento_id: '',
      valor_devolvido: valorPendente,
    }
  });

  const dataDevolucao = watch('data_devolucao');

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
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const valorDevolvido = Number(data.valor_devolvido);

      // 1. Buscar a conta a receber vinculada ao empréstimo
      const { data: contaReceber, error: errConta } = await supabase
        .from('contas_receber')
        .select('*, parcelas:parcelas_receber(*)')
        .eq('lancamento_origem_id', emprestimo?.id)
        .single();

      if (errConta || !contaReceber) {
        throw new Error('Conta a receber não encontrada para este empréstimo');
      }

      // 2. Calcular novo valor pago e status
      const novoValorPago = Number(contaReceber.valor_pago) + valorDevolvido;
      const novoStatus = novoValorPago >= Number(contaReceber.valor_total) 
        ? 'pago' 
        : novoValorPago > 0 
          ? 'parcial' 
          : 'pendente';

      // 3. Atualizar conta a receber
      const { error: errUpdateConta } = await supabase
        .from('contas_receber')
        .update({
          valor_pago: novoValorPago,
          status: novoStatus,
        })
        .eq('id', contaReceber.id);

      if (errUpdateConta) throw errUpdateConta;

      // 4. Atualizar parcela (buscar a pendente)
      const parcelaPendente = contaReceber.parcelas?.find(
        (p: any) => p.status === 'pendente' || p.status === 'atrasado'
      );

      if (parcelaPendente) {
        const { error: errUpdateParcela } = await supabase
          .from('parcelas_receber')
          .update({
            status: novoStatus === 'pago' ? 'pago' : 'parcial',
            data_pagamento: format(data.data_devolucao, 'yyyy-MM-dd'),
            forma_pagamento_id: data.forma_pagamento_id || null,
          })
          .eq('id', parcelaPendente.id);

        if (errUpdateParcela) throw errUpdateParcela;
      }

      // 5. Criar lançamento de entrada (devolução)
      const { data: lancamento, error: errLanc } = await supabase
        .from('lancamentos_financeiros')
        .insert({
          tipo: 'entrada',
          descricao: `Devolução: ${emprestimo?.descricao}`,
          valor: valorDevolvido,
          data_lancamento: format(data.data_devolucao, 'yyyy-MM-dd'),
          forma_pagamento_id: data.forma_pagamento_id || null,
          parcela_receber_id: parcelaPendente?.id,
          created_by_user_id: userData.user.id,
        })
        .select()
        .single();

      if (errLanc) throw errLanc;

      // 6. Upload do comprovante (se houver)
      if (arquivo && lancamento) {
        const fileName = `${Date.now()}_${arquivo.name}`;
        const { error: errUpload } = await supabase.storage
          .from('comprovantes')
          .upload(fileName, arquivo);

        if (!errUpload) {
          const { data: publicUrl } = supabase.storage
            .from('comprovantes')
            .getPublicUrl(fileName);

          await supabase.from('comprovantes_pagamento').insert({
            lancamento_id: lancamento.id,
            parcela_receber_id: parcelaPendente?.id,
            arquivo_url: publicUrl.publicUrl,
            nome_arquivo: arquivo.name,
            tipo_arquivo: arquivo.type,
            tamanho_bytes: arquivo.size,
            uploaded_by_user_id: userData.user.id,
          });
        }
      }

      return { valorDevolvido, novoStatus };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['emprestimos-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['parcelas-receber'] });
      
      toast.success(
        result.novoStatus === 'pago' 
          ? 'Empréstimo devolvido integralmente!' 
          : `Devolução parcial de ${formatCurrency(result.valorDevolvido)} registrada`
      );
      
      reset();
      setArquivo(null);
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Erro ao registrar devolução:', error);
      toast.error(error.message || 'Erro ao registrar devolução');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 5MB.');
        return;
      }
      setArquivo(file);
    }
  };

  const onSubmit = (data: FormData) => {
    if (!emprestimo) return;
    mutation.mutate(data);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Reset form when dialog opens with new emprestimo
  useState(() => {
    if (open && emprestimo) {
      reset({
        data_devolucao: new Date(),
        forma_pagamento_id: '',
        valor_devolvido: valorPendente,
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-violet-600" />
            Registrar Devolução
          </DialogTitle>
        </DialogHeader>

        {emprestimo && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Info do empréstimo */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Empréstimo:</span>
                <span className="font-medium">{emprestimo.descricao}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Data:</span>
                <span>{formatDateOnly(emprestimo.data_lancamento)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor total:</span>
                <span className="font-medium text-violet-600">{formatCurrency(emprestimo.valor)}</span>
              </div>
              {emprestimo.contaReceber && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Já devolvido:</span>
                    <span className="text-green-600">{formatCurrency(Number(emprestimo.contaReceber.valor_pago))}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Pendente:</span>
                    <span className="text-destructive">{formatCurrency(valorPendente)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vencimento:</span>
                    <Badge variant={
                      parseDateOnly(emprestimo.contaReceber.data_vencimento)! < new Date() ? 'destructive' : 'outline'
                    }>
                      {formatDateOnly(emprestimo.contaReceber.data_vencimento)}
                    </Badge>
                  </div>
                </>
              )}
            </div>

            {/* Data da devolução */}
            <div className="space-y-2">
              <Label>Data da Devolução</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataDevolucao && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataDevolucao ? format(dataDevolucao, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataDevolucao}
                    onSelect={(date) => date && setValue('data_devolucao', date)}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Valor devolvido */}
            <div className="space-y-2">
              <Label htmlFor="valor_devolvido">Valor Devolvido</Label>
              <Input
                id="valor_devolvido"
                type="number"
                step="0.01"
                min="0.01"
                max={valorPendente}
                {...register('valor_devolvido', { 
                  required: 'Valor é obrigatório',
                  min: { value: 0.01, message: 'Valor deve ser maior que zero' },
                  max: { value: valorPendente, message: `Valor máximo é ${formatCurrency(valorPendente)}` }
                })}
              />
              {errors.valor_devolvido && (
                <p className="text-xs text-destructive">{errors.valor_devolvido.message}</p>
              )}
            </div>

            {/* Forma de pagamento */}
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
                  {formasPagamento.map((fp) => (
                    <SelectItem key={fp.id} value={fp.id}>
                      {fp.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Comprovante */}
            <div className="space-y-2">
              <Label>Comprovante (opcional)</Label>
              {arquivo ? (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <span className="text-sm truncate flex-1">{arquivo.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setArquivo(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Processando...' : 'Confirmar Devolução'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
