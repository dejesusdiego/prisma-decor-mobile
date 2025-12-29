import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronDown, 
  ChevronRight,
  Eye,
  User,
  DollarSign,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
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

interface PipelineCompactoProps {
  orcamentosPorStatus: Record<string, OrcamentoPipeline[]>;
  statusConfig: StatusConfig[];
  onVerOrcamento?: (id: string) => void;
  onVerContato?: (id: string) => void;
  onMudarStatus?: (orcamentoId: string, novoStatus: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export function PipelineCompacto({
  orcamentosPorStatus,
  statusConfig,
  onVerOrcamento,
  onVerContato,
  onMudarStatus
}: PipelineCompactoProps) {
  const [colunasColapsadas, setColunasColapsadas] = useState<Record<string, boolean>>({});

  const toggleColuna = (statusId: string) => {
    setColunasColapsadas(prev => ({
      ...prev,
      [statusId]: !prev[statusId]
    }));
  };

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-3 pb-4" style={{ minWidth: 'max-content' }}>
        {statusConfig.map((status) => {
          const itens = orcamentosPorStatus[status.id] || [];
          const valorTotal = itens.reduce((sum, o) => sum + (o.total_com_desconto || o.total_geral || 0), 0);
          const isColapsada = colunasColapsadas[status.id];

          return (
            <div
              key={status.id}
              className={cn(
                "shrink-0 transition-all duration-200",
                isColapsada ? "w-12" : "w-56"
              )}
            >
              {/* Header */}
              <div 
                className={cn(
                  "rounded-t-lg px-3 py-2 text-white font-medium flex items-center justify-between cursor-pointer",
                  status.bgClass
                )}
                onClick={() => toggleColuna(status.id)}
              >
                {!isColapsada ? (
                  <>
                    <span className="text-sm truncate">{status.label}</span>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                        {itens.length}
                      </Badge>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </>
                ) : (
                  <ChevronRight className="h-4 w-4 mx-auto" />
                )}
              </div>

              {!isColapsada && (
                <>
                  {/* Valor Total */}
                  <div className="bg-muted/50 px-3 py-1 text-xs text-muted-foreground border-x">
                    {formatCurrency(valorTotal)}
                  </div>

                  {/* Cards Compactos */}
                  <ScrollArea className="h-[400px] border-x border-b rounded-b-lg bg-muted/20">
                    <div className="p-2 space-y-1.5">
                      {itens.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          Vazio
                        </p>
                      ) : (
                        itens.map(orcamento => (
                          <HoverCard key={orcamento.id}>
                            <HoverCardTrigger asChild>
                              <div
                                className="bg-card rounded border p-2 cursor-pointer hover:shadow-sm transition-shadow"
                                onClick={() => onVerOrcamento?.(orcamento.id)}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-xs font-medium truncate">
                                    {orcamento.codigo}
                                  </span>
                                  <span className="text-xs text-emerald-600 font-medium shrink-0">
                                    {formatCurrency(orcamento.total_com_desconto || orcamento.total_geral || 0)}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {orcamento.cliente_nome}
                                </p>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-64" side="right">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{orcamento.codigo}</span>
                                  <Badge variant="secondary" className={status.bgClass + " text-white"}>
                                    {status.label}
                                  </Badge>
                                </div>
                                <div className="space-y-1 text-sm">
                                  <p className="flex items-center gap-2">
                                    <User className="h-3 w-3" />
                                    {orcamento.cliente_nome}
                                  </p>
                                  <p className="flex items-center gap-2">
                                    <DollarSign className="h-3 w-3" />
                                    {formatCurrency(orcamento.total_com_desconto || orcamento.total_geral || 0)}
                                  </p>
                                  {orcamento.cidade && (
                                    <p className="text-muted-foreground">{orcamento.cidade}</p>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(orcamento.updated_at), { addSuffix: true, locale: ptBR })}
                                  </p>
                                </div>
                                <div className="flex gap-2 pt-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="flex-1 h-7 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onVerOrcamento?.(orcamento.id);
                                    }}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Ver
                                  </Button>
                                  {orcamento.contato_id && (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="flex-1 h-7 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onVerContato?.(orcamento.contato_id!);
                                      }}
                                    >
                                      <User className="h-3 w-3 mr-1" />
                                      Contato
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </>
              )}

              {/* Coluna Colapsada - Mostrar contagem vertical */}
              {isColapsada && (
                <div className="border-x border-b rounded-b-lg bg-muted/20 py-4 text-center">
                  <div className="writing-vertical text-xs text-muted-foreground" style={{ writingMode: 'vertical-rl' }}>
                    {itens.length} orçamento(s)
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
