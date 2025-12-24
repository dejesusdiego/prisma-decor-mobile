import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
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
import { CalendarIcon, Package } from 'lucide-react';
import { useProducaoData, Pedido, TURNO_LABELS } from '@/hooks/useProducaoData';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DialogAgendarInstalacaoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidosDisponiveis: Pedido[];
  dataSugerida?: Date | null;
  pedidoPreSelecionado?: string;
}

export function DialogAgendarInstalacao({ 
  open, 
  onOpenChange, 
  pedidosDisponiveis,
  dataSugerida,
  pedidoPreSelecionado
}: DialogAgendarInstalacaoProps) {
  const { user } = useAuth();
  const { criarInstalacao } = useProducaoData();
  
  const [pedidoId, setPedidoId] = useState<string>('');
  const [data, setData] = useState<Date | undefined>(dataSugerida || undefined);
  const [turno, setTurno] = useState<'manha' | 'tarde' | 'dia_todo'>('manha');
  const [instalador, setInstalador] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Atualizar endereço quando selecionar pedido
  useEffect(() => {
    if (pedidoId) {
      const pedido = pedidosDisponiveis.find(p => p.id === pedidoId);
      if (pedido?.orcamento) {
        setEndereco(pedido.orcamento.endereco || '');
        setCidade(pedido.orcamento.cidade || '');
      }
    }
  }, [pedidoId, pedidosDisponiveis]);

  // Pré-selecionar pedido e data se fornecidos
  useEffect(() => {
    if (pedidoPreSelecionado) {
      setPedidoId(pedidoPreSelecionado);
    }
    if (dataSugerida) {
      setData(dataSugerida);
    }
  }, [pedidoPreSelecionado, dataSugerida, open]);

  const handleSubmit = async () => {
    if (!pedidoId || !data || !endereco || !user) return;

    setIsSubmitting(true);
    try {
      criarInstalacao({
        pedido_id: pedidoId,
        data_agendada: format(data, 'yyyy-MM-dd'),
        turno,
        instalador: instalador || null,
        status: 'agendada',
        endereco,
        cidade: cidade || null,
        observacoes: observacoes || null,
        data_realizada: null,
        created_by_user_id: user.id,
      });
      
      // Reset form
      setPedidoId('');
      setData(undefined);
      setTurno('manha');
      setInstalador('');
      setEndereco('');
      setCidade('');
      setObservacoes('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pedidoSelecionado = pedidosDisponiveis.find(p => p.id === pedidoId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Agendar Instalação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Seleção de Pedido */}
          <div className="space-y-2">
            <Label>Pedido</Label>
            {pedidosDisponiveis.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3 border rounded-lg bg-muted/50">
                <Package className="h-4 w-4 inline mr-2" />
                Nenhum pedido pronto para instalação
              </div>
            ) : (
              <Select value={pedidoId} onValueChange={setPedidoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o pedido" />
                </SelectTrigger>
                <SelectContent>
                  {pedidosDisponiveis.map(pedido => (
                    <SelectItem key={pedido.id} value={pedido.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{pedido.numero_pedido}</span>
                        <span className="text-muted-foreground">-</span>
                        <span className="text-sm truncate max-w-[200px]">
                          {pedido.orcamento?.cliente_nome}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Info do Cliente */}
          {pedidoSelecionado && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="font-medium">{pedidoSelecionado.orcamento?.cliente_nome}</p>
              <p className="text-muted-foreground">{pedidoSelecionado.orcamento?.cliente_telefone}</p>
              <p className="text-muted-foreground">{pedidoSelecionado.itens_pedido?.length || 0} item(s)</p>
            </div>
          )}

          {/* Data */}
          <div className="space-y-2">
            <Label>Data da Instalação</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !data && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data ? format(data, "PPP", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data}
                  onSelect={setData}
                  disabled={(date) => date < new Date()}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Turno */}
          <div className="space-y-2">
            <Label>Turno</Label>
            <Select value={turno} onValueChange={(v) => setTurno(v as typeof turno)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TURNO_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Instalador */}
          <div className="space-y-2">
            <Label>Instalador (opcional)</Label>
            <Input
              value={instalador}
              onChange={(e) => setInstalador(e.target.value)}
              placeholder="Nome do instalador"
            />
          </div>

          {/* Endereço */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Endereço</Label>
              <Input
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Endereço completo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Cidade"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Instruções especiais, pontos de referência, etc."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!pedidoId || !data || !endereco || isSubmitting}
          >
            {isSubmitting ? 'Agendando...' : 'Agendar Instalação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
