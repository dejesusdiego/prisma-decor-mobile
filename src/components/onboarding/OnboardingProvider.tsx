import React, { createContext, useContext, ReactNode } from 'react';
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

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { user, loading: authLoading } = useAuth();
  const onboarding = useOnboarding(user?.id);

  // Só mostrar onboarding para usuários autenticados e quando não está carregando
  const shouldShowOnboarding = Boolean(
    user && 
    !authLoading && 
    !onboarding.isLoading && 
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
