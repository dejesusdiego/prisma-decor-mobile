import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Copy, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertaDuplicado, AlertaParcial } from '../utils/aplicarRegras';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

type TipoAlerta = 'duplicado' | 'parcial';

interface DialogConfirmarConciliacaoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alerta: AlertaDuplicado | AlertaParcial | null;
  onConfirm: (decisao: string, movimentacaoId?: string) => void;
  isLoading?: boolean;
}

export function DialogConfirmarConciliacao({
  open,
  onOpenChange,
  alerta,
  onConfirm,
  isLoading
}: DialogConfirmarConciliacaoProps) {
  const [decisao, setDecisao] = useState<string>('');

  if (!alerta) return null;

  const handleConfirm = () => {
    if (alerta.tipo === 'duplicado') {
      // decisao pode ser 'primeiro', 'segundo', 'ambos', 'ignorar'
      const movId = decisao === 'primeiro' 
        ? alerta.movimentacoes[0]?.id 
        : decisao === 'segundo' 
          ? alerta.movimentacoes[1]?.id 
          : undefined;
      onConfirm(decisao, movId);
    } else {
      // decisao pode ser 'registrar_parcial', 'ignorar', 'erro_bancario'
      onConfirm(decisao, alerta.movimentacao.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {alerta.tipo === 'duplicado' ? 'Possível Pagamento Duplicado' : 'Possível Pagamento Parcial'}
          </DialogTitle>
          <DialogDescription>
            {alerta.mensagem}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {alerta.tipo === 'duplicado' && (
            <>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm font-medium text-red-800 mb-2">
                  Encontramos {alerta.movimentacoes.length} movimentações de {formatCurrency(alerta.valor)}:
                </p>
                <div className="space-y-1">
                  {alerta.movimentacoes.map((mov, idx) => (
                    <div key={mov.id} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">{idx + 1}</Badge>
                      <span>{mov.data}</span>
                      <span className="text-muted-foreground truncate flex-1">{mov.descricao}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <RadioGroup value={decisao} onValueChange={setDecisao}>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="primeiro" id="primeiro" />
                  <Label htmlFor="primeiro" className="text-sm cursor-pointer">
                    Conciliar apenas a primeira
                  </Label>
                </div>
                {alerta.movimentacoes.length > 1 && (
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="segundo" id="segundo" />
                    <Label htmlFor="segundo" className="text-sm cursor-pointer">
                      Conciliar apenas a segunda
                    </Label>
                  </div>
                )}
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="ambos" id="ambos" />
                  <Label htmlFor="ambos" className="text-sm cursor-pointer">
                    Ambas são válidas (cliente pagou múltiplas parcelas)
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="ignorar" id="ignorar" />
                  <Label htmlFor="ignorar" className="text-sm cursor-pointer text-muted-foreground">
                    Ignorar - revisarei manualmente depois
                  </Label>
                </div>
              </RadioGroup>
            </>
          )}

          {alerta.tipo === 'parcial' && (
            <>
              <div className="p-3 bg-amber-50 rounded-lg">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Movimentação</p>
                    <p className="font-bold text-green-600">{formatCurrency(alerta.movimentacao.valor)}</p>
                    <p className="text-xs">{alerta.movimentacao.data}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Parcela esperada</p>
                    <p className="font-bold">{formatCurrency(alerta.parcela.valor)}</p>
                    <p className="text-xs">{alerta.parcela.cliente_nome}</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-amber-200">
                  <p className="text-sm text-amber-800">
                    <span className="font-medium">Diferença:</span> {formatCurrency(alerta.diferenca)} ({alerta.percentual.toFixed(0)}% do valor)
                  </p>
                </div>
              </div>

              <Separator />

              <RadioGroup value={decisao} onValueChange={setDecisao}>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="registrar_parcial" id="registrar_parcial" />
                  <Label htmlFor="registrar_parcial" className="text-sm cursor-pointer">
                    Registrar como pagamento parcial
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="ignorar" id="ignorar_parcial" />
                  <Label htmlFor="ignorar_parcial" className="text-sm cursor-pointer text-muted-foreground">
                    Ignorar - não é este cliente
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="erro_bancario" id="erro_bancario" />
                  <Label htmlFor="erro_bancario" className="text-sm cursor-pointer text-muted-foreground">
                    Marcar como erro bancário
                  </Label>
                </div>
              </RadioGroup>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!decisao || isLoading}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {isLoading ? 'Processando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
