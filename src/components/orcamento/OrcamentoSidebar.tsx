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
  Wrench,
  ClipboardList,
  Target,
  Clock,
  UserCircle,
  BookOpen,
  Factory,
  Layers,
  Calendar,
  Package,
  RefreshCw,
  Building2,
  Lock,
  Sparkles
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
import { useOnboardingContext } from '@/components/onboarding/OnboardingProvider';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useFeatureFlags, OrganizationFeatures } from '@/hooks/useFeatureFlags';
import { useTheme } from '@/hooks/useTheme';

export type View = 
  | 'home'
  | 'dashboard' 
  | 'novoOrcamento' 
  | 'listaOrcamentos' 
  | 'visualizarOrcamento' 
  | 'gestaoMateriais' 
  | 'ajustesSistema' 
  | 'configOrganizacao'
  | 'solicitacoesVisita'
  | 'calendarioGeral'
  | 'finDashboard'
  | 'finConciliacao'
  | 'finContasPagar'
  | 'finContasReceber'
  | 'finLancamentos'
  | 'finRelatorios'
  | 'finFluxoPrevisto'
  | 'finRentabilidade'
  | 'finMargemReal'
  | 'finComissoes'
  | 'finVendedores'
  | 'finKPIs'
  | 'finConsolidado'
  | 'categoriasFormas'
  | 'crmPainel'
  | 'crmContatos'
  | 'crmDetalheContato'
  | 'crmPipeline'
  | 'crmRelatorios'
  | 'crmJornada'
  | 'crmAtividades'
  | 'prodDashboard'
  | 'prodKanban'
  | 'prodLista'
  | 'prodFicha'
  | 'prodAgenda'
  | 'prodRelatorio';

interface OrcamentoSidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

// Tipo para item de navegação com feature opcional
interface NavItemConfig {
  id: View;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  requiredFeature?: keyof OrganizationFeatures;
}

// Itens da seção ORÇAMENTOS (disponível em todos os planos)
const orcamentosNavItems: NavItemConfig[] = [
  { id: 'dashboard' as View, label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'listaOrcamentos' as View, label: 'Meus Orçamentos', icon: FileText },
  { id: 'solicitacoesVisita' as View, label: 'Solicitações de Visita', icon: CalendarCheck, adminOnly: true },
  { id: 'calendarioGeral' as View, label: 'Calendário', icon: Calendar, adminOnly: true },
];

// Itens da seção CRM - crm_basico em todos, crm_avancado só Pro+
const crmNavItems: NavItemConfig[] = [
  { id: 'crmPainel' as View, label: 'Painel CRM', icon: Target }, // crm_basico
  { id: 'crmPipeline' as View, label: 'Pipeline', icon: TrendingUp, requiredFeature: 'crm_avancado' },
  { id: 'crmContatos' as View, label: 'Contatos', icon: UserCircle }, // crm_basico
  { id: 'crmAtividades' as View, label: 'Atividades', icon: Clock, requiredFeature: 'crm_avancado' },
];

// Itens da seção PRODUÇÃO - producao_kanban em todos
const producaoNavItems: NavItemConfig[] = [
  { id: 'prodDashboard' as View, label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'prodKanban' as View, label: 'Kanban', icon: Layers },
  { id: 'prodLista' as View, label: 'Pedidos', icon: Package },
  { id: 'prodAgenda' as View, label: 'Agenda Instalações', icon: Calendar },
];

// Itens da seção FINANCEIRO - financeiro_completo só Pro+
const financeiroNavItems: NavItemConfig[] = [
  { id: 'finDashboard' as View, label: 'Visão Geral', icon: LayoutDashboard, requiredFeature: 'financeiro_completo' },
  { id: 'finConciliacao' as View, label: 'Conciliação Bancária', icon: Wallet, requiredFeature: 'financeiro_completo' },
  { id: 'finContasReceber' as View, label: 'Contas a Receber', icon: ArrowDownCircle, requiredFeature: 'financeiro_completo' },
  { id: 'finContasPagar' as View, label: 'Contas a Pagar', icon: ArrowUpCircle, requiredFeature: 'financeiro_completo' },
  { id: 'finLancamentos' as View, label: 'Lançamentos', icon: Receipt, requiredFeature: 'financeiro_completo' },
  { id: 'finFluxoPrevisto' as View, label: 'Fluxo Previsto', icon: TrendingUp, requiredFeature: 'financeiro_completo' },
  { id: 'finRentabilidade' as View, label: 'Rentabilidade', icon: DollarSign, requiredFeature: 'financeiro_completo' },
  { id: 'finComissoes' as View, label: 'Comissões', icon: Users, requiredFeature: 'financeiro_completo' },
];

// Itens da seção RELATÓRIOS & BI - relatorios_bi só Pro+
const relatoriosBINavItems: NavItemConfig[] = [
  { id: 'finKPIs' as View, label: 'KPIs do Negócio', icon: Target, requiredFeature: 'relatorios_bi' },
  { id: 'finVendedores' as View, label: 'Desempenho Vendedores', icon: Users, requiredFeature: 'relatorios_bi' },
  { id: 'finMargemReal' as View, label: 'Margem Real', icon: TrendingUp, requiredFeature: 'relatorios_bi' },
  { id: 'finRelatorios' as View, label: 'Análise Financeira', icon: DollarSign, requiredFeature: 'relatorios_bi' },
  { id: 'crmRelatorios' as View, label: 'Análise Comercial', icon: TrendingUp, requiredFeature: 'relatorios_bi' },
  { id: 'crmJornada' as View, label: 'Jornada de Clientes', icon: UserCircle, requiredFeature: 'relatorios_bi' },
  { id: 'prodRelatorio' as View, label: 'Análise Produção', icon: Factory, requiredFeature: 'relatorios_bi' },
];

// Itens da seção ADMINISTRAÇÃO (disponível em todos)
const administracaoNavItems: NavItemConfig[] = [
  { id: 'gestaoMateriais' as View, label: 'Gestão de Materiais', icon: Database },
  { id: 'categoriasFormas' as View, label: 'Categorias e Pagamentos', icon: Tags },
  { id: 'configOrganizacao' as View, label: 'Minha Empresa', icon: Building2 },
  { id: 'ajustesSistema' as View, label: 'Ajustes do Sistema', icon: Settings },
];

interface SectionConfig {
  id: string;
  title: string;
  icon: React.ElementType;
  items: NavItemConfig[];
  adminOnly?: boolean;
  requiredFeature?: keyof OrganizationFeatures;
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
  return { orcamentos: true, crm: true, producao: true, financeiro: true, relatoriosBI: true, administracao: false };
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
  const { resetOnboarding } = useOnboardingContext();
  const { organization, isLoading: isOrgLoading } = useOrganizationContext();
  const { hasFeature, features, getUpgradePlanFor } = useFeatureFlags();
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);
  const { isDark, toggleDarkMode } = useTheme();
  const [visitasNaoVistas, setVisitasNaoVistas] = useState(0);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(getInitialSections);

  const sections: SectionConfig[] = [
    { id: 'orcamentos', title: 'Orçamentos', icon: ClipboardList, items: orcamentosNavItems },
    { id: 'crm', title: 'CRM', icon: Target, items: crmNavItems },
    { id: 'producao', title: 'Produção', icon: Factory, items: producaoNavItems, adminOnly: true },
    { id: 'financeiro', title: 'Financeiro', icon: Wallet, items: financeiroNavItems, adminOnly: true, requiredFeature: 'financeiro_completo' },
    { id: 'relatoriosBI', title: 'Relatórios & BI', icon: BarChart3, items: relatoriosBINavItems, adminOnly: true, requiredFeature: 'relatorios_bi' },
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
  const { organizationId } = useOrganizationContext();
  
  useEffect(() => {
    if (!isAdmin || !organizationId) return;
    
    const fetchVisitasNaoVistas = async () => {
      try {
        const { count, error } = await supabase
          .from('solicitacoes_visita')
          .select('*', { count: 'exact', head: true })
          .eq('visualizada', false)
          .eq('organization_id', organizationId);
        
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
  }, [onNavigate, isAdmin, organizationId]);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const NavItem = ({ item, isActive }: { item: NavItemConfig, isActive: boolean }) => {
    const showBadge = item.id === 'solicitacoesVisita' && visitasNaoVistas > 0;
    
    // Verificar se a feature está bloqueada
    const isLocked = item.requiredFeature && !hasFeature(item.requiredFeature);
    
    const handleClick = () => {
      if (isLocked) {
        const planName = getUpgradePlanFor(item.requiredFeature as string);
        toast.info(
          `Recurso disponível no plano ${planName.charAt(0).toUpperCase() + planName.slice(1)}`,
          {
            description: 'Entre em contato para fazer upgrade do seu plano.',
            icon: <Lock className="h-4 w-4" />,
            action: {
              label: 'Ver Planos',
              onClick: () => window.open('https://wa.me/5548999999999?text=Olá! Gostaria de fazer upgrade do meu plano', '_blank')
            }
          }
        );
        return;
      }
      onNavigate(item.id);
    };
    
    const content = (
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 relative",
          "hover:bg-accent/50",
          isActive && !isLocked && "bg-primary text-primary-foreground hover:bg-primary/90 border-l-4 border-l-primary-foreground",
          !isActive && !isLocked && "text-muted-foreground hover:text-foreground hover:bg-accent/30",
          isLocked && "text-muted-foreground/50 cursor-not-allowed hover:bg-transparent"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        <div className="relative">
          {isLocked ? (
            <Lock className="h-4 w-4 shrink-0 text-muted-foreground/50" />
          ) : (
            <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary-foreground")} />
          )}
          {showBadge && collapsed && !isLocked && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-2 w-2 p-0 rounded-full animate-pulse"
            />
          )}
        </div>
        {!collapsed && (
          <>
            <span className={cn(
              "text-sm font-medium truncate flex-1 text-left",
              isActive && !isLocked && "text-primary-foreground",
              isLocked && "text-muted-foreground/50"
            )}>
              {item.label}
            </span>
            {isLocked && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                PRO
              </Badge>
            )}
            {showBadge && !isLocked && (
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
            {isLocked && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                <Lock className="h-2.5 w-2.5 mr-0.5" />
                PRO
              </Badge>
            )}
            {showBadge && !isLocked && (
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
    
    // Verificar se a seção inteira está bloqueada
    const isSectionLocked = section.requiredFeature && !hasFeature(section.requiredFeature);

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
              hasActiveItem && !isSectionLocked && "text-primary",
              !hasActiveItem && !isSectionLocked && "text-muted-foreground hover:text-foreground",
              isSectionLocked && "text-muted-foreground/60"
            )}
          >
            <div className="flex items-center gap-2">
              {isSectionLocked ? (
                <Lock className="h-4 w-4 text-muted-foreground/50" />
              ) : (
                <SectionIcon className="h-4 w-4" />
              )}
              <span className={cn(
                "text-xs font-semibold uppercase tracking-wider",
                isSectionLocked && "text-muted-foreground/60"
              )}>
                {section.title}
              </span>
              {isSectionLocked && (
                <Badge variant="outline" className="h-4 px-1 text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                  PRO
                </Badge>
              )}
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

  // Botão de novo orçamento (fixo, destacado)
  const renderNovoOrcamentoButton = () => {
    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => onNavigate('novoOrcamento')}
              className="w-full flex items-center justify-center p-2.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-all shadow-md"
            >
              <Plus className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium bg-popover border z-50">
            Novo Orçamento
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <button
        onClick={() => onNavigate('novoOrcamento')}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-all font-medium shadow-md"
      >
        <Plus className="h-4 w-4" />
        <span>Novo Orçamento</span>
      </button>
    );
  };

  return (
    <aside
      className={cn(
        "h-screen bg-card border-r flex flex-col transition-all duration-300 sticky top-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header - Organization Branding */}
      <div className={cn(
        "h-16 border-b flex items-center px-4 shrink-0",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {isOrgLoading ? (
                <div className="h-8 w-8 rounded-md bg-muted animate-pulse shrink-0" />
              ) : organization?.logo_url ? (
                <img 
                  src={organization.logo_url} 
                  alt={organization.name}
                  className="h-8 w-8 rounded-md object-contain shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-foreground truncate">
                  {isOrgLoading ? 'Carregando...' : (organization?.name || 'Prisma')}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {organization?.tagline || 'Sistema de Orçamentos'}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(true)}
              className="h-8 w-8 shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        )}
        {collapsed && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCollapsed(false)}
            className="h-10 w-10 bg-background hover:bg-accent"
          >
            <ChevronLeft className="h-5 w-5 rotate-180" />
          </Button>
        )}
      </div>

      {/* Home Button + Novo Orçamento - Fixos no topo */}
      <div className="p-3 space-y-2 shrink-0">
        {/* Home - Dashboard Executivo (admin) ou Dashboard Orçamentos (user) */}
        {isAdmin ? (
          collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onNavigate('home')}
                  className={cn(
                    "w-full flex items-center justify-center p-2.5 rounded-lg transition-all",
                    currentView === 'home' 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <Home className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium bg-popover border z-50">
                Visão Geral
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => onNavigate('home')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                currentView === 'home' 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Home className="h-5 w-5" />
              <span className="font-medium">Visão Geral</span>
            </button>
          )
        ) : null}

        {renderNovoOrcamentoButton()}
      </div>

      {/* Navigation - Scroll invisível */}
      <nav 
        className={cn(
          "flex-1 px-3 pb-3 space-y-2 overflow-y-auto",
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

        {/* Help/Documentation link */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate('/documentacao')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
                "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="text-sm font-medium">Ajuda</span>}
            </button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" className="font-medium bg-popover border z-50">
              Ajuda
            </TooltipContent>
          )}
        </Tooltip>

        {/* Reiniciar Tour */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                resetOnboarding();
                toast.success('Tour reiniciado! Bem-vindo de volta.');
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
                "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <RefreshCw className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="text-sm font-medium">Reiniciar Tour</span>}
            </button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" className="font-medium bg-popover border z-50">
              Reiniciar Tour
            </TooltipContent>
          )}
        </Tooltip>

        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={toggleDarkMode}
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
