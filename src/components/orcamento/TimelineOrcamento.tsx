import { CheckCircle2, Circle, Clock, FileText, Send, CreditCard, DollarSign, XCircle, ArrowUpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimelineOrcamentoProps {
  status: string;
  createdAt: string;
  statusUpdatedAt?: string | null;
  valorTotal: number;
  valorRecebido: number;
  custoTotal: number;
  custosPagos: number;
}

interface EtapaTimeline {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'pending' | 'error';
  data?: string;
  descricao?: string;
}

export function TimelineOrcamento({
  status,
  createdAt,
  statusUpdatedAt,
  valorTotal,
  valorRecebido,
  custoTotal,
  custosPagos
}: TimelineOrcamentoProps) {
  
  const percentualRecebido = valorTotal > 0 ? (valorRecebido / valorTotal) * 100 : 0;
  const percentualCustosPagos = custoTotal > 0 ? (custosPagos / custoTotal) * 100 : 0;

  // Determinar status de cada etapa baseado no status atual
  const getEtapas = (): EtapaTimeline[] => {
    const etapas: EtapaTimeline[] = [];

    // 1. Criação
    etapas.push({
      id: 'criacao',
      label: 'Orçamento Criado',
      icon: <FileText className="h-4 w-4" />,
      status: 'completed',
      data: format(new Date(createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
      descricao: 'Orçamento foi criado no sistema'
    });

    // 2. Finalização
    const statusFinalizados = ['finalizado', 'enviado', 'pago_40', 'pago_parcial', 'pago_60', 'pago', 'recusado', 'cancelado'];
    const isFinalizado = statusFinalizados.includes(status);
    etapas.push({
      id: 'finalizacao',
      label: 'Finalizado',
      icon: <CheckCircle2 className="h-4 w-4" />,
      status: isFinalizado ? 'completed' : status === 'rascunho' ? 'current' : 'pending',
      descricao: isFinalizado ? 'Orçamento pronto para enviar' : 'Aguardando finalização'
    });

    // 3. Envio
    const statusEnviados = ['enviado', 'pago_40', 'pago_parcial', 'pago_60', 'pago', 'recusado'];
    const isEnviado = statusEnviados.includes(status);
    etapas.push({
      id: 'envio',
      label: 'Enviado ao Cliente',
      icon: <Send className="h-4 w-4" />,
      status: isEnviado ? 'completed' : status === 'finalizado' ? 'current' : 'pending',
      descricao: isEnviado ? 'Cliente recebeu o orçamento' : 'Aguardando envio'
    });

    // Verificar se foi recusado/cancelado
    if (status === 'recusado' || status === 'cancelado') {
      etapas.push({
        id: 'recusado',
        label: status === 'recusado' ? 'Recusado' : 'Cancelado',
        icon: <XCircle className="h-4 w-4" />,
        status: 'error',
        descricao: status === 'recusado' ? 'Cliente recusou o orçamento' : 'Orçamento foi cancelado'
      });
      return etapas;
    }

    // 4. Pagamentos
    const statusPagamento = ['pago_40', 'pago_parcial', 'pago_60', 'pago'];
    const temPagamento = statusPagamento.includes(status);
    
    let descricaoPagamento = 'Aguardando aprovação do cliente';
    if (percentualRecebido >= 100) {
      descricaoPagamento = 'Totalmente quitado';
    } else if (percentualRecebido >= 60) {
      descricaoPagamento = `${percentualRecebido.toFixed(0)}% recebido`;
    } else if (percentualRecebido >= 40) {
      descricaoPagamento = `${percentualRecebido.toFixed(0)}% recebido (sinal)`;
    } else if (percentualRecebido > 0) {
      descricaoPagamento = `${percentualRecebido.toFixed(0)}% recebido`;
    }

    etapas.push({
      id: 'pagamentos',
      label: 'Pagamentos',
      icon: <CreditCard className="h-4 w-4" />,
      status: status === 'pago' ? 'completed' : temPagamento ? 'current' : status === 'enviado' ? 'current' : 'pending',
      descricao: descricaoPagamento
    });

    // 5. Custos pagos (opcional - só aparece se tem custos)
    if (custoTotal > 0) {
      etapas.push({
        id: 'custos',
        label: 'Custos Pagos',
        icon: <ArrowUpCircle className="h-4 w-4" />,
        status: percentualCustosPagos >= 100 ? 'completed' : percentualCustosPagos > 0 ? 'current' : 'pending',
        descricao: percentualCustosPagos >= 100 
          ? 'Todos os custos foram pagos' 
          : percentualCustosPagos > 0 
            ? `${percentualCustosPagos.toFixed(0)}% dos custos pagos`
            : 'Custos pendentes de pagamento'
      });
    }

    // 6. Conclusão
    const isConcluido = status === 'pago' && percentualCustosPagos >= 100;
    etapas.push({
      id: 'conclusao',
      label: 'Concluído',
      icon: <DollarSign className="h-4 w-4" />,
      status: isConcluido ? 'completed' : status === 'pago' ? 'current' : 'pending',
      descricao: isConcluido ? 'Orçamento finalizado com sucesso!' : 'Aguardando quitação'
    });

    return etapas;
  };

  const etapas = getEtapas();

  const getStatusStyles = (etapaStatus: EtapaTimeline['status']) => {
    switch (etapaStatus) {
      case 'completed':
        return {
          circle: 'bg-green-500 text-white border-green-500',
          line: 'bg-green-500',
          text: 'text-foreground',
          desc: 'text-green-600 dark:text-green-400'
        };
      case 'current':
        return {
          circle: 'bg-primary text-primary-foreground border-primary animate-pulse',
          line: 'bg-muted',
          text: 'text-foreground font-semibold',
          desc: 'text-primary'
        };
      case 'error':
        return {
          circle: 'bg-destructive text-destructive-foreground border-destructive',
          line: 'bg-destructive',
          text: 'text-destructive',
          desc: 'text-destructive'
        };
      default:
        return {
          circle: 'bg-muted text-muted-foreground border-muted-foreground/30',
          line: 'bg-muted',
          text: 'text-muted-foreground',
          desc: 'text-muted-foreground'
        };
    }
  };

  return (
    <div className="w-full">
      {/* Timeline horizontal para desktop */}
      <div className="hidden md:block">
        <div className="flex items-start justify-between relative">
          {etapas.map((etapa, index) => {
            const styles = getStatusStyles(etapa.status);
            const isLast = index === etapas.length - 1;

            return (
              <div key={etapa.id} className="flex flex-col items-center flex-1 relative">
                {/* Linha conectora */}
                {!isLast && (
                  <div 
                    className={cn(
                      "absolute top-4 left-1/2 w-full h-0.5",
                      etapa.status === 'completed' ? 'bg-green-500' : 'bg-muted'
                    )} 
                  />
                )}
                
                {/* Círculo do passo */}
                <div 
                  className={cn(
                    "relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center",
                    styles.circle
                  )}
                >
                  {etapa.icon}
                </div>
                
                {/* Labels */}
                <div className="mt-2 text-center max-w-[100px]">
                  <p className={cn("text-xs font-medium leading-tight", styles.text)}>
                    {etapa.label}
                  </p>
                  {etapa.descricao && (
                    <p className={cn("text-[10px] mt-0.5 leading-tight", styles.desc)}>
                      {etapa.descricao}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline vertical para mobile */}
      <div className="md:hidden space-y-3">
        {etapas.map((etapa, index) => {
          const styles = getStatusStyles(etapa.status);
          const isLast = index === etapas.length - 1;

          return (
            <div key={etapa.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div 
                  className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0",
                    styles.circle
                  )}
                >
                  {etapa.icon}
                </div>
                {!isLast && (
                  <div 
                    className={cn(
                      "w-0.5 flex-1 min-h-[20px] mt-1",
                      etapa.status === 'completed' ? 'bg-green-500' : 'bg-muted'
                    )} 
                  />
                )}
              </div>
              <div className="pt-1 pb-2">
                <p className={cn("text-sm font-medium", styles.text)}>
                  {etapa.label}
                </p>
                {etapa.descricao && (
                  <p className={cn("text-xs", styles.desc)}>
                    {etapa.descricao}
                  </p>
                )}
                {etapa.data && (
                  <p className="text-[10px] text-muted-foreground">
                    {etapa.data}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
