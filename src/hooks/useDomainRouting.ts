import { useQuery } from '@tanstack/react-query';
import { resolveDomain, DomainInfo } from '@/lib/domainResolver';

export interface DomainRoutingResult {
  domainInfo: DomainInfo | null;
  isLoading: boolean;
  isMarketing: boolean;
  isApp: boolean;
  isAdmin: boolean;
  isSupplier: boolean;
  organizationId: string | null;
  organizationSlug: string | null;
}

/**
 * Hook para roteamento baseado em domínio
 * 
 * Resolve o domínio atual e retorna informações de roteamento.
 * 
 * Padrão de subdomínios:
 * - seudominio.com → marketing (LP)
 * - app.seudominio.com → app (sistema)
 * - studioos.pro → marketing (StudioOS LP)
 * - panel.studioos.pro → admin
 * - fornecedores.studioos.pro → supplier
 * 
 * ⚠️ MVP: Resolve no frontend
 * 📌 Scale: Migrar para Vercel Edge Middleware
 */
export function useDomainRouting(): DomainRoutingResult {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  const { data: domainInfo, isLoading } = useQuery({
    queryKey: ['domain-routing', hostname],
    queryFn: () => resolveDomain(hostname),
    enabled: !!hostname,
    staleTime: 1000 * 60 * 60, // 1 hora (domínios mudam pouco)
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
    retry: 2,
    retryDelay: 1000,
  });

  return {
    domainInfo: domainInfo || null,
    isLoading,
    isMarketing: domainInfo?.role === 'marketing',
    isApp: domainInfo?.role === 'app',
    isAdmin: domainInfo?.role === 'admin',
    isSupplier: domainInfo?.role === 'supplier',
    organizationId: domainInfo?.organizationId || null,
    organizationSlug: domainInfo?.organizationSlug || null,
  };
}
