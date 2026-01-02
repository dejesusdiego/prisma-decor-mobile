import { useState, useCallback, useEffect } from 'react';

export type TourId = 'dashboard' | 'wizard' | 'crm' | 'financeiro' | 'producao';

interface OnboardingState {
  completedTours: TourId[];
  skipped: boolean;
  lastSeen: string | null;
}

const STORAGE_KEY = 'prisma_onboarding';

function getStoredState(): OnboardingState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Erro ao ler onboarding state:', e);
  }
  return { completedTours: [], skipped: false, lastSeen: null };
}

function saveState(state: OnboardingState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Erro ao salvar onboarding state:', e);
  }
}

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(getStoredState);
  const [activeTour, setActiveTour] = useState<TourId | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Mostrar welcome apenas se nunca viu e não pulou
    const stored = getStoredState();
    if (!stored.lastSeen && !stored.skipped) {
      setShowWelcome(true);
    }
  }, []);

  const isTourCompleted = useCallback((tourId: TourId) => {
    return state.completedTours.includes(tourId);
  }, [state.completedTours]);

  const startTour = useCallback((tourId: TourId) => {
    setActiveTour(tourId);
    setCurrentStep(0);
    setShowWelcome(false);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => prev + 1);
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  const completeTour = useCallback((tourId: TourId) => {
    const newState = {
      ...state,
      completedTours: [...new Set([...state.completedTours, tourId])],
      lastSeen: new Date().toISOString(),
    };
    setState(newState);
    saveState(newState);
    setActiveTour(null);
    setCurrentStep(0);
  }, [state]);

  const skipTour = useCallback(() => {
    const newState = {
      ...state,
      skipped: true,
      lastSeen: new Date().toISOString(),
    };
    setState(newState);
    saveState(newState);
    setActiveTour(null);
    setCurrentStep(0);
    setShowWelcome(false);
  }, [state]);

  const dismissWelcome = useCallback(() => {
    const newState = {
      ...state,
      lastSeen: new Date().toISOString(),
    };
    setState(newState);
    saveState(newState);
    setShowWelcome(false);
  }, [state]);

  const resetOnboarding = useCallback(() => {
    const newState: OnboardingState = {
      completedTours: [],
      skipped: false,
      lastSeen: null,
    };
    setState(newState);
    saveState(newState);
    setShowWelcome(true);
  }, []);

  return {
    activeTour,
    currentStep,
    showWelcome,
    isSkipped: state.skipped,
    completedTours: state.completedTours,
    isTourCompleted,
    startTour,
    nextStep,
    prevStep,
    completeTour,
    skipTour,
    dismissWelcome,
    resetOnboarding,
  };
}
