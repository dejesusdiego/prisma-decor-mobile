import { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, ArrowUpCircle, Loader2, Package, Scissors, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

interface CustoItem {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'material' | 'costura' | 'instalacao';
  selecionado: boolean;
}

interface DialogGerarCustosProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamento: {
    id: string;
    codigo: string;
    subtotal_materiais: number | null;
    subtotal_mao_obra_costura: number | null;
    subtotal_instalacao: number | null;
  };
  onConfirm: (data: { 
    custos: { descricao: string; valor: number; categoriaId?: string; fornecedor?: string }[]; 
    dataVencimento: Date;
  }) => void;
  isLoading?: boolean;
}

export function DialogGerarCustos({
  open,
  onOpenChange,
  orcamento,
  onConfirm,
  isLoading
}: DialogGerarCustosProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dataVencimento, setDataVencimento] = useState<Date>(new Date());
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('');
  
  // Gerar lista de custos baseado nos subtotais
  const [custos, setCustos] = useState<CustoItem[]>([]);

  // Sincronizar custos quando o orçamento mudar
  useEffect(() => {
    const items: CustoItem[] = [];
    
    if ((orcamento.subtotal_materiais || 0) > 0) {
      items.push({
        id: 'materiais',
        descricao: `Materiais - ${orcamento.codigo}`,
        valor: orcamento.subtotal_materiais || 0,
        tipo: 'material',
        selecionado: true
      });
    }
    
    if ((orcamento.subtotal_mao_obra_costura || 0) > 0) {
      items.push({
        id: 'costura',
        descricao: `Costura - ${orcamento.codigo}`,
        valor: orcamento.subtotal_mao_obra_costura || 0,
        tipo: 'costura',
        selecionado: true
      });
    }
    
    if ((orcamento.subtotal_instalacao || 0) > 0) {
      items.push({
        id: 'instalacao',
        descricao: `Instalação - ${orcamento.codigo}`,
        valor: orcamento.subtotal_instalacao || 0,
        tipo: 'instalacao',
        selecionado: true
      });
    }
    
    setCustos(items);
  }, [orcamento.id, orcamento.codigo, orcamento.subtotal_materiais, orcamento.subtotal_mao_obra_costura, orcamento.subtotal_instalacao]);

  const { organizationId } = useOrganizationContext();

  const { data: categorias } = useQuery({
    queryKey: ['categorias-despesa', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('categorias_financeiras')
        .select('*')
        .eq('organization_id', organizationId) // Filtrar por organização
        .eq('tipo', 'despesa')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId
  });

  const toggleCusto = (id: string) => {
    setCustos(prev => prev.map(c => 
      c.id === id ? { ...c, selecionado: !c.selecionado } : c
    ));
  };

  const custosSelecionados = custos.filter(c => c.selecionado);
  const totalSelecionado = custosSelecionados.reduce((acc, c) => acc + c.valor, 0);

  const handleSubmit = () => {
    const custosParaGerar = custosSelecionados.map(c => ({
      descricao: c.descricao,
      valor: c.valor,
      categoriaId: categoriaSelecionada || undefined
    }));

    onConfirm({
      custos: custosParaGerar,
      dataVencimento
    });
  };

  const getIconByTipo = (tipo: CustoItem['tipo']) => {
    switch (tipo) {
      case 'material':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'costura':
        return <Scissors className="h-4 w-4 text-purple-500" />;
      case 'instalacao':
        return <Wrench className="h-4 w-4 text-orange-500" />;
    }
  };

  if (custos.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Sem Custos para Registrar</DialogTitle>
            <DialogDescription>
              Este orçamento não possui custos de materiais, costura ou instalação registrados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-primary" />
            Gerar Contas a Pagar
          </DialogTitle>
          <DialogDescription>
            Registrar custos do orçamento {orcamento.codigo} como contas a pagar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lista de custos */}
          <div className="space-y-2">
            <Label>Selecione os custos a registrar:</Label>
            <div className="border rounded-lg divide-y">
              {custos.map((custo) => (
                <div 
                  key={custo.id}
                  className={cn(
                    "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                    custo.selecionado && "bg-primary/5"
                  )}
                  onClick={() => toggleCusto(custo.id)}
                >
                  <Checkbox 
                    checked={custo.selecionado}
                    onCheckedChange={() => toggleCusto(custo.id)}
                  />
                  <div className="flex-1 flex items-center gap-2">
                    {getIconByTipo(custo.tipo)}
                    <span className="text-sm">{custo.descricao}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(custo.valor)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-muted/50 p-3 rounded-lg flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Total ({custosSelecionados.length} item(s))
            </span>
            <span className="text-lg font-bold">{formatCurrency(totalSelecionado)}</span>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria (opcional)</Label>
            <Select
              value={categoriaSelecionada}
              onValueChange={setCategoriaSelecionada}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sem categoria</SelectItem>
                {categorias?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data de Vencimento */}
          <div className="space-y-2">
            <Label>Data de Vencimento</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataVencimento && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataVencimento 
                    ? format(dataVencimento, "dd/MM/yyyy", { locale: ptBR })
                    : "Selecione a data"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataVencimento}
                  onSelect={(date) => {
                    if (date) {
                      setDataVencimento(date);
                      setCalendarOpen(false);
                    }
                  }}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || custosSelecionados.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <ArrowUpCircle className="mr-2 h-4 w-4" />
                Gerar {custosSelecionados.length} Conta(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
