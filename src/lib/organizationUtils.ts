import { supabase } from '@/integrations/supabase/client';

/**
 * Obtém o organization_id do usuário atual de forma assíncrona
 * Para uso em funções que não podem usar hooks
 */
export async function getOrganizationId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) return null;
  
  const { data, error } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();
  
  if (error || !data) {
    console.error('Error fetching organization_id:', error);
    return null;
  }
  
  return data.organization_id;
}

/**
 * Adiciona organization_id a um objeto de dados se disponível
 */
export async function withOrganization<T extends Record<string, unknown>>(
  data: T
): Promise<T & { organization_id?: string }> {
  const organizationId = await getOrganizationId();
  
  if (organizationId) {
    return { ...data, organization_id: organizationId };
  }
  
  return data;
}
