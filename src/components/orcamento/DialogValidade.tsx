import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DialogValidadeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: (validadeDias: number) => void;
  validadeAtual?: number;
}

export function DialogValidade({
  open,
  onOpenChange,
  onConfirmar,
  validadeAtual,
}: DialogValidadeProps) {
  const [validadeDias, setValidadeDias] = useState(validadeAtual || 7);

  const handleConfirmar = () => {
    onConfirmar(validadeDias);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Validade do Orçamento</DialogTitle>
          <DialogDescription>
            Defina por quantos dias este orçamento será válido.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="validade" className="text-right">
              Dias
            </Label>
            <Input
              id="validade"
              type="number"
              min="1"
              max="365"
              value={validadeDias}
              onChange={(e) => setValidadeDias(parseInt(e.target.value) || 7)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
