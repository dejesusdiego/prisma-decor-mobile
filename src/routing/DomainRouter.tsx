/**
 * DomainRouter - Componente Principal de Roteamento
 * 
 * Resolve o domínio baseado no hostname e renderiza as rotas apropriadas.
 * Centraliza toda a lógica de roteamento multi-domínio.
 */

import { useEffect, useState, Suspense, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import type { 
  DomainConfig, 
  DomainRoute, 
  RoutingContext, 
  UserContext,
  OrganizationContext,
} from '@/domains/types';
import { resolveDomainByHostname } from '@/domains';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { RouteValidator } from './RouteValidator';
import { RedirectHandler } from './RedirectHandler';

// Loading component
function DomainRouterLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

// Error component
function DomainRouterError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-destructive">Erro de Roteamento</h1>
        <p className="text-muted-foreground">{error}</p>
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  );
}

// Componente para renderizar uma rota específica
function DomainRouteComponent({ 
  route, 
  domain,
  context 
}: { 
  route: DomainRoute; 
  domain: DomainConfig;
  context: RoutingContext;
}) {
  const Component = route.component;
  
  return (
    <RouteValidator route={route} context={context}>
      <Suspense fallback={<DomainRouterLoading />}>
        <Component />
      </Suspense>
    </RouteValidator>
  );
}

export function DomainRouter() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const orgContext = useOrganizationContext();
  
  const [isResolving, setIsResolving] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDomain, setCurrentDomain] = useState<DomainConfig | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isSupplier, setIsSupplier] = useState(false);
  
  const hostname = window.location.hostname;
  
  // Safety brake para evitar loops infinitos
  const validationCountRef = { current: 0 };
  const MAX_VALIDATIONS = 10;
  
  // Buscar roles do usuário - com proteção contra loop
  useEffect(() => {
    // Incrementar contador de validações
    validationCountRef.current++;
    
    // Safety brake: abortar se detectar loop
    if (validationCountRef.current > MAX_VALIDATIONS) {
      logger.error(`[DomainRouter] Loop detectado: ${validationCountRef.current} validações. Abortando.`);
      setError('Erro de roteamento: muitas validações. Recarregue a página.');
      return;
    }
    
    async function fetchUserRoles() {
      if (!user) {
        setUserRoles([]);
        setIsSuperAdmin(false);
        setIsSupplier(false);
        return;
      }
      
      try {
        // Verificar user_roles
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        
        const roles = roleData?.map(r => r.role) || [];
        setUserRoles(roles);
        setIsSuperAdmin(roles.includes('super_admin'));
        
        // Verificar se é fornecedor
        const { data: supplierData } = await supabase
          .from('suppliers')
          .select('id')
          .eq('email', user.email)
          .eq('status', 'approved')
          .single();
        
        setIsSupplier(!!supplierData);
      } catch (err) {
        logger.error('Error fetching user roles:', err);
      }
    }
    
    fetchUserRoles();
  }, [user]);
  
  // Resolver domínio
  useEffect(() => {
    setIsResolving(true);
    setError(null);
    
    try {
      const domain = resolveDomainByHostname(hostname);
      
      if (!domain) {
        setError(`Domínio não reconhecido: ${hostname}`);
        setCurrentDomain(null);
      } else {
        setCurrentDomain(domain);
        logger.info(`Domain resolved: ${domain.id} for ${hostname}`);
      }
    } catch (err) {
      setError('Erro ao resolver domínio');
      logger.error('Domain resolution error:', err);
    } finally {
      setIsResolving(false);
    }
  }, [hostname]);
  
  // Construir contexto de roteamento
  const routingContext: RoutingContext = useMemo(() => {
    const userContext: UserContext | null = user ? {
      id: user.id,
      email: user.email || '',
      role: userRoles[0] || 'user',
      roles: userRoles,
      permissions: [], // TODO: Buscar permissões
      isSuperAdmin,
      isSupplier,
      isAffiliate: false, // TODO
      organizationId: orgContext?.organization?.id,
      organizationRole: undefined, // TODO
    } : null;
    
    const organizationCtx: OrganizationContext | null = orgContext?.organization ? {
      id: orgContext.organization.id,
      slug: orgContext.organization.slug || '',
      name: orgContext.organization.name,
      plan: orgContext.organization.plan || 'free',
      isActive: orgContext.organization.is_active !== false,
      settings: orgContext.organization.settings,
    } : null;
    
    return {
      currentDomain: currentDomain?.id || 'marketing',
      hostname,
      pathname: location.pathname,
      user: userContext,
      organization: organizationCtx,
      searchParams: new URLSearchParams(location.search),
    };
  }, [user, userRoles, isSuperAdmin, isSupplier, orgContext, currentDomain, hostname, location]);
  
  // Handle retry
  const handleRetry = () => {
    window.location.reload();
  };
  
  // Loading state
  if (isResolving) {
    return <DomainRouterLoading />;
  }
  
  // Error state
  if (error || !currentDomain) {
    return <DomainRouterError error={error || 'Domínio não encontrado'} onRetry={handleRetry} />;
  }
  
  // Build routes
  return (
    <RedirectHandler rules={currentDomain.redirects} context={routingContext}>
      <Routes>
        {currentDomain.routes.map((route) => (
          <Route
            key={`${currentDomain.id}-${route.path}`}
            path={route.path}
            element={
              <DomainRouteComponent 
                route={route} 
                domain={currentDomain}
                context={routingContext}
              />
            }
          />
        ))}
        {/* Fallback para rota padrão do domínio */}
        <Route 
          path="*" 
          element={<Navigate to={currentDomain.defaultRoute} replace />} 
        />
      </Routes>
    </RedirectHandler>
  );
}
