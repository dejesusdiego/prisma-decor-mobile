import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { Plus, FileCheck } from 'lucide-react';
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
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    descricao: '',
    valor: 0,
    data_lancamento: '',
    tipo: 'entrada',
    categoria_id: '',
    forma_pagamento_id: '',
    observacoes: ''
  });

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
    }
  }, [movimentacao]);

  // Buscar categorias
  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias-financeiras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_financeiras')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // Buscar formas de pagamento
  const { data: formasPagamento = [] } = useQuery({
    queryKey: ['formas-pagamento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formas_pagamento')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // Criar lançamento
  const criarMutation = useMutation({
    mutationFn: async () => {
      if (!movimentacao || !user) throw new Error('Dados inválidos');

      // Criar lançamento
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
          created_by_user_id: user.id
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
                <Input
                  type="date"
                  value={form.data_lancamento}
                  onChange={e => setForm(f => ({ ...f, data_lancamento: e.target.value }))}
                />
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
                <Label>Categoria</Label>
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
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>

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
