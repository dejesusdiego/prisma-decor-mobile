import React, { createContext, useContext, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useOnboarding, TourId } from '@/hooks/useOnboarding';
import { OnboardingDialog } from './OnboardingDialog';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingContextValue {
  activeTour: TourId | null;
  currentStep: number;
  showWelcome: boolean;
  isSkipped: boolean;
  completedTours: TourId[];
  isLoading: boolean;
  isTourCompleted: (tourId: TourId) => boolean;
  startTour: (tourId: TourId) => void;
  nextStep: () => void;
  prevStep: () => void;
  completeTour: (tourId: TourId) => void;
  skipTour: () => void;
  dismissWelcome: () => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboardingContext must be used within OnboardingProvider');
  }
  return context;
}

interface OnboardingProviderProps {
  children: ReactNode;
}

// Rotas públicas onde o tour NÃO deve aparecer
const PUBLIC_ROUTES = [
  '/',
  '/studioos',
  '/auth',
  '/documentacao',
  '/nossos-produtos',
];

// Verifica se a rota atual é pública
function isPublicRoute(pathname: string): boolean {
  // Verifica rotas exatas
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true;
  }
  
  // Verifica rotas de landing pages organizacionais (/lp/:slug)
  if (pathname.startsWith('/lp/')) {
    return true;
  }
  
  return false;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const onboarding = useOnboarding(user?.id);

  // Verificar se a rota atual é pública
  const isPublic = isPublicRoute(location.pathname);

  // Só mostrar onboarding para:
  // 1. Usuários autenticados
  // 2. Quando não está carregando
  // 3. Quando NÃO está em uma rota pública
  // 4. Quando o welcome deve ser mostrado
  const shouldShowOnboarding = Boolean(
    user && 
    !authLoading && 
    !onboarding.isLoading && 
    !isPublic && // NÃO mostrar em rotas públicas
    onboarding.showWelcome
  );

  return (
    <OnboardingContext.Provider value={onboarding}>
      {children}
      <OnboardingDialog
        open={shouldShowOnboarding}
        onOpenChange={(open) => {
          if (!open) onboarding.dismissWelcome();
        }}
        onStartTour={() => onboarding.startTour('dashboard')}
        onSkip={onboarding.skipTour}
      />
    </OnboardingContext.Provider>
  );
}
