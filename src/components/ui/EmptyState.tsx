/**
 * EmptyState - Componente padronizado para estados vazios
 */

import { ReactNode } from 'react';
import { LucideIcon, FileX, Search, Inbox, Package, Users, Calendar, DollarSign, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type EmptyStateVariant = 
  | 'default' 
  | 'search' 
  | 'filter' 
  | 'inbox'
  | 'orcamentos'
  | 'contatos'
  | 'pedidos'
  | 'financeiro'
  | 'calendario';

interface EmptyStateProps {
  /** Variante predefinida ou ícone customizado */
  variant?: EmptyStateVariant;
  /** Ícone customizado (sobrescreve variant) */
  icon?: LucideIcon;
  /** Título principal */
  title?: string;
  /** Descrição secundária */
  description?: string;
  /** Ação principal */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  };
  /** Ação secundária (ex: limpar filtros) */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Classe CSS adicional */
  className?: string;
  /** Conteúdo adicional */
  children?: ReactNode;
}

// Configurações por variante
const VARIANT_CONFIG: Record<EmptyStateVariant, { icon: LucideIcon; title: string; description: string }> = {
  default: {
    icon: Inbox,
    title: 'Nenhum item encontrado',
    description: 'Não há dados para exibir no momento.'
  },
  search: {
    icon: Search,
    title: 'Nenhum resultado',
    description: 'Tente ajustar os termos da sua busca.'
  },
  filter: {
    icon: FileX,
    title: 'Nenhum resultado para os filtros',
    description: 'Tente remover alguns filtros para ver mais resultados.'
  },
  inbox: {
    icon: Inbox,
    title: 'Caixa vazia',
    description: 'Nenhuma notificação ou mensagem no momento.'
  },
  orcamentos: {
    icon: ClipboardList,
    title: 'Nenhum orçamento',
    description: 'Comece criando seu primeiro orçamento.'
  },
  contatos: {
    icon: Users,
    title: 'Nenhum contato',
    description: 'Adicione contatos para começar a gerenciar seus clientes.'
  },
  pedidos: {
    icon: Package,
    title: 'Nenhum pedido',
    description: 'Os pedidos aparecerão aqui quando orçamentos forem aprovados.'
  },
  financeiro: {
    icon: DollarSign,
    title: 'Sem movimentações',
    description: 'Nenhuma movimentação financeira no período.'
  },
  calendario: {
    icon: Calendar,
    title: 'Agenda vazia',
    description: 'Nenhum evento agendado para este período.'
  }
};

export function EmptyState({
  variant = 'default',
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  children
}: EmptyStateProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = icon || config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground/60" />
      </div>
      
      <h3 className="font-medium text-foreground mb-1">
        {displayTitle}
      </h3>
      
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        {displayDescription}
      </p>

      {children}

      <div className="flex items-center gap-2 mt-2">
        {action && (
          <Button 
            variant={action.variant || 'default'} 
            onClick={action.onClick}
            size="sm"
          >
            {action.label}
          </Button>
        )}
        
        {secondaryAction && (
          <Button 
            variant="ghost" 
            onClick={secondaryAction.onClick}
            size="sm"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Versão compacta para uso em tabelas
 */
interface EmptyRowProps {
  colSpan: number;
  message?: string;
  icon?: LucideIcon;
}

export function EmptyRow({ colSpan, message = 'Nenhum item encontrado', icon: Icon = Inbox }: EmptyRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-8 text-muted-foreground">
        <Icon className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p>{message}</p>
      </td>
    </tr>
  );
}

export default EmptyState;
