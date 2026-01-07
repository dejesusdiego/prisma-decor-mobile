import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronRight,
  Eye,
  User,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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

interface FunilPipelineProps {
  orcamentosPorStatus: Record<string, OrcamentoPipeline[]>;
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

export function FunilPipeline({
  orcamentosPorStatus,
  statusConfig,
  onVerOrcamento,
  onVerContato
}: FunilPipelineProps) {
  const [estagioExpandido, setEstagioExpandido] = useState<string | null>(null);

  // Calcular total geral para proporções
  const totalGeral = statusConfig.reduce((sum, status) => {
    const itens = orcamentosPorStatus[status.id] || [];
    return sum + itens.reduce((s, o) => s + (o.total_com_desconto || o.total_geral || 0), 0);
  }, 0);

  const maxQtd = Math.max(...statusConfig.map(s => (orcamentosPorStatus[s.id] || []).length), 1);

  return (
    <div className="space-y-4">
      {/* Funil Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funil de Vendas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {statusConfig.map((status, index) => {
            const itens = orcamentosPorStatus[status.id] || [];
            const valorTotal = itens.reduce((sum, o) => sum + (o.total_com_desconto || o.total_geral || 0), 0);
            const widthPercent = Math.max((itens.length / maxQtd) * 100, 15);
            const isExpandido = estagioExpandido === status.id;

            // Calcular conversão em relação ao anterior
            let conversao: number | null = null;
            if (index > 0) {
              const prevItens = orcamentosPorStatus[statusConfig[index - 1].id] || [];
              if (prevItens.length > 0) {
                conversao = (itens.length / prevItens.length) * 100;
              }
            }

            return (
              <div key={status.id}>
                <div 
                  className="cursor-pointer"
                  onClick={() => setEstagioExpandido(isExpandido ? null : status.id)}
                >
                  {/* Barra do Funil */}
                  <div className="relative">
                    <div 
                      className={cn(
                        "h-12 rounded-lg flex items-center justify-between px-4 transition-all hover:opacity-90",
                        status.bgClass,
                        "text-white"
                      )}
                      style={{ 
                        width: `${widthPercent}%`,
                        marginLeft: `${(100 - widthPercent) / 2}%`
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{status.label}</span>
                        <Badge variant="secondary" className="bg-white/20 text-white">
                          {itens.length}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">
                          {formatCurrency(valorTotal)}
                        </span>
                        {conversao !== null && (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "border-white/30 text-white text-xs",
                              conversao >= 50 ? "bg-white/20" : "bg-white/10"
                            )}
                          >
                            {conversao.toFixed(0)}%
                          </Badge>
                        )}
                        <ChevronRight className={cn(
                          "h-4 w-4 transition-transform",
                          isExpandido && "rotate-90"
                        )} />
                      </div>
                    </div>
                  </div>

                  {/* Seta de conversão */}
                  {index < statusConfig.length - 1 && (
                    <div className="flex justify-center py-1">
                      <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Lista Expandida */}
                <AnimatePresence>
                  {isExpandido && itens.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <Card className="mt-2 border-l-4" style={{ borderLeftColor: status.color }}>
                        <ScrollArea className="max-h-48">
                          <div className="p-3 space-y-2">
                            {itens.map(orc => (
                              <div 
                                key={orc.id}
                                className="flex items-center justify-between p-2 rounded bg-muted/50 hover:bg-muted cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onVerOrcamento?.(orc.id);
                                }}
                              >
                                <div>
                                  <p className="font-medium text-sm">{orc.codigo}</p>
                                  <p className="text-xs text-muted-foreground">{orc.cliente_nome}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-emerald-600">
                                    {formatCurrency(orc.total_com_desconto || orc.total_geral || 0)}
                                  </span>
                                  {orc.contato_id && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onVerContato?.(orc.contato_id!);
                                      }}
                                    >
                                      <User className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">
              {statusConfig.reduce((sum, s) => sum + (orcamentosPorStatus[s.id]?.length || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Orçamentos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(totalGeral)}
            </p>
            <p className="text-xs text-muted-foreground">Valor Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">
              {(() => {
                const STATUS_PAGOS = ['pago_40', 'pago_parcial', 'pago_60', 'pago'];
                const STATUS_INICIAIS = ['finalizado', 'enviado', 'sem_resposta'];
                const qtdPagos = STATUS_PAGOS.reduce((sum, s) => sum + (orcamentosPorStatus[s]?.length || 0), 0);
                const qtdIniciais = STATUS_INICIAIS.reduce((sum, s) => sum + (orcamentosPorStatus[s]?.length || 0), 0);
                return qtdIniciais > 0 ? ((qtdPagos / qtdIniciais) * 100).toFixed(0) : 0;
              })()}%
            </p>
            <p className="text-xs text-muted-foreground">Conversão Geral</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
