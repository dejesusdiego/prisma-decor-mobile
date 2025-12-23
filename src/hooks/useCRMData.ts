import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export type ContatoTipo = 'lead' | 'cliente' | 'inativo';
export type OportunidadeEtapa = 'prospeccao' | 'qualificacao' | 'proposta' | 'negociacao' | 'fechado_ganho' | 'fechado_perdido';
export type OportunidadeTemperatura = 'quente' | 'morno' | 'frio';
export type AtividadeTipo = 'ligacao' | 'email' | 'reuniao' | 'visita' | 'whatsapp' | 'outro';

export interface Contato {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  telefone_secundario: string | null;
  cidade: string | null;
  endereco: string | null;
  tipo: string;
  origem: string | null;
  observacoes: string | null;
  tags: string[] | null;
  valor_total_gasto: number | null;
  created_at: string;
  updated_at: string;
  created_by_user_id: string;
}

export interface Oportunidade {
  id: string;
  contato_id: string | null;
  orcamento_id: string | null;
  titulo: string;
  valor_estimado: number | null;
  etapa: string;
  temperatura: string | null;
  motivo_perda: string | null;
  data_previsao_fechamento: string | null;
  observacoes: string | null;
  origem: string | null;
  created_at: string;
  updated_at: string;
  created_by_user_id: string;
  contato?: Contato;
}

export interface Atividade {
  id: string;
  contato_id: string | null;
  oportunidade_id: string | null;
  orcamento_id: string | null;
  tipo: string;
  titulo: string;
  descricao: string | null;
  data_atividade: string;
  data_lembrete: string | null;
  concluida: boolean;
  created_at: string;
  updated_at: string;
  created_by_user_id: string;
  contato?: Contato;
}

// ============ CONTATOS ============

export function useContatos() {
  return useQuery({
    queryKey: ['contatos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contatos')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data as Contato[];
    }
  });
}

export function useContato(id: string | null) {
  return useQuery({
    queryKey: ['contato', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('contatos')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Contato | null;
    },
    enabled: !!id
  });
}

export function useContatoByTelefone(telefone: string | null) {
  return useQuery({
    queryKey: ['contato-telefone', telefone],
    queryFn: async () => {
      if (!telefone || telefone.length < 10) return null;
      const { data, error } = await supabase
        .from('contatos')
        .select('*')
        .eq('telefone', telefone)
        .maybeSingle();
      
      if (error) throw error;
      return data as Contato | null;
    },
    enabled: !!telefone && telefone.length >= 10
  });
}

export function useCreateContato() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (contato: Partial<Contato>) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('contatos')
        .insert([{
          nome: contato.nome || '',
          email: contato.email,
          telefone: contato.telefone,
          telefone_secundario: contato.telefone_secundario,
          cidade: contato.cidade,
          endereco: contato.endereco,
          tipo: contato.tipo || 'lead',
          origem: contato.origem,
          observacoes: contato.observacoes,
          tags: contato.tags,
          created_by_user_id: user.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contatos'] });
      toast.success('Contato criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar contato:', error);
      toast.error('Erro ao criar contato');
    }
  });
}

export function useUpdateContato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...contato }: Partial<Contato> & { id: string }) => {
      const { data, error } = await supabase
        .from('contatos')
        .update(contato)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contatos'] });
      queryClient.invalidateQueries({ queryKey: ['contato', variables.id] });
      toast.success('Contato atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar contato:', error);
      toast.error('Erro ao atualizar contato');
    }
  });
}

export function useDeleteContato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contatos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contatos'] });
      toast.success('Contato excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir contato:', error);
      toast.error('Erro ao excluir contato');
    }
  });
}

// ============ OPORTUNIDADES ============

export function useOportunidades() {
  return useQuery({
    queryKey: ['oportunidades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('oportunidades')
        .select(`
          *,
          contato:contatos(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (Oportunidade & { contato: Contato | null })[];
    }
  });
}

export function useCreateOportunidade() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (oportunidade: Partial<Oportunidade>) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('oportunidades')
        .insert([{
          titulo: oportunidade.titulo || '',
          contato_id: oportunidade.contato_id,
          orcamento_id: oportunidade.orcamento_id,
          valor_estimado: oportunidade.valor_estimado,
          etapa: oportunidade.etapa || 'prospeccao',
          temperatura: oportunidade.temperatura,
          motivo_perda: oportunidade.motivo_perda,
          data_previsao_fechamento: oportunidade.data_previsao_fechamento,
          observacoes: oportunidade.observacoes,
          origem: oportunidade.origem,
          created_by_user_id: user.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oportunidades'] });
      queryClient.invalidateQueries({ queryKey: ['crm-metrics'] });
      toast.success('Oportunidade criada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar oportunidade:', error);
      toast.error('Erro ao criar oportunidade');
    }
  });
}

export function useUpdateOportunidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...oportunidade }: Partial<Oportunidade> & { id: string }) => {
      const { data, error } = await supabase
        .from('oportunidades')
        .update(oportunidade)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oportunidades'] });
      queryClient.invalidateQueries({ queryKey: ['crm-metrics'] });
      toast.success('Oportunidade atualizada!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar oportunidade:', error);
      toast.error('Erro ao atualizar oportunidade');
    }
  });
}

export function useDeleteOportunidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('oportunidades')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oportunidades'] });
      queryClient.invalidateQueries({ queryKey: ['crm-metrics'] });
      toast.success('Oportunidade excluída!');
    },
    onError: (error) => {
      console.error('Erro ao excluir oportunidade:', error);
      toast.error('Erro ao excluir oportunidade');
    }
  });
}

// ============ ATIVIDADES ============

export function useAtividades(filters?: { contatoId?: string; pendentes?: boolean }) {
  return useQuery({
    queryKey: ['atividades', filters],
    queryFn: async () => {
      let query = supabase
        .from('atividades_crm')
        .select(`
          *,
          contato:contatos(*)
        `)
        .order('data_atividade', { ascending: false });

      if (filters?.contatoId) {
        query = query.eq('contato_id', filters.contatoId);
      }

      if (filters?.pendentes) {
        query = query.eq('concluida', false);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as (Atividade & { contato: Contato | null })[];
    }
  });
}

export function useAtividadesPendentesHoje() {
  return useQuery({
    queryKey: ['atividades-pendentes-hoje'],
    queryFn: async () => {
      const hoje = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('atividades_crm')
        .select(`
          *,
          contato:contatos(nome, telefone)
        `)
        .eq('concluida', false)
        .lte('data_lembrete', hoje + 'T23:59:59')
        .order('data_lembrete');
      
      if (error) throw error;
      return data;
    }
  });
}

export function useCreateAtividade() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (atividade: Partial<Atividade>) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('atividades_crm')
        .insert([{
          tipo: atividade.tipo || 'outro',
          titulo: atividade.titulo || '',
          descricao: atividade.descricao,
          contato_id: atividade.contato_id,
          oportunidade_id: atividade.oportunidade_id,
          orcamento_id: atividade.orcamento_id,
          data_atividade: atividade.data_atividade || new Date().toISOString(),
          data_lembrete: atividade.data_lembrete,
          concluida: atividade.concluida || false,
          created_by_user_id: user.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      queryClient.invalidateQueries({ queryKey: ['atividades-pendentes-hoje'] });
      toast.success('Atividade registrada!');
    },
    onError: (error) => {
      console.error('Erro ao criar atividade:', error);
      toast.error('Erro ao criar atividade');
    }
  });
}

export function useUpdateAtividade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...atividade }: Partial<Atividade> & { id: string }) => {
      const { data, error } = await supabase
        .from('atividades_crm')
        .update(atividade)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
      queryClient.invalidateQueries({ queryKey: ['atividades-pendentes-hoje'] });
      toast.success('Atividade atualizada!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar atividade:', error);
      toast.error('Erro ao atualizar atividade');
    }
  });
}

// ============ MÉTRICAS CRM ============

export function useCRMMetrics() {
  return useQuery({
    queryKey: ['crm-metrics'],
    queryFn: async () => {
      // Contatos por tipo
      const { data: contatos, error: contatosError } = await supabase
        .from('contatos')
        .select('tipo');
      
      if (contatosError) throw contatosError;

      const contatosPorTipo = {
        lead: contatos.filter(c => c.tipo === 'lead').length,
        cliente: contatos.filter(c => c.tipo === 'cliente').length,
        inativo: contatos.filter(c => c.tipo === 'inativo').length,
        total: contatos.length
      };

      // Oportunidades
      const { data: oportunidades, error: opError } = await supabase
        .from('oportunidades')
        .select('etapa, valor_estimado');
      
      if (opError) throw opError;

      const oportunidadesAbertas = oportunidades.filter(
        o => !['fechado_ganho', 'fechado_perdido'].includes(o.etapa)
      );
      const oportunidadesGanhas = oportunidades.filter(o => o.etapa === 'fechado_ganho');
      const oportunidadesPerdidas = oportunidades.filter(o => o.etapa === 'fechado_perdido');

      const valorPipeline = oportunidadesAbertas.reduce(
        (sum, o) => sum + (o.valor_estimado || 0), 0
      );

      const taxaConversao = oportunidades.length > 0
        ? (oportunidadesGanhas.length / (oportunidadesGanhas.length + oportunidadesPerdidas.length)) * 100
        : 0;

      // Oportunidades por etapa para funil
      const etapas = ['prospeccao', 'qualificacao', 'proposta', 'negociacao', 'fechado_ganho', 'fechado_perdido'];
      const funilVendas = etapas.map(etapa => ({
        etapa,
        quantidade: oportunidades.filter(o => o.etapa === etapa).length,
        valor: oportunidades.filter(o => o.etapa === etapa).reduce((sum, o) => sum + (o.valor_estimado || 0), 0)
      }));

      // Atividades pendentes hoje
      const hoje = new Date().toISOString().split('T')[0];
      const { count: followUpsPendentes } = await supabase
        .from('atividades_crm')
        .select('*', { count: 'exact', head: true })
        .eq('concluida', false)
        .lte('data_lembrete', hoje + 'T23:59:59');

      return {
        contatos: contatosPorTipo,
        oportunidades: {
          total: oportunidades.length,
          abertas: oportunidadesAbertas.length,
          ganhas: oportunidadesGanhas.length,
          perdidas: oportunidadesPerdidas.length,
          valorPipeline,
          taxaConversao: isNaN(taxaConversao) ? 0 : taxaConversao
        },
        funilVendas,
        followUpsPendentes: followUpsPendentes || 0
      };
    }
  });
}

// ============ ORÇAMENTOS DO CONTATO ============

export function useOrcamentosDoContato(contatoId: string | null) {
  return useQuery({
    queryKey: ['orcamentos-contato', contatoId],
    queryFn: async () => {
      if (!contatoId) return [];
      
      const { data, error } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('contato_id', contatoId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!contatoId
  });
}
