import { useEffect, useRef, useCallback, useState } from 'react';

interface UseAutoSaveOptions {
  enabled: boolean;
  delay?: number;
  onSave: () => Promise<void>;
  hasChanges: boolean;
  isValid: boolean;
}

interface UseAutoSaveReturn {
  isAutoSaving: boolean;
  lastAutoSaved: Date | null;
  cancelAutoSave: () => void;
}

/**
 * Hook para auto-save com debounce
 * Salva automaticamente após período de inatividade quando há mudanças válidas
 */
export function useAutoSave({
  enabled,
  delay = 3000,
  onSave,
  hasChanges,
  isValid,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastAutoSaved, setLastAutoSaved] = useState<Date | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const cancelAutoSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cancelAutoSave();
    };
  }, [cancelAutoSave]);

  useEffect(() => {
    // Limpa timer anterior
    cancelAutoSave();

    // Só inicia auto-save se habilitado, com mudanças e válido
    if (!enabled || !hasChanges || !isValid) {
      return;
    }

    timerRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return;
      
      setIsAutoSaving(true);
      try {
        await onSave();
        if (isMountedRef.current) {
          setLastAutoSaved(new Date());
        }
      } catch (error) {
        console.error('Erro no auto-save:', error);
      } finally {
        if (isMountedRef.current) {
          setIsAutoSaving(false);
        }
      }
    }, delay);

    return cancelAutoSave;
  }, [enabled, hasChanges, isValid, delay, onSave, cancelAutoSave]);

  return {
    isAutoSaving,
    lastAutoSaved,
    cancelAutoSave,
  };
}
