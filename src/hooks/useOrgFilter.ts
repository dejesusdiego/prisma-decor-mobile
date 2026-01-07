import { useOrganizationContext } from '@/contexts/OrganizationContext';

/**
 * Hook utilitário para facilitar o filtro por organization_id nas queries
 */
export function useOrgFilter() {
  const { organizationId, isLoading } = useOrganizationContext();

  return {
    organizationId,
    isOrgLoading: isLoading,
    // Helper para adicionar filtro de organização em queries Supabase
    // Retorna null se org não está carregada ainda
    getOrgFilter: () => organizationId ? { organization_id: organizationId } : null,
    // Helper para verificar se pode fazer queries (org carregada)
    canQuery: !isLoading && !!organizationId,
  };
}
