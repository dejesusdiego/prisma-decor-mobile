import { 
  Home, 
  Plus, 
  FileText, 
  Database, 
  Settings, 
  Moon, 
  Sun,
  ChevronLeft,
  ChevronDown,
  Users,
  CalendarCheck,
  Bell,
  LayoutDashboard,
  ArrowUpCircle,
  ArrowDownCircle,
  Receipt,
  BarChart3,
  Tags,
  TrendingUp,
  DollarSign,
  Wallet,
  Wrench
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';

export type View = 
  | 'dashboardUnificado'
  | 'dashboard' 
  | 'novoOrcamento' 
  | 'listaOrcamentos' 
  | 'visualizarOrcamento' 
  | 'gestaoMateriais' 
  | 'ajustesSistema' 
  | 'solicitacoesVisita'
  | 'finDashboard'
  | 'finContasPagar'
  | 'finContasReceber'
  | 'finLancamentos'
  | 'finRelatorios'
  | 'finFluxoPrevisto'
  | 'finRentabilidade'
  | 'categoriasFormas';

interface OrcamentoSidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

// Itens da seção PRINCIPAL (visíveis para todos)
const principalNavItems = [
  { id: 'dashboardUnificado' as View, label: 'Visão Geral', icon: LayoutDashboard, adminOnly: true },
  { id: 'dashboard' as View, label: 'Dashboard Orçamentos', icon: Home },
  { id: 'novoOrcamento' as View, label: 'Novo Orçamento', icon: Plus },
  { id: 'listaOrcamentos' as View, label: 'Meus Orçamentos', icon: FileText },
  { id: 'solicitacoesVisita' as View, label: 'Solicitações de Visita', icon: CalendarCheck, adminOnly: true },
];

// Itens da seção FINANCEIRO (admin only)
const financeiroNavItems = [
  { id: 'finDashboard' as View, label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'finFluxoPrevisto' as View, label: 'Fluxo Previsto', icon: TrendingUp },
  { id: 'finRentabilidade' as View, label: 'Rentabilidade', icon: DollarSign },
  { id: 'finContasPagar' as View, label: 'Contas a Pagar', icon: ArrowUpCircle },
  { id: 'finContasReceber' as View, label: 'Contas a Receber', icon: ArrowDownCircle },
  { id: 'finLancamentos' as View, label: 'Lançamentos', icon: Receipt },
  { id: 'finRelatorios' as View, label: 'Relatórios', icon: BarChart3 },
];

// Itens da seção ADMINISTRAÇÃO (admin only)
const administracaoNavItems = [
  { id: 'gestaoMateriais' as View, label: 'Gestão de Materiais', icon: Database },
  { id: 'categoriasFormas' as View, label: 'Categorias e Pagamentos', icon: Tags },
  { id: 'ajustesSistema' as View, label: 'Ajustes do Sistema', icon: Settings },
];

interface SectionConfig {
  id: string;
  title: string;
  icon: React.ElementType;
  items: typeof principalNavItems;
  adminOnly?: boolean;
}

const SIDEBAR_SECTIONS_KEY = 'sidebar-open-sections';
const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

const getInitialSections = (): Record<string, boolean> => {
  try {
    const saved = localStorage.getItem(SIDEBAR_SECTIONS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error reading sidebar sections from localStorage:', e);
  }
  return { principal: true, financeiro: true, administracao: false };
};

const getInitialCollapsed = (): boolean => {
  try {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error reading sidebar collapsed from localStorage:', e);
  }
  return false;
};

export function OrcamentoSidebar({ currentView, onNavigate }: OrcamentoSidebarProps) {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);
  const [isDark, setIsDark] = useState(false);
  const [visitasNaoVistas, setVisitasNaoVistas] = useState(0);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(getInitialSections);

  const sections: SectionConfig[] = [
    { id: 'principal', title: 'Principal', icon: Home, items: principalNavItems },
    { id: 'financeiro', title: 'Financeiro', icon: Wallet, items: financeiroNavItems, adminOnly: true },
    { id: 'administracao', title: 'Administração', icon: Wrench, items: administracaoNavItems, adminOnly: true },
  ];

  // Salvar estado das seções no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_SECTIONS_KEY, JSON.stringify(openSections));
    } catch (e) {
      console.error('Error saving sidebar sections to localStorage:', e);
    }
  }, [openSections]);

  // Salvar estado collapsed no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(collapsed));
    } catch (e) {
      console.error('Error saving sidebar collapsed to localStorage:', e);
    }
  }, [collapsed]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Auto-expand section containing current view
  useEffect(() => {
    sections.forEach(section => {
      const hasActiveItem = section.items.some(item => item.id === currentView);
      if (hasActiveItem && !openSections[section.id]) {
        setOpenSections(prev => ({ ...prev, [section.id]: true }));
      }
    });
  }, [currentView]);

  // Buscar contagem de visitas não visualizadas e configurar realtime
  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchVisitasNaoVistas = async () => {
      try {
        const { count, error } = await supabase
          .from('solicitacoes_visita')
          .select('*', { count: 'exact', head: true })
          .eq('visualizada', false);
        
        if (!error && count !== null) {
          setVisitasNaoVistas(count);
        }
      } catch (error) {
        console.error('Erro ao buscar visitas não vistas:', error);
      }
    };

    fetchVisitasNaoVistas();

    // Configurar listener de realtime para novas visitas
    const channel = supabase
      .channel('solicitacoes-visita-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'solicitacoes_visita'
        },
        (payload) => {
          console.log('Nova solicitação de visita recebida:', payload);
          setVisitasNaoVistas(prev => prev + 1);
          
          const newVisit = payload.new as { nome: string; cidade: string; data_agendada: string };
          toast.info(
            `Nova solicitação de visita!`,
            {
              description: `${newVisit.nome} - ${newVisit.cidade}`,
              icon: <Bell className="h-4 w-4" />,
              action: {
                label: 'Ver',
                onClick: () => onNavigate('solicitacoesVisita')
              },
              duration: 10000
            }
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'solicitacoes_visita'
        },
        (payload) => {
          const oldVisit = payload.old as { visualizada: boolean };
          const newVisit = payload.new as { visualizada: boolean };
          
          if (!oldVisit.visualizada && newVisit.visualizada) {
            setVisitasNaoVistas(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onNavigate, isAdmin]);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDark(!isDark);
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const NavItem = ({ item, isActive }: { item: { id: View; label: string; icon: React.ElementType; adminOnly?: boolean }, isActive: boolean }) => {
    const showBadge = item.id === 'solicitacoesVisita' && visitasNaoVistas > 0;
    
    const content = (
      <button
        onClick={() => onNavigate(item.id)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 relative",
          "hover:bg-accent/50",
          isActive && "bg-primary text-primary-foreground hover:bg-primary/90",
          !isActive && "text-muted-foreground hover:text-foreground"
        )}
      >
        <div className="relative">
          <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary-foreground")} />
          {showBadge && collapsed && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-2 w-2 p-0 rounded-full animate-pulse"
            />
          )}
        </div>
        {!collapsed && (
          <>
            <span className={cn("text-sm font-medium truncate flex-1 text-left", isActive && "text-primary-foreground")}>
              {item.label}
            </span>
            {showBadge && (
              <Badge 
                variant="destructive" 
                className="h-5 min-w-[20px] px-1.5 text-xs animate-pulse"
              >
                {visitasNaoVistas}
              </Badge>
            )}
          </>
        )}
      </button>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium flex items-center gap-2 bg-popover border z-50">
            {item.label}
            {showBadge && (
              <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 text-xs">
                {visitasNaoVistas}
              </Badge>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  const renderSection = (section: SectionConfig) => {
    if (section.adminOnly && !isAdmin) return null;
    
    const filteredItems = section.items.filter(item => !item.adminOnly || isAdmin);
    if (filteredItems.length === 0) return null;

    const isOpen = openSections[section.id];
    const hasActiveItem = filteredItems.some(item => item.id === currentView);
    const SectionIcon = section.icon;

    if (collapsed) {
      return (
        <div key={section.id} className="space-y-1">
          {section.id !== 'principal' && <div className="border-t my-2" />}
          {filteredItems.map((item) => (
            <NavItem key={item.id} item={item} isActive={currentView === item.id} />
          ))}
        </div>
      );
    }
    
    return (
      <Collapsible
        key={section.id}
        open={isOpen}
        onOpenChange={() => toggleSection(section.id)}
        className="space-y-1"
      >
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200",
              "hover:bg-accent/30",
              hasActiveItem && "text-primary",
              !hasActiveItem && "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <SectionIcon className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                {section.title}
              </span>
            </div>
            <ChevronDown 
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isOpen && "rotate-180"
              )} 
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-0.5 pl-2">
          {filteredItems.map((item) => (
            <NavItem key={item.id} item={item} isActive={currentView === item.id} />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <aside
      className={cn(
        "h-screen bg-card border-r flex flex-col transition-all duration-300 sticky top-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn(
        "h-16 border-b flex items-center px-4 shrink-0",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-foreground">Prisma</span>
            <span className="text-xs text-muted-foreground">Sistema de Orçamentos</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          <ChevronLeft className={cn(
            "h-4 w-4 transition-transform duration-200",
            collapsed && "rotate-180"
          )} />
        </Button>
      </div>

      {/* Navigation - Scroll invisível */}
      <nav 
        className={cn(
          "flex-1 p-3 space-y-2 overflow-y-auto",
          "[&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0",
          "[-ms-overflow-style:none] [scrollbar-width:none]"
        )}
      >
        {sections.map(renderSection)}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t space-y-1 shrink-0">
        {/* Users button - Apenas para admins */}
        {isAdmin && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate('/gerenciarusuarios')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
                  "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <Users className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="text-sm font-medium">Usuários</span>}
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="font-medium bg-popover border z-50">
                Usuários
              </TooltipContent>
            )}
          </Tooltip>
        )}

        {/* Theme toggle */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={toggleTheme}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
                "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {isDark ? (
                <Sun className="h-4 w-4 shrink-0" />
              ) : (
                <Moon className="h-4 w-4 shrink-0" />
              )}
              {!collapsed && (
                <span className="text-sm font-medium">
                  {isDark ? 'Modo Claro' : 'Modo Escuro'}
                </span>
              )}
            </button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" className="font-medium bg-popover border z-50">
              {isDark ? 'Modo Claro' : 'Modo Escuro'}
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );
}
