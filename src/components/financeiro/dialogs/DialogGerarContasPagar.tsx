import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { addDays, format } from 'date-fns';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Package, Scissors, Wrench, Building2 } from 'lucide-react';

interface CustosOrcamento {
  subtotal_materiais: number;
  subtotal_mao_obra_costura: number;
  subtotal_instalacao: number;
  custo_total: number;
}

interface DialogGerarContasPagarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamento: {
    id: string;
    codigo: string;
    cliente_nome: string;
    subtotal_materiais?: number;
    subtotal_mao_obra_costura?: number;
    subtotal_instalacao?: number;
    custo_total?: number;
  } | null;
  onSuccess: () => void;
}

interface ContaItem {
  tipo: 'materiais' | 'costura' | 'instalacao';
  descricao: string;
  valor: number;
  fornecedor: string;
  categoria_id: string;
  data_vencimento: string;
  selecionada: boolean;
  icone: React.ReactNode;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function DialogGerarContasPagar({ 
  open, 
  onOpenChange, 
  orcamento,
  onSuccess
}: DialogGerarContasPagarProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [contasParaGerar, setContasParaGerar] = useState<ContaItem[]>([]);

  // Buscar categorias de despesa
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

  // Inicializar contas quando o dialog abrir
  useEffect(() => {
    if (open && orcamento) {
      const hoje = new Date();
      const dataVencimentoPadrao = format(addDays(hoje, 30), 'yyyy-MM-dd');
      
      const novasContas: ContaItem[] = [];
      
      // Materiais
      if ((orcamento.subtotal_materiais || 0) > 0) {
        novasContas.push({
          tipo: 'materiais',
          descricao: `Materiais - ${orcamento.codigo}`,
          valor: orcamento.subtotal_materiais || 0,
          fornecedor: '',
          categoria_id: '',
          data_vencimento: dataVencimentoPadrao,
          selecionada: true,
          icone: <Package className="h-4 w-4" />
        });
      }
      
      // Mão de obra de costura
      if ((orcamento.subtotal_mao_obra_costura || 0) > 0) {
        novasContas.push({
          tipo: 'costura',
          descricao: `Costura - ${orcamento.codigo}`,
          valor: orcamento.subtotal_mao_obra_costura || 0,
          fornecedor: '',
          categoria_id: '',
          data_vencimento: dataVencimentoPadrao,
          selecionada: true,
          icone: <Scissors className="h-4 w-4" />
        });
      }
      
      // Instalação
      if ((orcamento.subtotal_instalacao || 0) > 0) {
        novasContas.push({
          tipo: 'instalacao',
          descricao: `Instalação - ${orcamento.codigo}`,
          valor: orcamento.subtotal_instalacao || 0,
          fornecedor: '',
          categoria_id: '',
          data_vencimento: dataVencimentoPadrao,
          selecionada: true,
          icone: <Wrench className="h-4 w-4" />
        });
      }
      
      setContasParaGerar(novasContas);
    }
  }, [open, orcamento]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!orcamento || !user) throw new Error('Dados inválidos');
      
      const contasSelecionadas = contasParaGerar.filter(c => c.selecionada);
      
      if (contasSelecionadas.length === 0) {
        throw new Error('Selecione pelo menos uma conta');
      }

      // Criar contas a pagar
      const contasParaInserir = contasSelecionadas.map(conta => ({
        descricao: conta.descricao,
        valor: conta.valor,
        fornecedor: conta.fornecedor || null,
        categoria_id: conta.categoria_id || null,
        data_vencimento: conta.data_vencimento,
        status: 'pendente',
        created_by_user_id: user.id,
        recorrente: false
      }));

      const { error } = await supabase
        .from('contas_pagar')
        .insert(contasParaInserir);
      
      if (error) throw error;
      
      return contasSelecionadas.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      toast.success(`${count} conta(s) a pagar criada(s) com sucesso!`);
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error.message || 'Erro ao criar contas a pagar');
    }
  });

  const toggleConta = (index: number) => {
    setContasParaGerar(prev => prev.map((c, i) => 
      i === index ? { ...c, selecionada: !c.selecionada } : c
    ));
  };

  const atualizarConta = (index: number, campo: keyof ContaItem, valor: any) => {
    setContasParaGerar(prev => prev.map((c, i) => 
      i === index ? { ...c, [campo]: valor } : c
    ));
  };

  const totalSelecionado = contasParaGerar
    .filter(c => c.selecionada)
    .reduce((acc, c) => acc + c.valor, 0);

  if (!orcamento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Gerar Contas a Pagar
          </DialogTitle>
          <DialogDescription>
            Configure as contas a pagar para os custos do orçamento {orcamento.codigo}
          </DialogDescription>
        </DialogHeader>

        {/* Resumo de custos */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Materiais</p>
              <p className="font-semibold">{formatCurrency(orcamento.subtotal_materiais || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Costura</p>
              <p className="font-semibold">{formatCurrency(orcamento.subtotal_mao_obra_costura || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Instalação</p>
              <p className="font-semibold">{formatCurrency(orcamento.subtotal_instalacao || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Custo Total</p>
              <p className="font-bold text-primary">{formatCurrency(orcamento.custo_total || 0)}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Lista de contas */}
        <div className="space-y-4">
          <h4 className="font-medium">Contas a Gerar</h4>
          
          {contasParaGerar.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              Não há custos registrados neste orçamento para gerar contas a pagar.
            </div>
          ) : (
            contasParaGerar.map((conta, index) => (
              <div 
                key={index} 
                className={`border rounded-lg p-4 space-y-3 transition-opacity ${
                  conta.selecionada ? 'opacity-100' : 'opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={conta.selecionada}
                      onCheckedChange={() => toggleConta(index)}
                    />
                    <div className="flex items-center gap-2">
                      {conta.icone}
                      <span className="font-medium">{conta.descricao}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-base">
                    {formatCurrency(conta.valor)}
                  </Badge>
                </div>

                {conta.selecionada && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Fornecedor</Label>
                      <Input
                        placeholder="Nome do fornecedor..."
                        value={conta.fornecedor}
                        onChange={(e) => atualizarConta(index, 'fornecedor', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Categoria</Label>
                      <Select 
                        value={conta.categoria_id} 
                        onValueChange={(v) => atualizarConta(index, 'categoria_id', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Vencimento</Label>
                      <Input
                        type="date"
                        value={conta.data_vencimento}
                        onChange={(e) => atualizarConta(index, 'data_vencimento', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <Separator />

        {/* Rodapé */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {contasParaGerar.filter(c => c.selecionada).length} conta(s) selecionada(s)
            <span className="ml-2 font-semibold text-foreground">
              Total: {formatCurrency(totalSelecionado)}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => mutation.mutate()} 
              disabled={mutation.isPending || contasParaGerar.filter(c => c.selecionada).length === 0}
            >
              {mutation.isPending ? 'Gerando...' : 'Gerar Contas a Pagar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
