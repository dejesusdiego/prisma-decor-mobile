import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Receipt, Loader2 } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/calculosStatus';

const formSchema = z.object({
  numeroParcelas: z.number().min(1).max(24),
  dataPrimeiraParcela: z.date(),
  formaPagamentoId: z.string().optional(),
  observacoes: z.string().max(500).optional()
});

type FormData = z.infer<typeof formSchema>;

interface DialogGerarContaReceberProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamento: {
    id: string;
    codigo: string;
    cliente_nome: string;
    total_geral: number | null;
    total_com_desconto?: number | null;
  };
  onConfirm: (data: { 
    numeroParcelas: number; 
    dataPrimeiraParcela: Date;
    formaPagamentoId?: string;
    observacoes?: string;
  }) => void;
  isLoading?: boolean;
}

export function DialogGerarContaReceber({
  open,
  onOpenChange,
  orcamento,
  onConfirm,
  isLoading
}: DialogGerarContaReceberProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const valorTotal = orcamento.total_com_desconto ?? orcamento.total_geral ?? 0;

  const { data: formasPagamento } = useQuery({
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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numeroParcelas: 1,
      dataPrimeiraParcela: new Date(),
      formaPagamentoId: undefined,
      observacoes: ''
    }
  });

  const numeroParcelas = form.watch('numeroParcelas');
  const dataPrimeiraParcela = form.watch('dataPrimeiraParcela');
  const valorParcela = valorTotal / (numeroParcelas || 1);

  const handleSubmit = (data: FormData) => {
    onConfirm({
      numeroParcelas: data.numeroParcelas,
      dataPrimeiraParcela: data.dataPrimeiraParcela,
      formaPagamentoId: data.formaPagamentoId,
      observacoes: data.observacoes
    });
  };

  // Gerar preview das parcelas
  const previewParcelas = Array.from({ length: Math.min(numeroParcelas, 6) }, (_, i) => ({
    numero: i + 1,
    valor: valorParcela,
    vencimento: addMonths(dataPrimeiraParcela, i)
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Gerar Conta a Receber
          </DialogTitle>
          <DialogDescription>
            Orçamento {orcamento.codigo} - {orcamento.cliente_nome}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Valor Total */}
          <div className="bg-primary/10 p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Valor Total</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(valorTotal)}</p>
          </div>

          {/* Número de Parcelas */}
          <div className="space-y-2">
            <Label htmlFor="numeroParcelas">Número de Parcelas</Label>
            <Select
              value={String(numeroParcelas)}
              onValueChange={(value) => form.setValue('numeroParcelas', Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}x de {formatCurrency(valorTotal / n)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data da Primeira Parcela */}
          <div className="space-y-2">
            <Label>Data da Primeira Parcela</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataPrimeiraParcela && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataPrimeiraParcela 
                    ? format(dataPrimeiraParcela, "dd/MM/yyyy", { locale: ptBR })
                    : "Selecione a data"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataPrimeiraParcela}
                  onSelect={(date) => {
                    if (date) {
                      form.setValue('dataPrimeiraParcela', date);
                      setCalendarOpen(false);
                    }
                  }}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-2">
            <Label>Forma de Pagamento (opcional)</Label>
            <Select
              value={form.watch('formaPagamentoId') || ''}
              onValueChange={(value) => form.setValue('formaPagamentoId', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Não definida</SelectItem>
                {formasPagamento?.map((forma) => (
                  <SelectItem key={forma.id} value={forma.id}>
                    {forma.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea
              {...form.register('observacoes')}
              placeholder="Observações sobre o pagamento..."
              rows={2}
              maxLength={500}
            />
          </div>

          {/* Preview das Parcelas */}
          {numeroParcelas > 1 && (
            <div className="border rounded-lg p-3 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Preview das Parcelas:
              </p>
              <div className="space-y-1 text-sm">
                {previewParcelas.map((parcela) => (
                  <div key={parcela.numero} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {parcela.numero}ª parcela - {format(parcela.vencimento, "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    <span className="font-medium">{formatCurrency(parcela.valor)}</span>
                  </div>
                ))}
                {numeroParcelas > 6 && (
                  <p className="text-xs text-muted-foreground italic">
                    ... e mais {numeroParcelas - 6} parcela(s)
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Receipt className="mr-2 h-4 w-4" />
                  Gerar Conta
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
