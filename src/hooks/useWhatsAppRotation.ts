import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VendedorRotation {
  user_id: string;
  user_name: string;
  user_whatsapp: string;
  index_position: number;
}

export interface WhatsAppRotationConfig {
  enabled: boolean;
  vendedores: string[]; // array de user_ids
  lastIndex: number;
}

export interface VendedorInfo {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  phone: string | null;
}

// Type extensions for database schema not yet in types file
interface OrganizationWithWhatsApp {
  whatsapp_rotation_enabled: boolean | null;
  whatsapp_vendedores: string[] | null;
  whatsapp_last_vendedor_index: number | null;
}

interface NextVendedorResult {
  user_id: string;
  user_name: string;
  user_whatsapp: string;
  index_position: number;
}

interface AssignLeadResult {
  success: boolean;
  assignment_id: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

/**
 * Hook para buscar configuração de rodízio de WhatsApp
 */
export function useWhatsAppRotationConfig(organizationId: string | null) {
  return useQuery({
    queryKey: ['whatsapp-rotation-config', organizationId],
    queryFn: async (): Promise<WhatsAppRotationConfig> => {
      if (!organizationId) {
        return { enabled: false, vendedores: [], lastIndex: 0 };
      }

      const { data, error } = await (supabase as AnySupabase)
        .from('organizations')
        .select('whatsapp_rotation_enabled, whatsapp_vendedores, whatsapp_last_vendedor_index')
        .eq('id', organizationId)
        .single();

      if (error) throw error;

      const orgData = data as unknown as OrganizationWithWhatsApp;

      return {
        enabled: orgData?.whatsapp_rotation_enabled || false,
        vendedores: orgData?.whatsapp_vendedores || [],
        lastIndex: orgData?.whatsapp_last_vendedor_index || 0,
      };
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para buscar próximo vendedor do rodízio
 */
export function useNextVendedor(organizationId: string | null) {
  return useQuery({
    queryKey: ['next-vendedor-whatsapp', organizationId],
    queryFn: async (): Promise<VendedorRotation | null> => {
      if (!organizationId) return null;

      const { data, error } = await (supabase as AnySupabase)
        .rpc('get_next_vendedor_whatsapp', { p_org_id: organizationId });

      if (error) {
        console.error('Erro ao buscar próximo vendedor:', error);
        return null;
      }

      if (!data || (data as NextVendedorResult[]).length === 0) return null;

      const vendedor = (data as NextVendedorResult[])[0];
      return {
        user_id: vendedor.user_id,
        user_name: vendedor.user_name,
        user_whatsapp: vendedor.user_whatsapp,
        index_position: vendedor.index_position,
      };
    },
    enabled: !!organizationId,
    // Não cachear - sempre buscar próximo ao usar
    staleTime: 0,
    gcTime: 0,
  });
}

/**
 * Hook para listar vendedores disponíveis na organização
 * Busca de organization_members + auth.users
 */
export function useAvailableVendedores(organizationId: string | null) {
  return useQuery({
    queryKey: ['available-vendedores', organizationId],
    queryFn: async (): Promise<VendedorInfo[]> => {
      if (!organizationId) return [];

      // Buscar membros da organização
      const { data: members, error: membersError } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', organizationId);

      if (membersError) throw membersError;
      if (!members || members.length === 0) return [];

      const userIds = members.map(m => m.user_id);

      // Buscar dados dos usuários via auth admin (requer service role)
      // Por enquanto, retornar com dados básicos
      const vendedores: VendedorInfo[] = userIds.map((id: string) => ({
        id,
        name: 'Usuário ' + id.slice(0, 8),
        email: '',
        whatsapp: null,
        phone: null,
      }));

      return vendedores;
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para atualizar configuração de rodízio
 */
export function useUpdateRotationConfig(organizationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: { enabled: boolean; vendedores: string[] }) => {
      if (!organizationId) throw new Error('Organization ID required');

      const { error } = await (supabase as AnySupabase)
        .from('organizations')
        .update({
          whatsapp_rotation_enabled: config.enabled,
          whatsapp_vendedores: config.vendedores,
        })
        .eq('id', organizationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-rotation-config', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['next-vendedor-whatsapp', organizationId] });
      toast.success('Configuração de rodízio atualizada!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar configuração');
    },
  });
}

/**
 * Hook para registrar atribuição de lead
 */
export function useAssignLead(organizationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      vendedor_id: string;
      lead_name?: string;
      lead_phone?: string;
      lead_source?: string;
    }) => {
      if (!organizationId) throw new Error('Organization ID required');

      const { data: result, error } = await (supabase as AnySupabase)
        .rpc('assign_whatsapp_lead', {
          p_org_id: organizationId,
          p_vendedor_id: data.vendedor_id,
          p_lead_name: data.lead_name || null,
          p_lead_phone: data.lead_phone || null,
          p_lead_source: data.lead_source || 'landing_page',
        });

      if (error) throw error;
      return result as AssignLeadResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['next-vendedor-whatsapp', organizationId] });
    },
    onError: (error: Error) => {
      console.error('Erro ao registrar atribuição:', error);
    },
  });
}

/**
 * Hook completo para gerenciar rodízio de WhatsApp
 */
export function useWhatsAppRotation(organizationId: string | null) {
  const configQuery = useWhatsAppRotationConfig(organizationId);
  const vendedoresQuery = useAvailableVendedores(organizationId);
  const updateMutation = useUpdateRotationConfig(organizationId);
  const assignMutation = useAssignLead(organizationId);

  const getNextVendedor = async (): Promise<VendedorRotation | null> => {
    if (!organizationId) return null;

    const { data, error } = await (supabase as AnySupabase)
      .rpc('get_next_vendedor_whatsapp', { p_org_id: organizationId });

    if (error || !data || (data as NextVendedorResult[]).length === 0) return null;

    const vendedor = (data as NextVendedorResult[])[0];
    
    // Registrar atribuição
    await assignMutation.mutateAsync({
      vendedor_id: vendedor.user_id,
    });

    return {
      user_id: vendedor.user_id,
      user_name: vendedor.user_name,
      user_whatsapp: vendedor.user_whatsapp,
      index_position: vendedor.index_position,
    };
  };

  return {
    // Queries
    config: configQuery.data,
    isLoadingConfig: configQuery.isLoading,
    availableVendedores: vendedoresQuery.data || [],
    isLoadingVendedores: vendedoresQuery.isLoading,
    
    // Mutations
    updateConfig: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    
    // Helpers
    getNextVendedor,
    
    // Refetch
    refetch: () => {
      configQuery.refetch();
      vendedoresQuery.refetch();
    },
  };
}
