import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';

export interface UserPermissions {
  can_access_orcamentos: boolean;
  can_create_orcamentos: boolean;
  can_edit_orcamentos: boolean;
  can_delete_orcamentos: boolean;

  can_access_pedidos: boolean;
  can_create_pedidos: boolean;
  can_edit_pedidos: boolean;
  can_delete_pedidos: boolean;

  can_access_producao: boolean;
  can_edit_producao: boolean;
  can_manage_producao: boolean;

  can_access_financeiro: boolean;
  can_edit_financeiro: boolean;
  can_view_all_financeiro: boolean;

  can_access_crm: boolean;
  can_edit_crm: boolean;
  can_delete_crm: boolean;

  can_access_estoque: boolean;
  can_edit_estoque: boolean;
  can_manage_estoque: boolean;

  can_access_configuracoes: boolean;
  can_manage_users: boolean;
  can_manage_organization: boolean;

  can_access_fornecedores: boolean;
  can_edit_fornecedores: boolean;

  can_access_relatorios: boolean;
  can_export_relatorios: boolean;
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  can_access_orcamentos: true,
  can_create_orcamentos: true,
  can_edit_orcamentos: true,
  can_delete_orcamentos: false,

  can_access_pedidos: true,
  can_create_pedidos: true,
  can_edit_pedidos: true,
  can_delete_pedidos: false,

  can_access_producao: true,
  can_edit_producao: true,
  can_manage_producao: false,

  can_access_financeiro: true,
  can_edit_financeiro: false,
  can_view_all_financeiro: false,

  can_access_crm: true,
  can_edit_crm: true,
  can_delete_crm: false,

  can_access_estoque: true,
  can_edit_estoque: false,
  can_manage_estoque: false,

  can_access_configuracoes: false,
  can_manage_users: false,
  can_manage_organization: false,

  can_access_fornecedores: true,
  can_edit_fornecedores: false,

  can_access_relatorios: true,
  can_export_relatorios: false,
};

export function usePermissions() {
  const { user } = useAuth();
  const { organization, isOwner, isAdmin } = useOrganizationContext();

  return useQuery({
    queryKey: ['permissions', organization?.id, user?.id],
    queryFn: async (): Promise<UserPermissions> => {
      if (!user?.id || !organization?.id) {
        return DEFAULT_PERMISSIONS;
      }

      // Owners have all permissions
      if (isOwner) {
        return {
          can_access_orcamentos: true,
          can_create_orcamentos: true,
          can_edit_orcamentos: true,
          can_delete_orcamentos: true,
          can_access_pedidos: true,
          can_create_pedidos: true,
          can_edit_pedidos: true,
          can_delete_pedidos: true,
          can_access_producao: true,
          can_edit_producao: true,
          can_manage_producao: true,
          can_access_financeiro: true,
          can_edit_financeiro: true,
          can_view_all_financeiro: true,
          can_access_crm: true,
          can_edit_crm: true,
          can_delete_crm: true,
          can_access_estoque: true,
          can_edit_estoque: true,
          can_manage_estoque: true,
          can_access_configuracoes: true,
          can_manage_users: true,
          can_manage_organization: true,
          can_access_fornecedores: true,
          can_edit_fornecedores: true,
          can_access_relatorios: true,
          can_export_relatorios: true,
        };
      }

      const { data, error } = await (supabase as any)
        .from('organization_member_permissions')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        console.warn('Permissions not found, using defaults:', error);
        return DEFAULT_PERMISSIONS;
      }

      return {
        can_access_orcamentos: data.can_access_orcamentos,
        can_create_orcamentos: data.can_create_orcamentos,
        can_edit_orcamentos: data.can_edit_orcamentos,
        can_delete_orcamentos: data.can_delete_orcamentos,
        can_access_pedidos: data.can_access_pedidos,
        can_create_pedidos: data.can_create_pedidos,
        can_edit_pedidos: data.can_edit_pedidos,
        can_delete_pedidos: data.can_delete_pedidos,
        can_access_producao: data.can_access_producao,
        can_edit_producao: data.can_edit_producao,
        can_manage_producao: data.can_manage_producao,
        can_access_financeiro: data.can_access_financeiro,
        can_edit_financeiro: data.can_edit_financeiro,
        can_view_all_financeiro: data.can_view_all_financeiro,
        can_access_crm: data.can_access_crm,
        can_edit_crm: data.can_edit_crm,
        can_delete_crm: data.can_delete_crm,
        can_access_estoque: data.can_access_estoque,
        can_edit_estoque: data.can_edit_estoque,
        can_manage_estoque: data.can_manage_estoque,
        can_access_configuracoes: data.can_access_configuracoes,
        can_manage_users: data.can_manage_users,
        can_manage_organization: data.can_manage_organization,
        can_access_fornecedores: data.can_access_fornecedores,
        can_edit_fornecedores: data.can_edit_fornecedores,
        can_access_relatorios: data.can_access_relatorios,
        can_export_relatorios: data.can_export_relatorios,
      };
    },
    enabled: !!user?.id && !!organization?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdatePermissions() {
  const queryClient = useQueryClient();
  const { organization } = useOrganizationContext();

  return useMutation({
    mutationFn: async ({
      userId,
      permissions,
    }: {
      userId: string;
      permissions: Partial<UserPermissions>;
    }) => {
      if (!organization?.id) throw new Error('Organization not found');

      const { data, error } = await (supabase as any)
        .from('organization_member_permissions')
        .upsert({
          organization_id: organization.id,
          user_id: userId,
          ...permissions,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['permissions', organization?.id, variables.userId],
      });
    },
  });
}

export function useMemberPermissions(memberId: string | null) {
  const { organization } = useOrganizationContext();

  return useQuery({
    queryKey: ['member-permissions', organization?.id, memberId],
    queryFn: async (): Promise<UserPermissions | null> => {
      if (!memberId || !organization?.id) return null;

      const { data, error } = await (supabase as any)
        .from('organization_member_permissions')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('user_id', memberId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data as UserPermissions;
    },
    enabled: !!memberId && !!organization?.id,
  });
}
