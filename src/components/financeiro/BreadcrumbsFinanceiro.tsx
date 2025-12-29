import { ChevronRight, Home, LayoutDashboard, FileText, Receipt, TrendingUp, Users, Landmark, BarChart3 } from 'lucide-react';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';

type FinanceiroView = 
  | 'finDashboard' 
  | 'finFluxoPrevisto' 
  | 'finContasReceber' 
  | 'finContasPagar' 
  | 'finLancamentos' 
  | 'finComissoes' 
  | 'finRelatorios'
  | 'finCategoriasFormas';

interface BreadcrumbsFinanceiroProps {
  currentView: FinanceiroView;
  onNavigate?: (view: string) => void;
  subPage?: string;
}

const viewConfig: Record<FinanceiroView, { label: string; icon: React.ElementType; group: string }> = {
  finDashboard: { label: 'Visão Geral', icon: LayoutDashboard, group: 'Operacional' },
  finFluxoPrevisto: { label: 'Fluxo de Caixa', icon: TrendingUp, group: 'Operacional' },
  finContasReceber: { label: 'Contas a Receber', icon: Receipt, group: 'Operacional' },
  finContasPagar: { label: 'Contas a Pagar', icon: FileText, group: 'Operacional' },
  finLancamentos: { label: 'Lançamentos', icon: Receipt, group: 'Operacional' },
  finComissoes: { label: 'Comissões', icon: Users, group: 'Operacional' },
  finCategoriasFormas: { label: 'Categorias', icon: LayoutDashboard, group: 'Configuração' },
  finRelatorios: { label: 'Relatórios & BI', icon: BarChart3, group: 'Análise' },
};

export function BreadcrumbsFinanceiro({ currentView, onNavigate, subPage }: BreadcrumbsFinanceiroProps) {
  const config = viewConfig[currentView];
  const Icon = config?.icon || LayoutDashboard;

  const handleNavigate = (view: string) => {
    if (onNavigate) {
      onNavigate(view);
    }
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Home/Root */}
        <BreadcrumbItem>
          <BreadcrumbLink 
            className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors"
            onClick={() => handleNavigate('dashboard')}
          >
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Início</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        <BreadcrumbSeparator />
        
        {/* Módulo Financeiro */}
        <BreadcrumbItem>
          <BreadcrumbLink 
            className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors"
            onClick={() => handleNavigate('finDashboard')}
          >
            <Landmark className="h-3.5 w-3.5" />
            Financeiro
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        <BreadcrumbSeparator />
        
        {/* Grupo (Operacional, Análise, Configuração) */}
        {config && currentView !== 'finDashboard' && (
          <>
            <BreadcrumbItem>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {config.group}
              </span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}
        
        {/* Página Atual */}
        <BreadcrumbItem>
          {subPage ? (
            <BreadcrumbLink 
              className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors"
              onClick={() => handleNavigate(currentView)}
            >
              <Icon className="h-3.5 w-3.5" />
              {config?.label || 'Financeiro'}
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage className="flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              {config?.label || 'Financeiro'}
            </BreadcrumbPage>
          )}
        </BreadcrumbItem>
        
        {/* Subpágina se houver */}
        {subPage && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{subPage}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
