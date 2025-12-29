import { AlertCircle, AlertTriangle, Clock, FileText, TrendingUp, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { useAlertasOrcamentos, AlertaOrcamento } from '@/hooks/useAlertasOrcamentos';
import { formatCurrency } from '@/lib/formatters';

interface AlertasOrcamentosConciliacaoProps {
  onNavigateOrcamento?: (orcamentoId: string) => void;
}

export function AlertasOrcamentosConciliacao({ onNavigateOrcamento }: AlertasOrcamentosConciliacaoProps) {
  const { data, isLoading } = useAlertasOrcamentos();

  if (isLoading) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertCircle className="h-4 w-4 animate-pulse" />
            <span className="text-sm">Analisando orçamentos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.alertas.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Todos os orçamentos estão em dia!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Agrupar alertas por tipo
  const alertasPorTipo = {
    atraso_recebimento: data.alertas.filter(a => a.tipo === 'atraso_recebimento'),
    parcelas_sem_extrato: data.alertas.filter(a => a.tipo === 'parcelas_sem_extrato'),
    custos_pendentes: data.alertas.filter(a => a.tipo === 'custos_pendentes'),
    divergencia_valor: data.alertas.filter(a => a.tipo === 'divergencia_valor')
  };

  const getIcone = (tipo: AlertaOrcamento['tipo']) => {
    switch (tipo) {
      case 'atraso_recebimento': return <AlertTriangle className="h-4 w-4" />;
      case 'parcelas_sem_extrato': return <FileText className="h-4 w-4" />;
      case 'custos_pendentes': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getCor = (tipo: AlertaOrcamento['tipo']) => {
    switch (tipo) {
      case 'atraso_recebimento': return 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50';
      case 'parcelas_sem_extrato': return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50';
      case 'custos_pendentes': return 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50';
      default: return 'bg-muted';
    }
  };

  const getTitulo = (tipo: AlertaOrcamento['tipo'], count: number) => {
    switch (tipo) {
      case 'atraso_recebimento': return `${count} orçamento(s) com parcelas atrasadas`;
      case 'parcelas_sem_extrato': return `${count} parcela(s) paga(s) não encontrada(s) no extrato`;
      case 'custos_pendentes': return `${count} orçamento(s) com custos pendentes`;
      default: return `${count} alerta(s)`;
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5" />
          Alertas de Orçamentos
          <Badge variant="secondary" className="ml-auto bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
            {data.totalOrcamentosComAlerta} orçamento{data.totalOrcamentosComAlerta > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        {/* Resumo rápido */}
        <div className="flex flex-wrap gap-2 mb-3 text-xs">
          {data.parcelasSemExtrato > 0 && (
            <Badge variant="outline" className="border-amber-300 dark:border-amber-700">
              {data.parcelasSemExtrato} sem extrato
            </Badge>
          )}
          {data.custosNaoPagos > 0 && (
            <Badge variant="outline" className="border-blue-300 dark:border-blue-700">
              {data.custosNaoPagos} custos pendentes
            </Badge>
          )}
          <Badge variant="outline" className="border-red-300 dark:border-red-700">
            {formatCurrency(data.valorTotalPendente)} pendente
          </Badge>
        </div>

        <ScrollArea className="max-h-[300px]">
          <Accordion type="multiple" className="space-y-1">
            {/* Atrasos de recebimento */}
            {alertasPorTipo.atraso_recebimento.length > 0 && (
              <AccordionItem value="atrasos" className="border-none">
                <AccordionTrigger className={`py-2 px-3 rounded-lg hover:no-underline ${getCor('atraso_recebimento')}`}>
                  <div className="flex items-center gap-2">
                    {getIcone('atraso_recebimento')}
                    <span className="text-sm font-medium">
                      {getTitulo('atraso_recebimento', alertasPorTipo.atraso_recebimento.length)}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 px-1">
                  <div className="space-y-2">
                    {alertasPorTipo.atraso_recebimento.map((alerta, idx) => (
                      <AlertaItem 
                        key={idx} 
                        alerta={alerta} 
                        onNavigate={onNavigateOrcamento}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Parcelas sem extrato */}
            {alertasPorTipo.parcelas_sem_extrato.length > 0 && (
              <AccordionItem value="sem-extrato" className="border-none">
                <AccordionTrigger className={`py-2 px-3 rounded-lg hover:no-underline ${getCor('parcelas_sem_extrato')}`}>
                  <div className="flex items-center gap-2">
                    {getIcone('parcelas_sem_extrato')}
                    <span className="text-sm font-medium">
                      {getTitulo('parcelas_sem_extrato', alertasPorTipo.parcelas_sem_extrato.length)}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 px-1">
                  <div className="space-y-2">
                    {alertasPorTipo.parcelas_sem_extrato.map((alerta, idx) => (
                      <AlertaItem 
                        key={idx} 
                        alerta={alerta} 
                        onNavigate={onNavigateOrcamento}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Custos pendentes */}
            {alertasPorTipo.custos_pendentes.length > 0 && (
              <AccordionItem value="custos" className="border-none">
                <AccordionTrigger className={`py-2 px-3 rounded-lg hover:no-underline ${getCor('custos_pendentes')}`}>
                  <div className="flex items-center gap-2">
                    {getIcone('custos_pendentes')}
                    <span className="text-sm font-medium">
                      {getTitulo('custos_pendentes', alertasPorTipo.custos_pendentes.length)}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 px-1">
                  <div className="space-y-2">
                    {alertasPorTipo.custos_pendentes.map((alerta, idx) => (
                      <AlertaItem 
                        key={idx} 
                        alerta={alerta} 
                        onNavigate={onNavigateOrcamento}
                      />
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

function AlertaItem({ 
  alerta, 
  onNavigate 
}: { 
  alerta: AlertaOrcamento; 
  onNavigate?: (id: string) => void;
}) {
  return (
    <div className="text-sm p-2 bg-background rounded border flex items-center justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs shrink-0">
            {alerta.orcamentoCodigo}
          </Badge>
          <span className="font-medium truncate">{alerta.clienteNome}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{alerta.mensagem}</p>
        {alerta.valor !== undefined && (
          <p className="text-xs font-medium text-foreground mt-0.5">
            {formatCurrency(alerta.valor)}
          </p>
        )}
      </div>
      {onNavigate && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="shrink-0"
          onClick={() => onNavigate(alerta.orcamentoId)}
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
