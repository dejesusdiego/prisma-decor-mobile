import { useState } from 'react';
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
import { Copy } from 'lucide-react';

interface DialogDuplicarOrcamentoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codigoOriginal: string;
  clienteNomeOriginal: string;
  onConfirmar: (novoClienteNome: string) => void;
  isLoading?: boolean;
}

export function DialogDuplicarOrcamento({
  open,
  onOpenChange,
  codigoOriginal,
  clienteNomeOriginal,
  onConfirmar,
  isLoading,
}: DialogDuplicarOrcamentoProps) {
  const [novoClienteNome, setNovoClienteNome] = useState(clienteNomeOriginal);

  const handleConfirmar = () => {
    onConfirmar(novoClienteNome);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplicar Orçamento
          </DialogTitle>
          <DialogDescription>
            Será criada uma cópia do orçamento <strong>{codigoOriginal}</strong> com todos os produtos.
            O novo orçamento terá status "Rascunho".
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cliente">Nome do Cliente</Label>
            <Input
              id="cliente"
              value={novoClienteNome}
              onChange={(e) => setNovoClienteNome(e.target.value)}
              placeholder="Nome do cliente"
            />
            <p className="text-xs text-muted-foreground">
              Você pode manter o mesmo cliente ou alterar para um novo.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={isLoading || !novoClienteNome.trim()}>
            {isLoading ? 'Duplicando...' : 'Duplicar Orçamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
