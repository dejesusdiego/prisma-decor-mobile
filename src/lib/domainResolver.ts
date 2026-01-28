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
 * - admin.studioos.pro → admin (canônico)
 * - panel.studioos.pro → admin (redireciona para admin)
 * - fornecedores.studioos.pro → supplier
 * - {slug}-app.studioos.pro → app (organização cliente)
 */
export async function resolveDomain(hostname: string): Promise<DomainInfo | null> {
  try {
    // Canonical redirect: panel.studioos.pro → admin.studioos.pro
    if (hostname === 'panel.studioos.pro' || hostname.includes('panel.studioos.pro')) {
      // Redirecionar para domínio canônico
      if (typeof window !== 'undefined' && window.location.hostname === 'panel.studioos.pro') {
        window.location.replace(window.location.href.replace('panel.studioos.pro', 'admin.studioos.pro'));
        return null; // Retornar null enquanto redireciona
      }
      // Se já está resolvendo admin, tratar como admin
      hostname = hostname.replace('panel.studioos.pro', 'admin.studioos.pro');
    }

    // Detectar {slug}-app.studioos.pro antes de consultar banco
    const slugAppMatch = hostname.match(/^([a-z0-9-]+)-app\.studioos\.pro$/);
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
          return {
            hostname,
            role: 'app',
            organizationId: org.id,
            organizationSlug: org.slug,
          };
        }
      }
    }

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
      // Se for studioos.pro e houver erro, usar fallback
      if (hostname === 'studioos.pro' || hostname === 'www.studioos.pro') {
        return resolveSubdomainFallback(hostname);
      }
      return null;
    }

    if (!domain) {
      // Fallback: verificar se é subdomínio conhecido (desenvolvimento)
      // IMPORTANTE: studioos.pro deve funcionar mesmo sem estar no banco (fallback)
      return resolveSubdomainFallback(hostname);
    }

    // Normalizar organizations: Supabase/PostgREST pode retornar como array ou objeto
    // Garantir compatibilidade para admin/supplier (organizations pode ser null)
    const org = Array.isArray(domain.organizations) 
      ? domain.organizations[0] 
      : domain.organizations;

    // Se for studioos.pro e não tiver organizationSlug, usar fallback
    if (hostname === 'studioos.pro' && !org?.slug) {
      return {
        hostname: domain.hostname,
        role: domain.role,
        organizationId: domain.organization_id,
        organizationSlug: 'studioos', // Fallback para slug reservado
      };
    }

    return {
      hostname: domain.hostname,
      role: domain.role,
      organizationId: domain.organization_id,
      organizationSlug: org?.slug ?? null,
    };
  } catch (error) {
    console.error('Error in resolveDomain:', error);
    // Se for studioos.pro e houver erro, usar fallback
    if (hostname === 'studioos.pro' || hostname === 'www.studioos.pro') {
      return resolveSubdomainFallback(hostname);
    }
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
  // Suporta tanto subdomínio (fornecedores.studioos.pro) quanto rota (/fornecedores) em preview/dev
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isSupplierRoute = pathname === '/fornecedores' || pathname.startsWith('/fornecedores/');
  
  if (hostname === 'fornecedores.studioos.pro' || hostname.includes('fornecedores.') || isSupplierRoute) {
    return {
      hostname,
      role: 'supplier',
      organizationId: null,
      organizationSlug: null,
    };
  }

  // Admin (admin.studioos.pro - canônico, ou panel.studioos.pro - redireciona)
  if (hostname === 'admin.studioos.pro' || hostname === 'panel.studioos.pro' || hostname.includes('admin.') || hostname.includes('panel.')) {
    return {
      hostname: hostname.replace('panel.studioos.pro', 'admin.studioos.pro'),
      role: 'admin',
      organizationId: null,
      organizationSlug: null,
    };
  }

  // App organizacional ({slug}-app.studioos.pro)
  const slugAppMatch = hostname.match(/^([a-z0-9-]+)-app\.studioos\.pro$/);
  if (slugAppMatch) {
    const orgSlug = slugAppMatch[1];
    // Não permitir slug reservado
    if (orgSlug !== 'studioos') {
      return {
        hostname,
        role: 'app',
        organizationId: null, // Será resolvido pelo login
        organizationSlug: orgSlug,
      };
    }
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

  // Marketing StudioOS (studioos.pro) - deve retornar organizationSlug = 'studioos'
  if (hostname === 'studioos.pro' || hostname === 'www.studioos.pro') {
    return {
      hostname,
      role: 'marketing',
      organizationId: null, // Será resolvido pelo banco se existir
      organizationSlug: 'studioos', // Slug reservado da plataforma
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
