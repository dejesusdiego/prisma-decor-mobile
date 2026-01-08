import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useSugestaoCategoria } from '@/hooks/useSugestaoCategoria';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Plus, FileCheck, CalendarIcon, Sparkles, CheckCircle2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

interface MovimentacaoParaLancamento {
  id: string;
  descricao: string;
  valor: number;
  data_movimentacao: string;
  tipo: string;
}

interface DialogCriarLancamentoDeExtratoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movimentacao: MovimentacaoParaLancamento | null;
}

export function DialogCriarLancamentoDeExtrato({
  open,
  onOpenChange,
  movimentacao
}: DialogCriarLancamentoDeExtratoProps) {
  const { user } = useAuth();
  const { organizationId } = useOrganizationContext();
  const queryClient = useQueryClient();
  const [sugestaoAplicada, setSugestaoAplicada] = useState(false);

  const [form, setForm] = useState({
    descricao: '',
    valor: 0,
    data_lancamento: '',
    tipo: 'entrada',
    categoria_id: '',
    forma_pagamento_id: '',
    observacoes: ''
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Buscar sugestão de categoria baseada no histórico
  const tipoMovimento = movimentacao?.tipo === 'credito' ? 'credito' : 'debito';
  const { data: sugestaoCategoria } = useSugestaoCategoria(
    movimentacao?.descricao || '', 
    tipoMovimento as 'credito' | 'debito'
  );

  // Preencher form quando movimentacao mudar
  useEffect(() => {
    if (movimentacao) {
      setForm({
        descricao: movimentacao.descricao,
        valor: movimentacao.valor,
        data_lancamento: movimentacao.data_movimentacao,
        tipo: movimentacao.tipo === 'credito' ? 'entrada' : 'saida',
        categoria_id: '',
        forma_pagamento_id: '',
        observacoes: ''
      });
      if (movimentacao.data_movimentacao) {
        setSelectedDate(parseISO(movimentacao.data_movimentacao));
      }
      setSugestaoAplicada(false);
    }
  }, [movimentacao]);

  // Aplicar sugestão automaticamente se confiança alta
  useEffect(() => {
    if (sugestaoCategoria && sugestaoCategoria.confianca >= 70 && !sugestaoAplicada && !form.categoria_id) {
      setForm(f => ({ ...f, categoria_id: sugestaoCategoria.categoriaId }));
      setSugestaoAplicada(true);
    }
  }, [sugestaoCategoria, sugestaoAplicada, form.categoria_id]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setForm(f => ({ ...f, data_lancamento: format(date, 'yyyy-MM-dd') }));
    }
    setDatePickerOpen(false);
  };

  // Buscar categorias - filtrado por organização
  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias-financeiras', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_financeiras')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data;
    },
    enabled: open && !!organizationId
  });

  // Buscar formas de pagamento - filtrado por organização
  const { data: formasPagamento = [] } = useQuery({
    queryKey: ['formas-pagamento', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formas_pagamento')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data;
    },
    enabled: open && !!organizationId
  });

  // Criar lançamento
  const criarMutation = useMutation({
    mutationFn: async () => {
      if (!movimentacao || !user || !organizationId) throw new Error('Dados inválidos');

      // Criar lançamento - com organization_id
      const { data: lancamento, error: lancError } = await supabase
        .from('lancamentos_financeiros')
        .insert({
          descricao: form.descricao,
          valor: form.valor,
          data_lancamento: form.data_lancamento,
          tipo: form.tipo,
          categoria_id: form.categoria_id || null,
          forma_pagamento_id: form.forma_pagamento_id || null,
          observacoes: form.observacoes || null,
          created_by_user_id: user.id,
          organization_id: organizationId
        })
        .select('id')
        .single();

      if (lancError) throw lancError;

      // Vincular movimentação ao lançamento
      const { error: movError } = await supabase
        .from('movimentacoes_extrato')
        .update({
          lancamento_id: lancamento.id,
          conciliado: true
        })
        .eq('id', movimentacao.id);

      if (movError) throw movError;

      return lancamento;
    },
    onSuccess: () => {
      toast.success('Lançamento criado e movimentação conciliada');
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-extrato'] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos-financeiros'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar lançamento: ' + error.message);
    }
  });

  if (!movimentacao) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Criar Lançamento
          </DialogTitle>
          <DialogDescription>
            Criar lançamento a partir da movimentação do extrato
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info da movimentação */}
          <div className="p-3 bg-muted rounded-md text-sm">
            <p className="font-medium">{movimentacao.descricao}</p>
            <p className="text-muted-foreground">
              {format(new Date(movimentacao.data_movimentacao), "dd/MM/yyyy")} • {formatCurrency(movimentacao.valor)}
            </p>
          </div>

          <div className="grid gap-3">
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Input
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.valor}
                  onChange={e => setForm(f => ({ ...f, valor: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Data</Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-1">
                  Categoria
                  {sugestaoCategoria && form.categoria_id === sugestaoCategoria.categoriaId && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 gap-0.5">
                      <Sparkles className="h-2.5 w-2.5" />
                      Sugerida
                    </Badge>
                  )}
                </Label>
                <Select 
                  value={form.categoria_id} 
                  onValueChange={v => setForm(f => ({ ...f, categoria_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias
                      .filter(c => c.tipo === form.tipo)
                      .map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="flex items-center gap-2">
                            {c.nome}
                            {sugestaoCategoria && c.id === sugestaoCategoria.categoriaId && (
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            )}
                          </span>
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mostrar sugestão se não aplicada automaticamente */}
            {sugestaoCategoria && !form.categoria_id && (
              <div 
                className="p-2 bg-primary/5 border border-primary/20 rounded-md flex items-center justify-between cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => setForm(f => ({ ...f, categoria_id: sugestaoCategoria.categoriaId }))}
              >
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>
                    Sugestão: <strong>{sugestaoCategoria.categoriaNome}</strong>
                    <span className="text-muted-foreground ml-1">
                      ({sugestaoCategoria.confianca}% • {sugestaoCategoria.baseadoEm})
                    </span>
                  </span>
                </div>
                <Button size="sm" variant="ghost" className="h-6 text-xs">
                  Usar
                </Button>
              </div>
            )}

            <div className="space-y-1">
              <Label>Forma de Pagamento</Label>
              <Select 
                value={form.forma_pagamento_id} 
                onValueChange={v => setForm(f => ({ ...f, forma_pagamento_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {formasPagamento.map(fp => (
                    <SelectItem key={fp.id} value={fp.id}>{fp.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Observações</Label>
              <Textarea
                value={form.observacoes}
                onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                placeholder="Observações opcionais..."
                rows={2}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => criarMutation.mutate()} 
            disabled={criarMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Lançamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
