import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Percent, DollarSign, Tag } from 'lucide-react';

interface DescontoSectionProps {
  descontoTipo: 'percentual' | 'valor_fixo' | null;
  descontoValor: number;
  totalGeral: number;
  onDescontoChange: (tipo: 'percentual' | 'valor_fixo' | null, valor: number) => void;
}

export function DescontoSection({
  descontoTipo,
  descontoValor,
  totalGeral,
  onDescontoChange,
}: DescontoSectionProps) {
  const [descontoAtivo, setDescontoAtivo] = useState(descontoTipo !== null);

  const handleToggleDesconto = (ativo: boolean) => {
    setDescontoAtivo(ativo);
    if (ativo) {
      onDescontoChange('percentual', 0);
    } else {
      onDescontoChange(null, 0);
    }
  };

  const calcularValorDesconto = (): number => {
    if (!descontoTipo || descontoValor <= 0) return 0;
    
    if (descontoTipo === 'percentual') {
      return (totalGeral * descontoValor) / 100;
    }
    return Math.min(descontoValor, totalGeral);
  };

  const calcularTotalComDesconto = (): number => {
    return totalGeral - calcularValorDesconto();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const valorDescontoCalculado = calcularValorDesconto();
  const totalComDesconto = calcularTotalComDesconto();

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Desconto</h3>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="desconto-toggle" className="text-sm text-muted-foreground">
            Aplicar desconto
          </Label>
          <Switch
            id="desconto-toggle"
            checked={descontoAtivo}
            onCheckedChange={handleToggleDesconto}
          />
        </div>
      </div>

      {descontoAtivo && (
        <div className="space-y-4 pt-2">
          <RadioGroup
            value={descontoTipo || 'percentual'}
            onValueChange={(value) => onDescontoChange(value as 'percentual' | 'valor_fixo', descontoValor)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="percentual" id="desc-percentual" />
              <Label htmlFor="desc-percentual" className="flex items-center gap-1 cursor-pointer">
                <Percent className="h-3 w-3" />
                Percentual
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="valor_fixo" id="desc-valor" />
              <Label htmlFor="desc-valor" className="flex items-center gap-1 cursor-pointer">
                <DollarSign className="h-3 w-3" />
                Valor Fixo
              </Label>
            </div>
          </RadioGroup>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label htmlFor="desconto-valor" className="text-sm">
                {descontoTipo === 'percentual' ? 'Desconto (%)' : 'Desconto (R$)'}
              </Label>
              <div className="relative">
                <Input
                  id="desconto-valor"
                  type="number"
                  min="0"
                  max={descontoTipo === 'percentual' ? 100 : totalGeral}
                  step={descontoTipo === 'percentual' ? 0.5 : 1}
                  value={descontoValor || ''}
                  onChange={(e) => onDescontoChange(descontoTipo!, parseFloat(e.target.value) || 0)}
                  className="pr-8"
                  placeholder={descontoTipo === 'percentual' ? '0' : '0,00'}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {descontoTipo === 'percentual' ? '%' : 'R$'}
                </span>
              </div>
            </div>

            {descontoValor > 0 && (
              <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-2 rounded-lg text-sm">
                <p className="text-xs text-green-600 dark:text-green-400">Valor do desconto</p>
                <p className="font-bold">- {formatCurrency(valorDescontoCalculado)}</p>
              </div>
            )}
          </div>

          {descontoValor > 0 && (
            <div className="bg-primary/10 rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Subtotal</p>
                <p className="line-through text-muted-foreground">{formatCurrency(totalGeral)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total com Desconto</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(totalComDesconto)}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function calcularDesconto(
  totalGeral: number,
  descontoTipo: 'percentual' | 'valor_fixo' | null,
  descontoValor: number
): { valorDesconto: number; totalComDesconto: number } {
  if (!descontoTipo || descontoValor <= 0) {
    return { valorDesconto: 0, totalComDesconto: totalGeral };
  }

  const valorDesconto = descontoTipo === 'percentual'
    ? (totalGeral * descontoValor) / 100
    : Math.min(descontoValor, totalGeral);

  return {
    valorDesconto,
    totalComDesconto: totalGeral - valorDesconto,
  };
}
