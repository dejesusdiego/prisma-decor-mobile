import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  TrendingUp, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Receipt,
  BarChart3,
  Landmark,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type FinanceiroView = 
  | 'finDashboard' 
  | 'finConciliacao'
  | 'finContasPagar' 
  | 'finContasReceber' 
  | 'finLancamentos' 
  | 'finFluxoPrevisto'
  | 'finRelatorios';

interface NavegacaoFinanceiraProps {
  currentView: FinanceiroView;
  onNavigate: (view: FinanceiroView) => void;
  pendencias?: {
    contasPagar?: number;
    contasReceber?: number;
    atrasadas?: number;
  };
  className?: string;
}

const navItems = [
  { id: 'finDashboard' as FinanceiroView, label: 'Visão Geral', icon: BarChart3 },
  { id: 'finConciliacao' as FinanceiroView, label: 'Conciliação', icon: Landmark },
  { id: 'finFluxoPrevisto' as FinanceiroView, label: 'Fluxo', icon: TrendingUp },
  { id: 'finContasReceber' as FinanceiroView, label: 'A Receber', icon: ArrowDownCircle },
  { id: 'finContasPagar' as FinanceiroView, label: 'A Pagar', icon: ArrowUpCircle },
  { id: 'finLancamentos' as FinanceiroView, label: 'Lançamentos', icon: Receipt },
  { id: 'finRelatorios' as FinanceiroView, label: 'Relatórios', icon: BarChart3 },
];

export function NavegacaoFinanceira({
  currentView,
  onNavigate,
  pendencias = {},
  className,
}: NavegacaoFinanceiraProps) {
  const getBadgeCount = (viewId: FinanceiroView): number | undefined => {
    if (viewId === 'finContasPagar') return pendencias.contasPagar;
    if (viewId === 'finContasReceber') return pendencias.contasReceber;
    return undefined;
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {navItems.map((item) => {
        const isActive = currentView === item.id;
        const badgeCount = getBadgeCount(item.id);
        const Icon = item.icon;

        return (
          <Button
            key={item.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onNavigate(item.id)}
            className="gap-2"
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{item.label}</span>
            {badgeCount !== undefined && badgeCount > 0 && (
              <Badge 
                variant={isActive ? "secondary" : "destructive"} 
                className="h-5 min-w-[20px] px-1.5 text-xs"
              >
                {badgeCount}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
}

// Links rápidos para usar dentro de cards/componentes
interface LinkRapidoFinanceiroProps {
  destino: FinanceiroView;
  label: string;
  onNavigate: (view: FinanceiroView) => void;
  variant?: 'link' | 'button';
}

export function LinkRapidoFinanceiro({ 
  destino, 
  label, 
  onNavigate, 
  variant = 'link' 
}: LinkRapidoFinanceiroProps) {
  if (variant === 'button') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(destino)}
        className="gap-1 text-primary hover:text-primary/80"
      >
        {label}
        <ArrowRight className="h-3 w-3" />
      </Button>
    );
  }

  return (
    <button
      onClick={() => onNavigate(destino)}
      className="text-sm text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1"
    >
      {label}
      <ArrowRight className="h-3 w-3" />
    </button>
  );
}
