import { cn } from '@/lib/utils';
import { 
  UserPlus, 
  FileText, 
  CreditCard, 
  Factory, 
  Truck, 
  Heart,
  Check
} from 'lucide-react';
import { EstadoJornada, EstagioJornada } from '@/hooks/useJornadaCliente';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface JornadaClienteProps {
  estagios: EstadoJornada[];
  className?: string;
}

const ESTAGIOS_CONFIG: Record<EstagioJornada, { 
  label: string; 
  icon: React.ElementType;
  descricao: string;
}> = {
  lead: { 
    label: 'Lead', 
    icon: UserPlus,
    descricao: 'Primeiro contato registrado'
  },
  orcamento: { 
    label: 'Orçamento', 
    icon: FileText,
    descricao: 'Orçamento criado para o cliente'
  },
  pagamento: { 
    label: 'Pagamento', 
    icon: CreditCard,
    descricao: 'Pagamento iniciado ou concluído'
  },
  producao: { 
    label: 'Produção', 
    icon: Factory,
    descricao: 'Pedido em fabricação'
  },
  instalacao: { 
    label: 'Instalação', 
    icon: Truck,
    descricao: 'Produto pronto para instalação'
  },
  pos_venda: { 
    label: 'Pós-venda', 
    icon: Heart,
    descricao: 'Entrega concluída, cliente atendido'
  }
};

export function JornadaCliente({ estagios, className }: JornadaClienteProps) {
  if (!estagios || estagios.length === 0) return null;

  return (
    <TooltipProvider>
      <div className={cn("w-full", className)}>
        <div className="flex items-center justify-between relative">
          {/* Linha de conexão */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-muted rounded-full z-0" />
          
          {/* Linha de progresso */}
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-500"
            style={{ 
              width: `${(estagios.filter(e => e.concluido).length / (estagios.length - 1)) * 100}%` 
            }}
          />

          {estagios.map((estado, index) => {
            const config = ESTAGIOS_CONFIG[estado.estagio];
            const Icon = config.icon;
            
            return (
              <Tooltip key={estado.estagio}>
                <TooltipTrigger asChild>
                  <div 
                    className={cn(
                      "relative z-10 flex flex-col items-center gap-1 cursor-default transition-all",
                      estado.atual && "scale-110"
                    )}
                  >
                    <div 
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                        estado.concluido 
                          ? "bg-primary border-primary text-primary-foreground" 
                          : estado.atual 
                            ? "bg-primary/10 border-primary text-primary animate-pulse" 
                            : "bg-muted border-muted-foreground/20 text-muted-foreground"
                      )}
                    >
                      {estado.concluido ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span 
                      className={cn(
                        "text-xs font-medium text-center max-w-[60px] leading-tight",
                        estado.atual ? "text-primary" : estado.concluido ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {config.label}
                    </span>
                    {estado.info && (
                      <span className="text-[10px] text-muted-foreground text-center">
                        {estado.info}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{config.label}</p>
                  <p className="text-xs text-muted-foreground">{config.descricao}</p>
                  {estado.info && (
                    <p className="text-xs text-primary mt-1">{estado.info}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
