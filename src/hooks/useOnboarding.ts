import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

function saveLocalState(state: OnboardingState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Erro ao salvar onboarding state:', e);
  }
}

export function useOnboarding(userId?: string) {
  const [state, setState] = useState<OnboardingState>(getStoredState);
  const [activeTour, setActiveTour] = useState<TourId | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Buscar estado do banco de dados quando userId mudar
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchOnboardingState = async () => {
      try {
        const { data, error } = await supabase
          .from('user_onboarding')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.error('Erro ao buscar onboarding:', error);
          setIsLoading(false);
          return;
        }

        if (data) {
          // Usuário já tem registro - não mostrar welcome
          const dbState: OnboardingState = {
            completedTours: (data.completed_tours || []) as TourId[],
            skipped: data.skipped || false,
            lastSeen: data.first_seen_at,
          };
          setState(dbState);
          saveLocalState(dbState);
          setShowWelcome(false);
        } else {
          // Primeira vez do usuário - mostrar welcome e criar registro
          setShowWelcome(true);
          await supabase.from('user_onboarding').insert({
            user_id: userId,
            completed_tours: [],
            skipped: false,
          });
        }
      } catch (e) {
        console.error('Erro ao processar onboarding:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOnboardingState();
  }, [userId]);

  const saveToDatabase = useCallback(async (newState: OnboardingState) => {
    if (!userId) return;

    try {
      await supabase
        .from('user_onboarding')
        .update({
          completed_tours: newState.completedTours,
          skipped: newState.skipped,
          last_seen_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } catch (e) {
      console.error('Erro ao salvar onboarding no banco:', e);
    }
  }, [userId]);

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
    // Atualizar estado imediatamente para fechar o tour
    setActiveTour(null);
    setCurrentStep(0);
    
    const newState = {
      ...state,
      completedTours: [...new Set([...state.completedTours, tourId])],
      lastSeen: new Date().toISOString(),
    };
    setState(newState);
    saveLocalState(newState);
    saveToDatabase(newState);
    
    // Feedback visual (será importado dinamicamente para evitar dependência circular)
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        import('sonner').then(({ toast }) => {
          toast.success('Tour concluído! 🎉', {
            description: 'Você agora conhece as principais funcionalidades do sistema.',
            duration: 3000,
          });
        }).catch(() => {
          // Ignorar erro se sonner não estiver disponível
        });
      }, 200);
    }
  }, [state, saveToDatabase]);

  const skipTour = useCallback(() => {
    const newState = {
      ...state,
      skipped: true,
      lastSeen: new Date().toISOString(),
    };
    setState(newState);
    saveLocalState(newState);
    saveToDatabase(newState);
    setActiveTour(null);
    setCurrentStep(0);
    setShowWelcome(false);
  }, [state, saveToDatabase]);

  const dismissWelcome = useCallback(() => {
    const newState = {
      ...state,
      lastSeen: new Date().toISOString(),
    };
    setState(newState);
    saveLocalState(newState);
    saveToDatabase(newState);
    setShowWelcome(false);
  }, [state, saveToDatabase]);

  const resetOnboarding = useCallback(async () => {
    const newState: OnboardingState = {
      completedTours: [],
      skipped: false,
      lastSeen: null,
    };
    setState(newState);
    saveLocalState(newState);
    
    if (userId) {
      try {
        await supabase
          .from('user_onboarding')
          .update({
            completed_tours: [],
            skipped: false,
            last_seen_at: null,
          })
          .eq('user_id', userId);
      } catch (e) {
        console.error('Erro ao resetar onboarding no banco:', e);
      }
    }
    
    setShowWelcome(true);
  }, [userId]);

  return {
    activeTour,
    currentStep,
    showWelcome,
    isSkipped: state.skipped,
    completedTours: state.completedTours,
    isLoading,
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
