import { 
  Home, 
  Plus, 
  FileText, 
  Database, 
  Settings, 
  Moon, 
  Sun,
  ChevronLeft,
  Users
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type View = 'dashboard' | 'novoOrcamento' | 'listaOrcamentos' | 'visualizarOrcamento' | 'gestaoMateriais' | 'ajustesSistema';

interface OrcamentoSidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

const mainNavItems = [
  { id: 'dashboard' as View, label: 'Dashboard', icon: Home },
  { id: 'novoOrcamento' as View, label: 'Novo Orçamento', icon: Plus },
  { id: 'listaOrcamentos' as View, label: 'Meus Orçamentos', icon: FileText },
];

const adminNavItems = [
  { id: 'gestaoMateriais' as View, label: 'Gestão de Materiais', icon: Database },
  { id: 'ajustesSistema' as View, label: 'Ajustes do Sistema', icon: Settings },
];

export function OrcamentoSidebar({ currentView, onNavigate }: OrcamentoSidebarProps) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

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

  const NavItem = ({ item, isActive }: { item: typeof mainNavItems[0], isActive: boolean }) => {
    const content = (
      <button
        onClick={() => onNavigate(item.id)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
          "hover:bg-accent/50",
          isActive && "bg-primary text-primary-foreground hover:bg-primary/90",
          !isActive && "text-muted-foreground hover:text-foreground"
        )}
      >
        <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary-foreground")} />
        {!collapsed && (
          <span className={cn("text-sm font-medium truncate", isActive && "text-primary-foreground")}>
            {item.label}
          </span>
        )}
      </button>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
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
        "h-16 border-b flex items-center px-4",
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

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* Main Section */}
        <div className="space-y-1">
          {!collapsed && (
            <span className="text-xs font-semibold text-muted-foreground px-3 py-2 block uppercase tracking-wider">
              Principal
            </span>
          )}
          {mainNavItems.map((item) => (
            <NavItem key={item.id} item={item} isActive={currentView === item.id} />
          ))}
        </div>

        {/* Admin Section */}
        <div className="pt-4 space-y-1">
          {!collapsed && (
            <span className="text-xs font-semibold text-muted-foreground px-3 py-2 block uppercase tracking-wider">
              Administração
            </span>
          )}
          {collapsed && <div className="border-t my-2" />}
          {adminNavItems.map((item) => (
            <NavItem key={item.id} item={item} isActive={currentView === item.id} />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t space-y-2">
        {/* Users button */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate('/gerenciarusuarios')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Users className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="text-sm font-medium">Usuários</span>}
            </button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" className="font-medium">
              Usuários
            </TooltipContent>
          )}
        </Tooltip>

        {/* Theme toggle */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={toggleTheme}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {isDark ? (
                <Sun className="h-5 w-5 shrink-0" />
              ) : (
                <Moon className="h-5 w-5 shrink-0" />
              )}
              {!collapsed && (
                <span className="text-sm font-medium">
                  {isDark ? 'Modo Claro' : 'Modo Escuro'}
                </span>
              )}
            </button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" className="font-medium">
              {isDark ? 'Modo Claro' : 'Modo Escuro'}
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );
}
