import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Eye,
  User,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrcamentoPipeline {
  id: string;
  codigo: string;
  cliente_nome: string;
  cliente_telefone: string;
  cidade: string | null;
  status: string;
  total_com_desconto: number | null;
  total_geral: number | null;
  created_at: string;
  updated_at: string;
  contato_id: string | null;
}

interface StatusConfig {
  id: string;
  label: string;
  bgClass: string;
  color: string;
}

interface GridPipelineProps {
  orcamentos: OrcamentoPipeline[];
  statusConfig: StatusConfig[];
  onVerOrcamento?: (id: string) => void;
  onVerContato?: (id: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export function GridPipeline({
  orcamentos,
  statusConfig,
  onVerOrcamento,
  onVerContato
}: GridPipelineProps) {
  const getStatusConfig = (statusId: string) => 
    statusConfig.find(s => s.id === statusId) || statusConfig[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {orcamentos.map(orc => {
        const status = getStatusConfig(orc.status);
        const valor = orc.total_com_desconto || orc.total_geral || 0;

        return (
          <Card 
            key={orc.id} 
            className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden"
            onClick={() => onVerOrcamento?.(orc.id)}
          >
            {/* Header com Status */}
            <div className={cn("h-2", status.bgClass)} />
            
            <CardContent className="p-4">
              {/* Código e Menu */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-lg">{orc.codigo}</p>
                  <Badge className={cn(status.bgClass, "text-white text-xs mt-1")}>
                    {status.label}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onVerOrcamento?.(orc.id);
                    }}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </DropdownMenuItem>
                    {orc.contato_id && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onVerContato?.(orc.contato_id!);
                      }}>
                        <User className="h-4 w-4 mr-2" />
                        Ver Contato
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Cliente */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="font-medium truncate">{orc.cliente_nome}</p>
                </div>
                
                {orc.cliente_telefone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span>{orc.cliente_telefone}</span>
                  </div>
                )}
                
                {orc.cidade && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span>{orc.cidade}</span>
                  </div>
                )}
              </div>

              {/* Valor */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-1 text-emerald-600">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-bold text-lg">{formatCurrency(valor)}</span>
                </div>
              </div>

              {/* Data */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                <Calendar className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(orc.updated_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>

              {/* Indicador de contato vinculado */}
              {orc.contato_id && (
                <div className="mt-3">
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                    <User className="h-3 w-3 mr-1" />
                    Contato vinculado
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {orcamentos.length === 0 && (
        <div className="col-span-full p-8 text-center text-muted-foreground">
          Nenhum orçamento encontrado
        </div>
      )}
    </div>
  );
}
