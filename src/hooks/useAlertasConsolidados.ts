import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { addDays, format, isBefore, startOfDay } from 'date-fns';
import { parseDateOnly } from '@/lib/dateOnly';

interface Alerta {
  id: string;
  tipo: 'follow_up' | 'conta_vencer' | 'pedido_pronto' | 'orcamento_sem_resposta';
  titulo: string;
  descricao: string;
  prioridade: 'alta' | 'normal' | 'baixa';
  dataReferencia: Date;
  referenciaId?: string;
  referenciaTipo?: string;
}

export function useAlertasConsolidados() {
  const { organizationId } = useOrganizationContext();
  
  return useQuery({
    queryKey: ['alertas-consolidados', organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID required');
      
      const hoje = startOfDay(new Date());
      const tresDiasDepois = addDays(hoje, 3);
      const alertas: Alerta[] = [];

      // 1. Follow-ups pendentes (atividades não concluídas com data passada ou hoje)
      const { data: followUps } = await supabase
        .from('atividades_crm')
        .select('id, titulo, data_atividade, contato_id, tipo')
        .eq('organization_id', organizationId)
        .eq('concluida', false)
        .lte('data_atividade', new Date().toISOString())
        .order('data_atividade', { ascending: true })
        .limit(10);

      followUps?.forEach(f => {
        const dataAtividade = parseDateOnly(f.data_atividade) || new Date();
        alertas.push({
          id: `followup-${f.id}`,
          tipo: 'follow_up',
          titulo: f.titulo,
          descricao: `Atividade ${f.tipo} pendente`,
          prioridade: isBefore(dataAtividade, hoje) ? 'alta' : 'normal',
          dataReferencia: dataAtividade,
          referenciaId: f.id,
          referenciaTipo: 'atividade'
        });
      });

      // 2. Contas a vencer em 3 dias
      const { data: contasVencer } = await supabase
        .from('contas_pagar')
        .select('id, descricao, valor, data_vencimento, fornecedor')
        .eq('organization_id', organizationId)
        .eq('status', 'pendente')
        .gte('data_vencimento', format(hoje, 'yyyy-MM-dd'))
        .lte('data_vencimento', format(tresDiasDepois, 'yyyy-MM-dd'))
        .order('data_vencimento', { ascending: true })
        .limit(10);

      contasVencer?.forEach(c => {
        const vencimentoHoje = c.data_vencimento === format(hoje, 'yyyy-MM-dd');
        alertas.push({
          id: `conta-${c.id}`,
          tipo: 'conta_vencer',
          titulo: c.descricao,
          descricao: `R$ ${c.valor.toFixed(2)} - ${c.fornecedor || 'Sem fornecedor'}`,
          prioridade: vencimentoHoje ? 'alta' : 'normal',
          dataReferencia: parseDateOnly(c.data_vencimento) || new Date(),
          referenciaId: c.id,
          referenciaTipo: 'conta_pagar'
        });
      });

      // 3. Pedidos prontos para instalação/entrega
      const { data: pedidosProntos } = await supabase
        .from('pedidos')
        .select(`
          id, 
          numero_pedido, 
          status_producao,
          orcamento:orcamentos(cliente_nome)
        `)
        .eq('organization_id', organizationId)
        .in('status_producao', ['pronto_instalacao', 'pronto_entrega'])
        .order('updated_at', { ascending: false })
        .limit(10);

      pedidosProntos?.forEach(p => {
        alertas.push({
          id: `pedido-${p.id}`,
          tipo: 'pedido_pronto',
          titulo: `Pedido ${p.numero_pedido}`,
          descricao: `${p.orcamento?.cliente_nome || 'Cliente'} - ${p.status_producao === 'pronto_instalacao' ? 'Pronto para instalação' : 'Pronto para entrega'}`,
          prioridade: 'alta',
          dataReferencia: new Date(),
          referenciaId: p.id,
          referenciaTipo: 'pedido'
        });
      });

      // 4. Orçamentos sem resposta há mais de 7 dias
      const seteDiasAtras = addDays(hoje, -7);
      const { data: orcamentosSemResposta } = await supabase
        .from('orcamentos')
        .select('id, codigo, cliente_nome, total_geral, status_updated_at')
        .eq('organization_id', organizationId)
        .eq('status', 'sem_resposta')
        .lte('status_updated_at', seteDiasAtras.toISOString())
        .order('status_updated_at', { ascending: true })
        .limit(10);

      orcamentosSemResposta?.forEach(o => {
        alertas.push({
          id: `orcamento-${o.id}`,
          tipo: 'orcamento_sem_resposta',
          titulo: `${o.codigo} - ${o.cliente_nome}`,
          descricao: `R$ ${(o.total_geral || 0).toFixed(2)} - Sem resposta há mais de 7 dias`,
          prioridade: 'normal',
          dataReferencia: new Date(o.status_updated_at || new Date()),
          referenciaId: o.id,
          referenciaTipo: 'orcamento'
        });
      });

      // Ordenar por prioridade e data
      return alertas.sort((a, b) => {
        const prioridadeOrder = { alta: 0, normal: 1, baixa: 2 };
        if (prioridadeOrder[a.prioridade] !== prioridadeOrder[b.prioridade]) {
          return prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade];
        }
        return a.dataReferencia.getTime() - b.dataReferencia.getTime();
      });
    },
    enabled: !!organizationId,
    refetchInterval: 60000 // Atualizar a cada minuto
  });
}
