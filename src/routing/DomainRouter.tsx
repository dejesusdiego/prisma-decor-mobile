/**
 * DomainRouter - Componente Principal de Roteamento
 * 
 * Resolve o domínio baseado no hostname e renderiza as rotas apropriadas.
 * Centraliza toda a lógica de roteamento multi-domínio.
 */

import { useEffect, useState, Suspense, useMemo, useRef, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { logger } from '@/lib/logger';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRoute } from '@/components/AdminRoute';

// Lazy load das páginas principais
const GerenciarUsuarios = lazy(() => import('@/pages/GerenciarUsuarios'));
const GerarOrcamento = lazy(() => import('@/pages/GerarOrcamento'));
const LoginGateway = lazy(() => import('@/pages/LoginGateway'));
const LandingPageStudioOS = lazy(() => import('@/pages/studioos/LandingPageStudioOS'));
const LandingPageOrganizacao = lazy(() => import('@/pages/LandingPageOrganizacao'));
const SupplierPortal = lazy(() => import('@/pages/SupplierPortal'));
const CadastroFornecedor = lazy(() => import('@/pages/CadastroFornecedor'));
const AdminSupremo = lazy(() => import('@/pages/AdminSupremo'));
const ConfiguracoesOrganizacao = lazy(() => import('@/pages/ConfiguracoesOrganizacao'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const NotFound = lazy(() => import('@/pages/NotFound'));

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

// Componente para renderizar uma rota protegida
function ProtectedRouteWrapper({ 
  children,
  requireAdmin = false 
}: { 
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  if (requireAdmin) {
    return <AdminRoute>{children}</AdminRoute>;
  }
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export function DomainRouter() {
  const location = useLocation();
  const { user } = useAuth();
  const orgContext = useOrganizationContext();
  
  const [isResolving, setIsResolving] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDomain, setCurrentDomain] = useState<DomainConfig | null>(null);
  
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const pathname = location.pathname;
  
  // Resolver domínio baseado no hostname
  useEffect(() => {
    setIsResolving(true);
    setError(null);
    
    try {
      const domain = resolveDomainByHostname(hostname);
      
      if (!domain) {
        // Fallback para localhost/dev
        if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
          logger.info(`[DomainRouter] Localhost detected, using fallback routing`);
          setCurrentDomain(null); // Será tratado como fallback
        } else {
          setError(`Domínio não reconhecido: ${hostname}`);
          setCurrentDomain(null);
        }
      } else {
        setCurrentDomain(domain);
        logger.info(`[DomainRouter] Domain resolved: ${domain.id} for ${hostname}`);
      }
    } catch (err) {
      setError('Erro ao resolver domínio');
      logger.error('[DomainRouter] Domain resolution error:', err);
    } finally {
      setIsResolving(false);
    }
  }, [hostname]);

  // Loading state
  if (isResolving) {
    return <DomainRouterLoading />;
  }
  
  // Error state
  if (error) {
    return <DomainRouterError error={error} onRetry={() => window.location.reload()} />;
  }

  // Extrair slug do hostname para landing pages
  const getOrgSlug = () => {
    if (hostname.includes('-app.')) {
      return hostname.split('-app.')[0];
    }
    if (hostname.includes('.studioos.pro') && !hostname.startsWith('admin.') && !hostname.startsWith('fornecedores.') && !hostname.startsWith('app.')) {
      return hostname.split('.')[0];
    }
    return orgContext?.organization?.slug || null;
  };

  const orgSlug = getOrgSlug();

  // ============================================================================
  // ROTEAMENTO POR DOMÍNIO
  // ============================================================================

  // 1. DOMÍNIO ADMIN (admin.studioos.pro)
  if (currentDomain?.id === 'super-admin' || hostname.startsWith('admin.')) {
    return (
      <Suspense fallback={<DomainRouterLoading />}>
        <Routes>
          <Route path="/login" element={<LoginGateway />} />
          <Route path="/admin-supremo" element={<AdminRoute><AdminSupremo /></AdminRoute>} />
          <Route path="/admin-supremo/fornecedores" element={<AdminRoute><AdminSupremo /></AdminRoute>} />
          <Route path="/admin-supremo/organizacoes" element={<AdminRoute><AdminSupremo /></AdminRoute>} />
          <Route path="/admin-supremo/usuarios" element={<AdminRoute><AdminSupremo /></AdminRoute>} />
          <Route path="/gerenciarusuarios" element={<AdminRoute><GerenciarUsuarios /></AdminRoute>} />
          <Route path="/fornecedores" element={<AdminRoute><AdminSupremo /></AdminRoute>} />
          <Route path="/organizacoes" element={<AdminRoute><AdminSupremo /></AdminRoute>} />
          <Route path="/usuarios" element={<AdminRoute><GerenciarUsuarios /></AdminRoute>} />
          <Route path="/" element={<AdminRoute><AdminSupremo /></AdminRoute>} />
          <Route path="*" element={<AdminRoute><AdminSupremo /></AdminRoute>} />
        </Routes>
      </Suspense>
    );
  }

  // 2. PORTAL DE FORNECEDORES (fornecedores.studioos.pro)
  if (currentDomain?.id === 'supplier' || hostname.startsWith('fornecedores.')) {
    return (
      <Suspense fallback={<DomainRouterLoading />}>
        <Routes>
          <Route path="/login" element={<LoginGateway />} />
          <Route path="/cadastro" element={<CadastroFornecedor />} />
          <Route path="/" element={<ProtectedRoute><SupplierPortal /></ProtectedRoute>} />
          <Route path="*" element={<ProtectedRoute><SupplierPortal /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    );
  }

  // 3. APP DO CLIENTE ({slug}-app.studioos.pro ou app.studioos.pro)
  if (currentDomain?.id === 'app-tenant' || hostname.includes('-app.') || hostname === 'app.studioos.pro') {
    return (
      <Suspense fallback={<DomainRouterLoading />}>
        <Routes>
          <Route path="/login" element={<LoginGateway />} />
          <Route path="/auth" element={<LoginGateway />} />
          <Route path="/gerarorcamento" element={<ProtectedRoute><GerarOrcamento /></ProtectedRoute>} />
          <Route path="/configuracoes/organizacao" element={<ProtectedRoute><ConfiguracoesOrganizacao /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><GerarOrcamento /></ProtectedRoute>} />
          <Route path="*" element={<ProtectedRoute><GerarOrcamento /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    );
  }

  // 4. LANDING PAGE DA ORGANIZAÇÃO ({slug}.studioos.pro)
  if (currentDomain?.id === 'landing-org' || (hostname.endsWith('.studioos.pro') && !hostname.startsWith('www.') && !hostname.startsWith('admin.') && !hostname.startsWith('fornecedores.') && !hostname.startsWith('app.') && !hostname.includes('-app.'))) {
    return (
      <Suspense fallback={<DomainRouterLoading />}>
        <Routes>
          <Route path="/" element={<LandingPageOrganizacao slug={orgSlug || undefined} />} />
          <Route path="/login" element={<LoginGateway />} />
          <Route path="*" element={<LandingPageOrganizacao slug={orgSlug || undefined} />} />
        </Routes>
      </Suspense>
    );
  }

  // 5. MARKETING STUDIOOS (studioos.pro, www.studioos.pro)
  if (currentDomain?.id === 'marketing' || hostname === 'studioos.pro' || hostname === 'www.studioos.pro') {
    return (
      <Suspense fallback={<DomainRouterLoading />}>
        <Routes>
          <Route path="/" element={<LandingPageStudioOS />} />
          <Route path="/login" element={<LoginGateway />} />
          <Route path="/auth" element={<LoginGateway />} />
          <Route path="/cadastro-fornecedor" element={<CadastroFornecedor />} />
          <Route path="/fornecedores/cadastro" element={<CadastroFornecedor />} />
          <Route path="*" element={<LandingPageStudioOS />} />
        </Routes>
      </Suspense>
    );
  }

  // 6. FALLBACK PARA DESENVOLVIMENTO/LOCALHOST
  // Em dev, permite acesso a todas as rotas
  return (
    <Suspense fallback={<DomainRouterLoading />}>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<LandingPageStudioOS />} />
        <Route path="/login" element={<LoginGateway />} />
        <Route path="/auth" element={<LoginGateway />} />
        <Route path="/cadastro-fornecedor" element={<CadastroFornecedor />} />
        <Route path="/fornecedores/cadastro" element={<CadastroFornecedor />} />
        
        {/* Rotas protegidas */}
        <Route path="/gerarorcamento" element={<ProtectedRoute><GerarOrcamento /></ProtectedRoute>} />
        <Route path="/configuracoes/organizacao" element={<ProtectedRoute><ConfiguracoesOrganizacao /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        
        {/* Rotas admin */}
        <Route path="/admin-supremo" element={<AdminRoute><AdminSupremo /></AdminRoute>} />
        <Route path="/gerenciarusuarios" element={<AdminRoute><GerenciarUsuarios /></AdminRoute>} />
        
        {/* Portal fornecedores */}
        <Route path="/fornecedores" element={<ProtectedRoute><SupplierPortal /></ProtectedRoute>} />
        
        {/* Landing pages */}
        <Route path="/lp/:slug" element={<LandingPageOrganizacao />} />
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
