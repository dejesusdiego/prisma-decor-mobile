import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { ThemeInitializer } from "@/components/ThemeInitializer";
import { useStudioOSTheme } from "@/hooks/useStudioOSTheme";
import { useDomainRouting } from "@/hooks/useDomainRouting";
import { allowsDevRoutes } from "@/lib/environment";
import { RESERVED_PLATFORM_SLUG } from "@/lib/constants";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";
import OurProducts from "./pages/OurProducts";
import Auth from "./pages/Auth";
import GerarOrcamento from "./pages/GerarOrcamento";
import GerenciarUsuarios from "./pages/GerenciarUsuarios";
import Documentacao from "./pages/Documentacao";
import ConfiguracoesOrganizacao from "./pages/ConfiguracoesOrganizacao";
import LandingPageOrganizacao from "./pages/LandingPageOrganizacao";
import LandingPageStudioOS from "./pages/studioos/LandingPageStudioOS";
import SupplierPortal from "./pages/SupplierPortal";
import CadastroFornecedor from "./pages/CadastroFornecedor";
import LoginGateway from "./pages/LoginGateway";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutos - materiais mudam pouco
      gcTime: 30 * 60 * 1000, // 30 minutos - manter em cache
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  // Aplicar tema StudioOS na LP (desacopla do tema da organização)
  useStudioOSTheme();
  
  // Roteamento baseado em domínio (subdomínios)
  const { 
    domainInfo, 
    isLoading: isDomainLoading, 
    isMarketing, 
    isApp, 
    isAdmin, 
    isSupplier,
    organizationSlug 
  } = useDomainRouting();

  // Loading enquanto resolve domínio
  if (isDomainLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Portal de fornecedores (fornecedores.studioos.pro OU rota /fornecedores em preview/dev)
  // ⚠️ IMPORTANTE: Verificar ANTES das rotas públicas para evitar conflito
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isSupplierRoute = pathname === '/fornecedores' || (pathname.startsWith('/fornecedores/') && pathname !== '/fornecedores/cadastro');
  
  if (isSupplier || isSupplierRoute) {
    return <SupplierPortal />;
  }

  // Admin StudioOS (admin.studioos.pro - canônico)
  // ⚠️ panel.studioos.pro redireciona para admin.studioos.pro via domainResolver
  // Suporta rotas internas: /gerenciarusuarios, etc.
  if (isAdmin) {
    return (
      <ThemeInitializer>
        <OnboardingProvider>
          <Routes>
            <Route path="/gerenciarusuarios" element={
              <AdminRoute>
                <GerenciarUsuarios />
              </AdminRoute>
            } />
            <Route path="/" element={
              <AdminRoute>
                <GerenciarUsuarios />
              </AdminRoute>
            } />
            <Route path="*" element={
              <AdminRoute>
                <GerenciarUsuarios />
              </AdminRoute>
            } />
          </Routes>
        </OnboardingProvider>
      </ThemeInitializer>
    );
  }

  // App do cliente (app.seudominio.com) ou gateway (app.studioos.pro)
  // ⚠️ app.studioos.pro funciona como GATEWAY: /login e /auth redirecionam por role
  // ⚠️ {slug}-app.studioos.pro funciona como APP: rotas internas do sistema
  if (isApp) {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const isGateway = hostname === 'app.studioos.pro';
    
    if (isGateway) {
      // Gateway: rotas /login e /auth mostram LoginGateway
      // Outras rotas podem ser fallback para app ou mostrar gateway
      return (
        <ThemeInitializer>
          <OnboardingProvider>
            <Routes>
              <Route path="/login" element={<LoginGateway />} />
              <Route path="/auth" element={<LoginGateway />} />
              <Route path="/" element={<LoginGateway />} />
              <Route path="/gerarorcamento" element={
                <ProtectedRoute>
                  <GerarOrcamento />
                </ProtectedRoute>
              } />
              <Route path="/configuracoes/organizacao" element={
                <ProtectedRoute>
                  <ConfiguracoesOrganizacao />
                </ProtectedRoute>
              } />
              <Route path="*" element={<LoginGateway />} />
            </Routes>
          </OnboardingProvider>
        </ThemeInitializer>
      );
    } else {
      // App da organização: rotas internas do sistema
      return (
        <ThemeInitializer>
          <OnboardingProvider>
            <Routes>
              <Route path="/gerarorcamento" element={
                <ProtectedRoute>
                  <GerarOrcamento />
                </ProtectedRoute>
              } />
              <Route path="/configuracoes/organizacao" element={
                <ProtectedRoute>
                  <ConfiguracoesOrganizacao />
                </ProtectedRoute>
              } />
              <Route path="/" element={
                <ProtectedRoute>
                  <GerarOrcamento />
                </ProtectedRoute>
              } />
              <Route path="*" element={
                <ProtectedRoute>
                  <GerarOrcamento />
                </ProtectedRoute>
              } />
            </Routes>
          </OnboardingProvider>
        </ThemeInitializer>
      );
    }
  }

  // Marketing StudioOS (studioos.pro) - organização interna
  // 
  // ⚠️ REGRA RESERVADA: slug 'studioos' é reservado para a plataforma
  // Nenhuma organização cliente pode usar este slug.
  // A organização interna StudioOS (type='internal') sempre usa slug='studioos'.
  // 
  // Nota: StudioOS marketing tem organization_id (org interna), mas não é "cliente"
  // 
  // ⚠️ IMPORTANTE: Verificar StudioOS ANTES de verificar outros marketing
  // para evitar que studioos.pro renderize LandingPageOrganizacao
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isStudioOSDomain = currentHostname === 'studioos.pro' || currentHostname === 'www.studioos.pro';
  
  // Se for studioos.pro, SEMPRE renderizar LandingPageStudioOS (mesmo se domainInfo for null)
  if (isStudioOSDomain) {
    return <LandingPageStudioOS />;
  }
  
  if (isMarketing && organizationSlug === RESERVED_PLATFORM_SLUG) {
    return <LandingPageStudioOS />;
  }

  // Marketing com organização cliente (seudominio.com) - RENDERIZA LP DIRETO, SEM REDIRECT
  if (isMarketing && organizationSlug) {
    // Renderizar landing page direto, sem redirect para /lp/:slug
    // Isso evita problemas de SEO e redirects estranhos
    return <LandingPageOrganizacao slug={organizationSlug} />;
  }

  // Rotas públicas (funcionam em qualquer domínio, produção ou dev)
  // Verificar pathname antes do fallback de rotas dev
  // pathname já foi declarado acima
  const publicRoutes = ['/cadastro-fornecedor', '/fornecedores/cadastro'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));

  if (isPublicRoute) {
    // Renderizar rotas públicas sem verificação de domínio
    return (
      <ThemeInitializer>
        <OnboardingProvider>
          <Routes>
            <Route path="/cadastro-fornecedor" element={<CadastroFornecedor />} />
            <Route path="/fornecedores/cadastro" element={<CadastroFornecedor />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </OnboardingProvider>
      </ThemeInitializer>
    );
  }

  // Marketing StudioOS sem pathname específico - permitir rotas públicas também
  if (isMarketing && !organizationSlug) {
    // Pode ser studioos.pro ou outro domínio marketing sem organização
    // Permitir rotas públicas aqui também
    const pathnameCheck = typeof window !== 'undefined' ? window.location.pathname : '';
    if (publicRoutes.some(route => pathnameCheck === route || pathnameCheck.startsWith(route))) {
      return (
        <ThemeInitializer>
          <OnboardingProvider>
            <Routes>
              <Route path="/cadastro-fornecedor" element={<CadastroFornecedor />} />
              <Route path="/fornecedores/cadastro" element={<CadastroFornecedor />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </OnboardingProvider>
        </ThemeInitializer>
      );
    }
  }

  // Fallback: rotas padrão (APENAS para desenvolvimento/teste)
  // 
  // ⚠️ AMBIENTE: Estas rotas são permitidas apenas em:
  // - local: desenvolvimento local (localhost)
  // - preview: preview deployments (Vercel)
  // - staging: ambiente de staging
  // 
  // ❌ Em produção, estas rotas NÃO devem ser acessadas.
  // Em produção, apenas subdomínios devem ser usados:
  // - studioos.pro → LP StudioOS
  // - admin.studioos.pro → Admin (canônico)
  // - fornecedores.studioos.pro → Fornecedores
  // - {slug}-app.studioos.pro → App Organização
  // - cliente.com.br → LP Cliente
  // - app.cliente.com.br → Sistema Cliente
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const allowDevRoutes = allowsDevRoutes(hostname);

  if (!allowDevRoutes) {
    // Em produção, se não há domínio configurado, mostrar erro
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Domínio não configurado</h1>
          <p className="text-muted-foreground">
            Este domínio não está configurado no sistema. 
            Por favor, acesse através do domínio correto.
          </p>
        </div>
      </div>
    );
  }
  return (
    <ThemeInitializer>
      <OnboardingProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/nossos-produtos" element={<OurProducts />} />
          <Route path="/auth" element={<Auth />} />
          <Route 
            path="/gerarorcamento" 
            element={
              <ProtectedRoute>
                <GerarOrcamento />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/gerenciarusuarios" 
            element={
              <AdminRoute>
                <GerenciarUsuarios />
              </AdminRoute>
            } 
          />
          <Route 
            path="/configuracoes/organizacao" 
            element={
              <ProtectedRoute>
                <ConfiguracoesOrganizacao />
              </ProtectedRoute>
            } 
          />
          <Route path="/documentacao" element={<Documentacao />} />
          <Route path="/cadastro-fornecedor" element={<CadastroFornecedor />} />
          <Route path="/fornecedores/cadastro" element={<CadastroFornecedor />} />
          <Route path="/fornecedores" element={<SupplierPortal />} />
          <Route path="/lp/:slug" element={<LandingPageOrganizacao />} />
          <Route path="/studioos" element={<LandingPageStudioOS />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </OnboardingProvider>
    </ThemeInitializer>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <OrganizationProvider>
            <AppContent />
          </OrganizationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
