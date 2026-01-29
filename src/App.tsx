import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { ThemeInitializer } from "@/components/ThemeInitializer";
import { DomainRouter } from "@/routing/DomainRouter";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutos
      gcTime: 30 * 60 * 1000, // 30 minutos
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * AppContent - Componente principal de conteúdo
 * 
 * Delega todo o roteamento para o DomainRouter, que gerencia:
 * - Resolução de domínio baseada em hostname
 * - Roteamento por domínio (admin, app, supplier, marketing, landing-org)
 * - Validação de acesso e redirecionamentos
 */
const AppContent = () => {
  return (
    <ThemeInitializer>
      <OnboardingProvider>
        <DomainRouter />
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
