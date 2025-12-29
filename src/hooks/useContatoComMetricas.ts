import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, format } from 'date-fns';

export interface ContatoComMetricas {
  id: string;
  nome: string;
  telefone: string | null;
  telefone_secundario: string | null;
  email: string | null;
  cidade: string | null;
  endereco: string | null;
  tipo: string;
  origem: string | null;
  tags: string[] | null;
  observacoes: string | null;
  valor_total_gasto: number | null;
  created_at: string;
  updated_at: string;
  created_by_user_id: string;
  ultima_interacao_em: string | null;
  // Métricas calculadas
  temperatura: 'quente' | 'morno' | 'frio';
  diasSemContato: number;
  orcamentosPendentes: number;
  orcamentosTotal: number;
  atividadesPendentes: number;
  proximaAtividade: {
    id: string;
    titulo: string;
    data: string;
    tipo: string;
  } | null;
  ultimoOrcamento: {
    id: string;
    codigo: string;
    status: string;
    valor: number;
    data: string;
  } | null;
  // Métricas de produção e financeiro
  pedidosEmProducao: number;
  pedidosProntos: number;
  instalacoesAgendadas: number;
  proximaInstalacao: {
    id: string;
    data: string;
    turno: string;
    status: string;
  } | null;
  valorAReceber: number;
  valorVencido: number;
}

export function useContatosComMetricas() {
  return useQuery({
    queryKey: ['contatos-com-metricas'],
    queryFn: async () => {
      // Buscar todos os contatos
      const { data: contatos, error: errorContatos } = await supabase
        .from('contatos')
        .select('*')
        .order('ultima_interacao_em', { ascending: false, nullsFirst: false });

      if (errorContatos) throw errorContatos;
      if (!contatos) return [];

      // Buscar orçamentos agregados por contato
      const { data: orcamentos, error: errorOrc } = await supabase
        .from('orcamentos')
        .select('id, codigo, status, total_com_desconto, total_geral, contato_id, created_at, updated_at')
        .not('contato_id', 'is', null);

      if (errorOrc) throw errorOrc;

      // Buscar atividades pendentes por contato
      const { data: atividades, error: errorAtiv } = await supabase
        .from('atividades_crm')
        .select('id, titulo, tipo, contato_id, data_atividade, concluida')
        .eq('concluida', false)
        .not('contato_id', 'is', null)
        .order('data_atividade', { ascending: true });

      if (errorAtiv) throw errorAtiv;

      // Buscar pedidos com orçamentos vinculados a contatos
      const orcamentoIds = orcamentos?.map(o => o.id) || [];
      const { data: pedidos, error: errorPed } = await supabase
        .from('pedidos')
        .select('id, numero_pedido, status_producao, orcamento_id')
        .in('orcamento_id', orcamentoIds.length > 0 ? orcamentoIds : ['00000000-0000-0000-0000-000000000000']);

      if (errorPed) throw errorPed;

      // Buscar instalações dos pedidos
      const pedidoIds = pedidos?.map(p => p.id) || [];
      const { data: instalacoes, error: errorInst } = await supabase
        .from('instalacoes')
        .select('id, data_agendada, turno, status, pedido_id')
        .in('pedido_id', pedidoIds.length > 0 ? pedidoIds : ['00000000-0000-0000-0000-000000000000'])
        .in('status', ['agendada', 'confirmada'])
        .order('data_agendada', { ascending: true });

      if (errorInst) throw errorInst;

      // Buscar contas a receber vinculadas aos orçamentos
      const { data: contasReceber, error: errorCR } = await supabase
        .from('contas_receber')
        .select('id, orcamento_id, valor_total, valor_pago, status, data_vencimento')
        .in('orcamento_id', orcamentoIds.length > 0 ? orcamentoIds : ['00000000-0000-0000-0000-000000000000']);

      if (errorCR) throw errorCR;

      const hoje = new Date();
      const hojeStr = format(hoje, 'yyyy-MM-dd');

      // Mapear contatos com métricas
      const contatosComMetricas: ContatoComMetricas[] = contatos.map(contato => {
        const orcamentosContato = orcamentos?.filter(o => o.contato_id === contato.id) || [];
        const atividadesContato = atividades?.filter(a => a.contato_id === contato.id) || [];
        const orcamentoIdsContato = orcamentosContato.map(o => o.id);
        
        // Pedidos do contato
        const pedidosContato = pedidos?.filter(p => orcamentoIdsContato.includes(p.orcamento_id)) || [];
        const statusProducao = ['em_corte', 'em_costura', 'aguardando_materiais'];
        const statusProntos = ['pronto_instalacao', 'pronto_entrega'];
        const pedidosEmProducao = pedidosContato.filter(p => statusProducao.includes(p.status_producao)).length;
        const pedidosProntos = pedidosContato.filter(p => statusProntos.includes(p.status_producao)).length;
        
        // Instalações do contato
        const pedidoIdsContato = pedidosContato.map(p => p.id);
        const instalacoesContato = instalacoes?.filter(i => pedidoIdsContato.includes(i.pedido_id)) || [];
        const instalacoesAgendadas = instalacoesContato.length;
        const proximaInst = instalacoesContato[0];
        
        // Financeiro do contato
        const contasContato = contasReceber?.filter(c => orcamentoIdsContato.includes(c.orcamento_id || '')) || [];
        const valorAReceber = contasContato
          .filter(c => c.status !== 'pago')
          .reduce((sum, c) => sum + (c.valor_total - c.valor_pago), 0);
        const valorVencido = contasContato
          .filter(c => c.status !== 'pago' && c.data_vencimento < hojeStr)
          .reduce((sum, c) => sum + (c.valor_total - c.valor_pago), 0);
        
        // Calcular dias sem contato
        const ultimaInteracao = contato.ultima_interacao_em || contato.updated_at;
        const diasSemContato = differenceInDays(new Date(), new Date(ultimaInteracao));
        
        // Orçamentos pendentes (não pagos e não cancelados/recusados)
        const statusPendentes = ['rascunho', 'finalizado', 'enviado', 'sem_resposta', 'pago_40', 'pago_parcial', 'pago_60'];
        const orcamentosPendentes = orcamentosContato.filter(o => statusPendentes.includes(o.status)).length;
        
        // Último orçamento
        const ultimoOrc = orcamentosContato.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        // Calcular temperatura baseada no último orçamento e atividade
        let temperatura: 'quente' | 'morno' | 'frio' = 'morno';
        if (ultimoOrc) {
          const statusQuentes = ['pago_40', 'pago_parcial', 'pago_60', 'pago'];
          const statusFrios = ['sem_resposta', 'recusado', 'cancelado'];
          
          if (statusQuentes.includes(ultimoOrc.status)) {
            temperatura = 'quente';
          } else if (statusFrios.includes(ultimoOrc.status)) {
            temperatura = 'frio';
          } else if (diasSemContato > 14) {
            temperatura = 'frio';
          } else if (diasSemContato <= 3) {
            temperatura = 'quente';
          }
        } else if (diasSemContato > 7) {
          temperatura = 'frio';
        }
        
        // Próxima atividade
        const proximaAtiv = atividadesContato[0];
        
        return {
          id: contato.id,
          nome: contato.nome,
          telefone: contato.telefone,
          telefone_secundario: contato.telefone_secundario,
          email: contato.email,
          cidade: contato.cidade,
          endereco: contato.endereco,
          tipo: contato.tipo,
          origem: contato.origem,
          tags: contato.tags,
          observacoes: contato.observacoes,
          valor_total_gasto: contato.valor_total_gasto,
          created_at: contato.created_at,
          updated_at: contato.updated_at,
          created_by_user_id: contato.created_by_user_id,
          ultima_interacao_em: contato.ultima_interacao_em,
          temperatura,
          diasSemContato,
          orcamentosPendentes,
          orcamentosTotal: orcamentosContato.length,
          atividadesPendentes: atividadesContato.length,
          proximaAtividade: proximaAtiv ? {
            id: proximaAtiv.id,
            titulo: proximaAtiv.titulo,
            data: proximaAtiv.data_atividade,
            tipo: proximaAtiv.tipo
          } : null,
          ultimoOrcamento: ultimoOrc ? {
            id: ultimoOrc.id,
            codigo: ultimoOrc.codigo,
            status: ultimoOrc.status,
            valor: ultimoOrc.total_com_desconto || ultimoOrc.total_geral || 0,
            data: ultimoOrc.created_at
          } : null,
          // Novas métricas de produção e financeiro
          pedidosEmProducao,
          pedidosProntos,
          instalacoesAgendadas,
          proximaInstalacao: proximaInst ? {
            id: proximaInst.id,
            data: proximaInst.data_agendada,
            turno: proximaInst.turno,
            status: proximaInst.status
          } : null,
          valorAReceber,
          valorVencido
        };
      });
      return contatosComMetricas;
    }
  });
}

// Hook para buscar um contato específico com métricas
export function useContatoMetricas(contatoId: string | null) {
  const { data: contatos } = useContatosComMetricas();
  
  if (!contatoId || !contatos) return null;
  return contatos.find(c => c.id === contatoId) || null;
}
