import { supabase } from '@/integrations/supabase/client';

export interface DomainInfo {
  hostname: string;
  role: 'marketing' | 'app' | 'admin' | 'supplier';
  organizationId: string | null;
  organizationSlug: string | null;
}

// Cache simples em memória para resoluções de domínio
const domainCache = new Map<string, { data: DomainInfo; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Resolve domínio para informações de roteamento
 * 
 * ⚠️ MVP: Resolve no frontend
 * 📌 Scale: Migrar para Vercel Edge Middleware
 * 
 * Padrão de domínios:
 * - seudominio.com → marketing
 * - app.seudominio.com → app (sistema)
 * - studioos.pro → marketing (StudioOS)
 * - admin.studioos.pro → admin (canônico)
 * - panel.studioos.pro → admin (redireciona para admin)
 * - fornecedores.studioos.pro → supplier
 * - {slug}-app.studioos.pro → app (organização cliente)
 * - {slug}.studioos.com.br → marketing (landing page organização) ⭐ NOVO
 * - {slug}.studioos.pro → marketing (landing page organização) ⭐ NOVO
 */
export async function resolveDomain(hostname: string): Promise<DomainInfo | null> {
  try {
    // Verificar cache primeiro
    const cached = domainCache.get(hostname);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    // Canonical redirect: panel.studioos.pro → admin.studioos.pro
    if (hostname === 'panel.studioos.pro') {
      if (typeof window !== 'undefined' && window.location.hostname === 'panel.studioos.pro') {
        window.location.replace(window.location.href.replace('panel.studioos.pro', 'admin.studioos.pro'));
        return null;
      }
      hostname = 'admin.studioos.pro';
    }

    // Canonical redirect: panel.studioos.com.br → admin.studioos.com.br
    if (hostname === 'panel.studioos.com.br') {
      if (typeof window !== 'undefined' && window.location.hostname === 'panel.studioos.com.br') {
        window.location.replace(window.location.href.replace('panel.studioos.com.br', 'admin.studioos.com.br'));
        return null;
      }
      hostname = 'admin.studioos.com.br';
    }

    // ============================================================
    // NOVO: Detectar {slug}.studioos.com.br ou {slug}.studioos.pro
    // Landing pages de organizações via subdomínio
    // ============================================================
    const studioosSubdomainMatch = hostname.match(/^([a-z0-9-]+)\.studioos\.(com\.br|pro)$/);
    if (studioosSubdomainMatch) {
      const orgSlug = studioosSubdomainMatch[1];
      // Ignorar slugs reservados
      const reservedSlugs = ['admin', 'panel', 'fornecedores', 'fornecedor', 'app', 'api', 'www', 'mail', 'ftp', 'studioos'];
      
      if (!reservedSlugs.includes(orgSlug)) {
        // Buscar organização pelo slug
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id, slug')
          .eq('slug', orgSlug)
          .eq('active', true)
          .maybeSingle();

        if (!orgError && org) {
          const domainInfo: DomainInfo = {
            hostname,
            role: 'marketing',
            organizationId: org.id,
            organizationSlug: org.slug,
          };
          // Salvar no cache
          domainCache.set(hostname, { data: domainInfo, timestamp: Date.now() });
          return domainInfo;
        }
      }
    }

    // Detectar {slug}-app.studioos.pro antes de consultar banco
    const slugAppMatch = hostname.match(/^([a-z0-9-]+)-app\.studioos\.(com\.br|pro)$/);
    if (slugAppMatch) {
      const orgSlug = slugAppMatch[1];
      // Verificar se slug não é reservado
      if (orgSlug !== 'studioos') {
        // Buscar organização pelo slug
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id, slug')
          .eq('slug', orgSlug)
          .eq('active', true)
          .maybeSingle();

        if (!orgError && org) {
          const domainInfo: DomainInfo = {
            hostname,
            role: 'app',
            organizationId: org.id,
            organizationSlug: org.slug,
          };
          domainCache.set(hostname, { data: domainInfo, timestamp: Date.now() });
          return domainInfo;
        }
      }
    }

    // Consultar banco de dados - usar as any para contornar tipos
    const { data: domain, error } = await (supabase as any)
      .from('domains')
      .select(`
        hostname,
        role,
        organization_id,
        organizations(slug)
      `)
      .eq('hostname', hostname)
      .eq('active', true)
      .maybeSingle();

    if (error) {
      console.error('Error resolving domain:', error);
      // Se for studioos.pro ou studioos.com.br e houver erro, usar fallback
      if (hostname === 'studioos.pro' || hostname === 'www.studioos.pro' ||
          hostname === 'studioos.com.br' || hostname === 'www.studioos.com.br') {
        return resolveSubdomainFallback(hostname);
      }
      return null;
    }

    if (!domain) {
      // Fallback: verificar se é subdomínio conhecido
      return resolveSubdomainFallback(hostname);
    }

    // Normalizar organizations
    const org = Array.isArray(domain.organizations) 
      ? domain.organizations[0] 
      : domain.organizations;

    // Se for studioos.pro e não tiver organizationSlug, usar fallback
    if ((hostname === 'studioos.pro' || hostname === 'studioos.com.br') && !org?.slug) {
      const domainInfo: DomainInfo = {
        hostname: domain.hostname,
        role: domain.role,
        organizationId: domain.organization_id,
        organizationSlug: 'studioos',
      };
      domainCache.set(hostname, { data: domainInfo, timestamp: Date.now() });
      return domainInfo;
    }

    const domainInfo: DomainInfo = {
      hostname: domain.hostname,
      role: domain.role,
      organizationId: domain.organization_id,
      organizationSlug: org?.slug ?? null,
    };
    
    // Salvar no cache
    domainCache.set(hostname, { data: domainInfo, timestamp: Date.now() });
    return domainInfo;
  } catch (error) {
    console.error('Error in resolveDomain:', error);
    // Se for studioos.pro ou studioos.com.br e houver erro, usar fallback
    if (hostname === 'studioos.pro' || hostname === 'www.studioos.pro' ||
        hostname === 'studioos.com.br' || hostname === 'www.studioos.com.br') {
      return resolveSubdomainFallback(hostname);
    }
    return null;
  }
}

/**
 * Limpa o cache de domínios (útil para debugging ou quando domínios são atualizados)
 */
export function clearDomainCache(): void {
  domainCache.clear();
}

/**
 * Resolve subdomínios conhecidos (fallback para desenvolvimento/teste)
 * 
 * ⚠️ Apenas para desenvolvimento. Em produção, todos os domínios devem estar no banco.
 */
function resolveSubdomainFallback(hostname: string): DomainInfo | null {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isSupplierRoute = pathname === '/fornecedores' || pathname.startsWith('/fornecedores/');
  
  // Portal de fornecedores
  if (hostname === 'fornecedores.studioos.pro' || 
      hostname === 'fornecedores.studioos.com.br' ||
      hostname.includes('fornecedores.') || 
      isSupplierRoute) {
    return {
      hostname,
      role: 'supplier',
      organizationId: null,
      organizationSlug: null,
    };
  }

  // Admin
  if (hostname === 'admin.studioos.pro' || 
      hostname === 'admin.studioos.com.br' ||
      hostname === 'panel.studioos.pro' ||
      hostname === 'panel.studioos.com.br' ||
      hostname.includes('admin.') || 
      hostname.includes('panel.')) {
    return {
      hostname: hostname.replace('panel.studioos.pro', 'admin.studioos.pro')
                       .replace('panel.studioos.com.br', 'admin.studioos.com.br'),
      role: 'admin',
      organizationId: null,
      organizationSlug: null,
    };
  }

  // App organizacional ({slug}-app.studioos.pro)
  const slugAppMatch = hostname.match(/^([a-z0-9-]+)-app\.studioos\.(com\.br|pro)$/);
  if (slugAppMatch) {
    const orgSlug = slugAppMatch[1];
    if (orgSlug !== 'studioos') {
      return {
        hostname,
        role: 'app',
        organizationId: null,
        organizationSlug: orgSlug,
      };
    }
  }

  // Landing page organizacional ({slug}.studioos.com.br ou {slug}.studioos.pro)
  const studioosSubdomainMatch = hostname.match(/^([a-z0-9-]+)\.studioos\.(com\.br|pro)$/);
  if (studioosSubdomainMatch) {
    const orgSlug = studioosSubdomainMatch[1];
    const reservedSlugs = ['admin', 'panel', 'fornecedores', 'fornecedor', 'app', 'api', 'www', 'mail', 'ftp', 'studioos'];
    
    if (!reservedSlugs.includes(orgSlug)) {
      return {
        hostname,
        role: 'marketing',
        organizationId: null,
        organizationSlug: orgSlug,
      };
    }
  }

  // App (app.seudominio.com)
  if (hostname.startsWith('app.')) {
    return {
      hostname,
      role: 'app',
      organizationId: null,
      organizationSlug: null,
    };
  }

  // Marketing StudioOS
  if (hostname === 'studioos.pro' || 
      hostname === 'www.studioos.pro' ||
      hostname === 'studioos.com.br' || 
      hostname === 'www.studioos.com.br') {
    return {
      hostname,
      role: 'marketing',
      organizationId: null,
      organizationSlug: 'studioos',
    };
  }

  // Marketing (default)
  return {
    hostname,
    role: 'marketing',
    organizationId: null,
    organizationSlug: null,
  };
}

/**
 * Extrai o slug de um subdomínio StudioOS
 * Ex: prisma-decor.studioos.com.br → prisma-decor
 */
export function extractSlugFromHostname(hostname: string): string | null {
  const match = hostname.match(/^([a-z0-9-]+)\.studioos\.(com\.br|pro)$/);
  return match ? match[1] : null;
}

/**
 * Verifica se um hostname é um subdomínio de landing page
 */
export function isLandingPageSubdomain(hostname: string): boolean {
  const match = hostname.match(/^([a-z0-9-]+)\.studioos\.(com\.br|pro)$/);
  if (!match) return false;
  
  const reservedSlugs = ['admin', 'panel', 'fornecedores', 'fornecedor', 'app', 'api', 'www', 'mail', 'ftp', 'studioos'];
  return !reservedSlugs.includes(match[1]);
}

/**
 * Verifica se um hostname é um subdomínio de app
 */
export function isAppSubdomain(hostname: string): boolean {
  const match = hostname.match(/^([a-z0-9-]+)-app\.studioos\.(com\.br|pro)$/);
  if (!match) return false;
  
  return match[1] !== 'studioos';
}
