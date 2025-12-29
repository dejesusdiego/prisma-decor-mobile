import { Calendar, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { PeriodoFinanceiro } from '@/contexts/FinanceiroContext';

interface SeletorPeriodoGlobalProps {
  periodo: PeriodoFinanceiro;
  onPeriodoChange: (periodo: PeriodoFinanceiro) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  showLabel?: boolean;
  className?: string;
}

const periodoLabels: Record<PeriodoFinanceiro, string> = {
  '7dias': 'Últimos 7 dias',
  '30dias': 'Últimos 30 dias',
  'mesAtual': 'Mês Atual',
  'mesAnterior': 'Mês Anterior',
  '90dias': 'Últimos 90 dias',
  'custom': 'Personalizado',
};

export function SeletorPeriodoGlobal({
  periodo,
  onPeriodoChange,
  onRefresh,
  isLoading = false,
  showLabel = true,
  className,
}: SeletorPeriodoGlobalProps) {
  const getPeriodoDisplayLabel = () => {
    if (periodo === 'mesAtual') {
      return format(new Date(), 'MMMM yyyy', { locale: ptBR });
    }
    return periodoLabels[periodo] || periodo;
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {showLabel && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">{getPeriodoDisplayLabel()}</span>
        </div>
      )}
      
      <Select value={periodo} onValueChange={(v) => onPeriodoChange(v as PeriodoFinanceiro)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7dias">Últimos 7 dias</SelectItem>
          <SelectItem value="30dias">Últimos 30 dias</SelectItem>
          <SelectItem value="mesAtual">Mês Atual</SelectItem>
          <SelectItem value="mesAnterior">Mês Anterior</SelectItem>
          <SelectItem value="90dias">Últimos 90 dias</SelectItem>
        </SelectContent>
      </Select>

      {onRefresh && (
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      )}
    </div>
  );
}
