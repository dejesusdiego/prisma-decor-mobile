import { AlertCircle, AlertTriangle, Copy, SplitSquareVertical, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { AnaliseReconciliacao } from './utils/aplicarRegras';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

interface AlertasReconciliacaoProps {
  analise: AnaliseReconciliacao | null;
  isLoading?: boolean;
}

export function AlertasReconciliacao({ analise, isLoading }: AlertasReconciliacaoProps) {
  if (isLoading) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="h-4 w-4 animate-pulse" />
            <span className="text-sm">Analisando movimentações...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analise || analise.totalAlertas === 0) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-amber-800">
          <AlertTriangle className="h-5 w-5" />
          Alertas de Conciliação
          <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-800">
            {analise.totalAlertas} alerta{analise.totalAlertas > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <ScrollArea className="max-h-[200px]">
          <Accordion type="multiple" className="space-y-1">
            {/* Duplicados */}
            {analise.duplicados.length > 0 && (
              <AccordionItem value="duplicados" className="border-none">
                <AccordionTrigger className="py-2 px-3 bg-red-50 rounded-lg hover:bg-red-100 hover:no-underline">
                  <div className="flex items-center gap-2 text-red-700">
                    <Copy className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {analise.duplicados.length} possível(is) duplicado(s)
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 px-3">
                  <div className="space-y-2">
                    {analise.duplicados.map((alerta, idx) => (
                      <div key={idx} className="text-sm p-2 bg-background rounded border">
                        <p className="font-medium text-red-700">{formatCurrency(alerta.valor)}</p>
                        <p className="text-muted-foreground text-xs">{alerta.mensagem}</p>
                        <div className="mt-1 space-y-0.5">
                          {alerta.movimentacoes.map((mov, i) => (
                            <p key={i} className="text-xs truncate">
                              • {mov.data} - {mov.descricao}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Parciais */}
            {analise.parciais.length > 0 && (
              <AccordionItem value="parciais" className="border-none">
                <AccordionTrigger className="py-2 px-3 bg-amber-50 rounded-lg hover:bg-amber-100 hover:no-underline">
                  <div className="flex items-center gap-2 text-amber-700">
                    <SplitSquareVertical className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {analise.parciais.length} pagamento(s) parcial(is)
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 px-3">
                  <div className="space-y-2">
                    {analise.parciais.map((alerta, idx) => (
                      <div key={idx} className="text-sm p-2 bg-background rounded border">
                        <div className="flex justify-between items-start">
                          <p className="font-medium">{alerta.parcela.cliente_nome}</p>
                          <Badge variant="outline" className="text-amber-700">
                            {alerta.percentual.toFixed(0)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Recebido: {formatCurrency(alerta.movimentacao.valor)} | 
                          Esperado: {formatCurrency(alerta.parcela.valor)}
                        </p>
                        <p className="text-xs text-red-600">
                          Falta: {formatCurrency(alerta.diferenca)}
                        </p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Agrupados */}
            {analise.agrupados.length > 0 && (
              <AccordionItem value="agrupados" className="border-none">
                <AccordionTrigger className="py-2 px-3 bg-blue-50 rounded-lg hover:bg-blue-100 hover:no-underline">
                  <div className="flex items-center gap-2 text-blue-700">
                    <SplitSquareVertical className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {analise.agrupados.length} pagamento(s) agrupado(s)
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 px-3">
                  <div className="space-y-2">
                    {analise.agrupados.map((alerta, idx) => (
                      <div key={idx} className="text-sm p-2 bg-background rounded border">
                        <p className="font-medium">{alerta.parcela.cliente_nome}</p>
                        <p className="text-xs text-muted-foreground">{alerta.mensagem}</p>
                        <div className="mt-1 space-y-0.5">
                          {alerta.movimentacoes.map((mov, i) => (
                            <p key={i} className="text-xs">
                              + {formatCurrency(mov.valor)} ({mov.data})
                            </p>
                          ))}
                        </div>
                        <p className="text-xs text-green-600 font-medium mt-1">
                          = {formatCurrency(alerta.somaValor)} (parcela: {formatCurrency(alerta.parcela.valor)})
                        </p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Excedentes */}
            {analise.excedentes.length > 0 && (
              <AccordionItem value="excedentes" className="border-none">
                <AccordionTrigger className="py-2 px-3 bg-green-50 rounded-lg hover:bg-green-100 hover:no-underline">
                  <div className="flex items-center gap-2 text-green-700">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {analise.excedentes.length} pagamento(s) excedente(s)
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 px-3">
                  <div className="space-y-2">
                    {analise.excedentes.map((alerta, idx) => (
                      <div key={idx} className="text-sm p-2 bg-background rounded border">
                        <p className="font-medium">{alerta.parcela.cliente_nome}</p>
                        <p className="text-xs text-muted-foreground">
                          Recebido: {formatCurrency(alerta.movimentacao.valor)} | 
                          Esperado: {formatCurrency(alerta.parcela.valor)}
                        </p>
                        <p className="text-xs text-green-600">
                          Excedente: +{formatCurrency(alerta.diferenca)}
                        </p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
