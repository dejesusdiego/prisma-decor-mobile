import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

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

      // Mapear contatos com métricas
      const contatosComMetricas: ContatoComMetricas[] = contatos.map(contato => {
        const orcamentosContato = orcamentos?.filter(o => o.contato_id === contato.id) || [];
        const atividadesContato = atividades?.filter(a => a.contato_id === contato.id) || [];
        
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
          } : null
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
