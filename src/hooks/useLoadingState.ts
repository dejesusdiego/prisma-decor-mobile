/**
 * Hook para gerenciar estados de loading de forma consistente
 */

import { useState, useCallback } from 'react';

interface UseLoadingStateOptions {
  /** Mensagem de loading inicial */
  initialMessage?: string;
  /** Callback quando loading inicia */
  onStart?: () => void;
  /** Callback quando loading termina */
  onEnd?: () => void;
}

interface UseLoadingStateReturn {
  /** Se está carregando */
  isLoading: boolean;
  /** Mensagem de loading atual */
  loadingMessage: string;
  /** Iniciar loading */
  startLoading: (message?: string) => void;
  /** Parar loading */
  stopLoading: () => void;
  /** Executar função assíncrona com loading automático */
  withLoading: <T>(fn: () => Promise<T>, message?: string) => Promise<T>;
  /** Setar mensagem de loading */
  setMessage: (message: string) => void;
}

/**
 * Hook para gerenciar estado de loading
 */
export function useLoadingState(
  options: UseLoadingStateOptions = {}
): UseLoadingStateReturn {
  const { initialMessage = 'Carregando...', onStart, onEnd } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(initialMessage);

  const startLoading = useCallback((message?: string) => {
    if (message) setLoadingMessage(message);
    setIsLoading(true);
    onStart?.();
  }, [onStart]);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage(initialMessage);
    onEnd?.();
  }, [initialMessage, onEnd]);

  const withLoading = useCallback(async <T,>(
    fn: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    try {
      startLoading(message);
      return await fn();
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  const setMessage = useCallback((message: string) => {
    setLoadingMessage(message);
  }, []);

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    withLoading,
    setMessage,
  };
}

/**
 * Hook para múltiplos estados de loading simultâneos
 */
export function useMultipleLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading,
    }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  const withLoading = useCallback(async <T,>(
    key: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    try {
      setLoading(key, true);
      return await fn();
    } finally {
      setLoading(key, false);
    }
  }, [setLoading]);

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    withLoading,
  };
}
