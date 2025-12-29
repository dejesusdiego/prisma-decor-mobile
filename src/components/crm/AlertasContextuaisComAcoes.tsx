import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Package, 
  Clock, 
  Truck, 
  AlertTriangle,
  X
} from 'lucide-react';
import { AlertaContextual } from '@/hooks/useJornadaCliente';
import { cn } from '@/lib/utils';
import { DialogRegistrarRecebimento } from '@/components/financeiro/dialogs/DialogRegistrarRecebimento';
import { DialogAgendarInstalacao } from '@/components/producao/DialogAgendarInstalacao';
import { DialogAtividade } from '@/components/crm/DialogAtividade';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays } from 'date-fns';

interface AlertasContextuaisComAcoesProps {
  alertas: AlertaContextual[];
  contatoId: string;
  className?: string;
}

const ALERTA_CONFIG: Record<AlertaContextual['tipo'], { 
  icon: React.ElementType;
  variant: 'default' | 'destructive';
  bgClass: string;
}> = {
  parcela_vencendo: { 
    icon: DollarSign, 
    variant: 'default',
    bgClass: 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/30'
  },
  parcela_atrasada: { 
    icon: AlertTriangle, 
    variant: 'destructive',
    bgClass: 'border-destructive/50 bg-destructive/10'
  },
  pedido_pronto: { 
    icon: Package, 
    variant: 'default',
    bgClass: 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/30'
  },
  sem_contato: { 
    icon: Clock, 
    variant: 'default',
    bgClass: 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/30'
  },
  instalacao_pendente: { 
    icon: Truck, 
    variant: 'default',
    bgClass: 'border-purple-500/50 bg-purple-50 dark:bg-purple-950/30'
  }
};

export function AlertasContextuaisComAcoes({ alertas, contatoId, className }: AlertasContextuaisComAcoesProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  
  // Estados para os modais
  const [dialogRecebimentoOpen, setDialogRecebimentoOpen] = useState(false);
  const [parcelaSelecionada, setParcelaSelecionada] = useState<any>(null);
  
  const [dialogInstalacaoOpen, setDialogInstalacaoOpen] = useState(false);
  const [pedidoPreSelecionado, setPedidoPreSelecionado] = useState<string | undefined>();
  
  const [dialogAtividadeOpen, setDialogAtividadeOpen] = useState(false);

  // Buscar parcela por ID quando necessário
  const { data: parcelaData } = useQuery({
    queryKey: ['parcela-alerta', parcelaSelecionada?.id],
    queryFn: async () => {
      if (!parcelaSelecionada?.id) return null;
      const { data, error } = await supabase
        .from('parcelas_receber')
        .select('*, conta:contas_receber(*)')
        .eq('id', parcelaSelecionada.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!parcelaSelecionada?.id
  });

  // Buscar pedidos prontos para instalação
  const { data: pedidosProntos = [] } = useQuery({
    queryKey: ['pedidos-prontos-instalacao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          id,
          orcamento_id,
          numero_pedido,
          status_producao,
          prioridade,
          data_entrada,
          previsao_entrega,
          data_pronto,
          observacoes_producao,
          created_at,
          created_by_user_id,
          orcamento:orcamentos(codigo, cliente_nome, cliente_telefone, endereco, cidade, total_com_desconto, total_geral)
        `)
        .in('status_producao', ['pronto_instalacao', 'pronto_entrega']);
      if (error) throw error;
      // Mapear para o tipo esperado pelo DialogAgendarInstalacao
      return (data || []).map(p => ({
        id: p.id,
        orcamento_id: p.orcamento_id,
        numero_pedido: p.numero_pedido,
        status_producao: 'pronto' as const,
        prioridade: (p.prioridade || 'normal') as 'baixa' | 'normal' | 'alta' | 'urgente',
        data_entrada: p.data_entrada,
        previsao_entrega: p.previsao_entrega,
        data_pronto: p.data_pronto,
        observacoes_producao: p.observacoes_producao,
        created_at: p.created_at,
        created_by_user_id: p.created_by_user_id,
        orcamento: p.orcamento ? {
          codigo: (p.orcamento as any).codigo,
          cliente_nome: (p.orcamento as any).cliente_nome,
          cliente_telefone: (p.orcamento as any).cliente_telefone,
          endereco: (p.orcamento as any).endereco,
          cidade: (p.orcamento as any).cidade,
          total_com_desconto: (p.orcamento as any).total_com_desconto ?? null,
          total_geral: (p.orcamento as any).total_geral ?? null
        } : undefined
      }));
    }
  });

  if (!alertas || alertas.length === 0) return null;

  const alertasVisiveis = alertas.filter(a => !dismissedIds.has(a.id));
  if (alertasVisiveis.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const handleAcao = (alerta: AlertaContextual) => {
    if (alerta.tipo === 'parcela_vencendo' || alerta.tipo === 'parcela_atrasada') {
      // Abrir DialogRegistrarRecebimento com parcela pré-selecionada
      setParcelaSelecionada({ 
        id: alerta.parcelaId,
        numero_parcela: 1, // Será sobrescrito pelo query
        valor: 0 // Será sobrescrito pelo query
      });
      setDialogRecebimentoOpen(true);
    } else if (alerta.tipo === 'pedido_pronto') {
      // Abrir DialogAgendarInstalacao com pedido pré-selecionado
      setPedidoPreSelecionado(alerta.pedidoId);
      setDialogInstalacaoOpen(true);
    } else if (alerta.tipo === 'sem_contato') {
      // Abrir DialogAtividade para criar follow-up
      setDialogAtividadeOpen(true);
    }
  };

  return (
    <>
      <div className={cn("flex flex-col gap-2", className)}>
        {alertasVisiveis.slice(0, 3).map((alerta) => {
          const config = ALERTA_CONFIG[alerta.tipo];
          const Icon = config.icon;

          return (
            <Alert 
              key={alerta.id} 
              variant={config.variant}
              className={cn("relative pr-24", config.bgClass)}
            >
              <Icon className="h-4 w-4" />
              <AlertTitle className="text-sm font-medium">
                {alerta.titulo}
              </AlertTitle>
              <AlertDescription className="text-xs">
                {alerta.descricao}
              </AlertDescription>
              
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {alerta.acao && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => handleAcao(alerta)}
                  >
                    {alerta.acao.label}
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => handleDismiss(alerta.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </Alert>
          );
        })}
        
        {alertasVisiveis.length > 3 && (
          <p className="text-xs text-muted-foreground text-center">
            +{alertasVisiveis.length - 3} alertas adicionais
          </p>
        )}
      </div>

      {/* Modal Registrar Recebimento */}
      <DialogRegistrarRecebimento
        open={dialogRecebimentoOpen}
        onOpenChange={setDialogRecebimentoOpen}
        parcela={parcelaData || parcelaSelecionada}
      />

      {/* Modal Agendar Instalação */}
      <DialogAgendarInstalacao
        open={dialogInstalacaoOpen}
        onOpenChange={setDialogInstalacaoOpen}
        pedidosDisponiveis={pedidosProntos}
        pedidoPreSelecionado={pedidoPreSelecionado}
      />

      {/* Modal Nova Atividade (Follow-up) */}
      <DialogAtividade
        open={dialogAtividadeOpen}
        onOpenChange={setDialogAtividadeOpen}
        contatoIdInicial={contatoId}
      />
    </>
  );
}
