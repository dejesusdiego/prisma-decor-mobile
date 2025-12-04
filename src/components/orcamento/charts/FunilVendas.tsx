import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter } from 'lucide-react';

interface EtapaFunil {
  status: string;
  label: string;
  quantidade: number;
  valor: number;
  cor: string;
}

interface FunilVendasProps {
  etapas: EtapaFunil[];
}

export function FunilVendas({ etapas }: FunilVendasProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const maxQuantidade = Math.max(...etapas.map(e => e.quantidade), 1);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          Funil de Vendas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {etapas.map((etapa, index) => {
            const widthPercent = (etapa.quantidade / maxQuantidade) * 100;
            return (
              <div key={etapa.status} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{etapa.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">{etapa.quantidade}</span>
                    <span className="text-xs text-muted-foreground w-20 text-right">
                      {formatCurrency(etapa.valor)}
                    </span>
                  </div>
                </div>
                <div className="h-8 bg-muted rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                    style={{ 
                      width: `${Math.max(widthPercent, 5)}%`,
                      backgroundColor: etapa.cor
                    }}
                  >
                    {widthPercent > 20 && (
                      <span className="text-xs font-medium text-white">
                        {((etapa.quantidade / (etapas[0]?.quantidade || 1)) * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Taxa de conversão */}
        {etapas.length >= 2 && etapas[0].quantidade > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Taxa de conversão geral:</span>
              <span className="font-semibold text-foreground">
                {(((etapas.find(e => e.status === 'pago')?.quantidade || 0) / etapas[0].quantidade) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
