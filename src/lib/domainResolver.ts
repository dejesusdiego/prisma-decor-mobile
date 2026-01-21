import { supabase } from '@/integrations/supabase/client';

export interface DomainInfo {
  hostname: string;
  role: 'marketing' | 'app' | 'admin' | 'supplier';
  organizationId: string | null;
  organizationSlug: string | null;
}

/**
 * Resolve domínio para informações de roteamento
 * 
 * ⚠️ MVP: Resolve no frontend
 * 📌 Scale: Migrar para Vercel Edge Middleware
 * 
 * Padrão de subdomínios:
 * - seudominio.com → marketing
 * - app.seudominio.com → app (sistema)
 * - studioos.pro → marketing (StudioOS)
 * - panel.studioos.pro → admin
 * - fornecedores.studioos.pro → supplier
 */
export async function resolveDomain(hostname: string): Promise<DomainInfo | null> {
  try {
    const { data: domain, error } = await supabase
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
      return null;
    }

    if (!domain) {
      // Fallback: verificar se é subdomínio conhecido (desenvolvimento)
      return resolveSubdomainFallback(hostname);
    }

    // Normalizar organizations: Supabase/PostgREST pode retornar como array ou objeto
    // Garantir compatibilidade para admin/supplier (organizations pode ser null)
    const org = Array.isArray(domain.organizations) 
      ? domain.organizations[0] 
      : domain.organizations;

    return {
      hostname: domain.hostname,
      role: domain.role,
      organizationId: domain.organization_id,
      organizationSlug: org?.slug ?? null,
    };
  } catch (error) {
    console.error('Error in resolveDomain:', error);
    return null;
  }
}

/**
 * Resolve subdomínios conhecidos (fallback para desenvolvimento/teste)
 * 
 * ⚠️ Apenas para desenvolvimento. Em produção, todos os domínios devem estar no banco.
 */
function resolveSubdomainFallback(hostname: string): DomainInfo | null {
  // Portal de fornecedores
  if (hostname === 'fornecedores.studioos.pro' || hostname.includes('fornecedores.')) {
    return {
      hostname,
      role: 'supplier',
      organizationId: null,
      organizationSlug: null,
    };
  }

  // Admin (panel.studioos.pro)
  if (hostname === 'panel.studioos.pro' || hostname.includes('panel.')) {
    return {
      hostname,
      role: 'admin',
      organizationId: null,
      organizationSlug: null,
    };
  }

  // App (app.seudominio.com)
  if (hostname.startsWith('app.')) {
    // Tentar extrair slug do hostname (ex: app.prismadecorlab.com → prisma)
    // Isso é apenas fallback - em produção, deve estar no banco
    return {
      hostname,
      role: 'app',
      organizationId: null, // Será resolvido pelo login
      organizationSlug: null,
    };
  }

  // Marketing (default)
  // Em produção, deve estar no banco
  return {
    hostname,
    role: 'marketing',
    organizationId: null,
    organizationSlug: null,
  };
}
