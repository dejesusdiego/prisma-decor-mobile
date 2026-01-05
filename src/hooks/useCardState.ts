import { useState, useRef, useCallback } from 'react';

interface UseCardStateOptions {
  initialExpanded?: boolean;
}

interface UseCardStateReturn {
  saving: boolean;
  setSaving: (value: boolean) => void;
  justSaved: boolean;
  setJustSaved: (value: boolean) => void;
  expanded: boolean;
  setExpanded: (value: boolean) => void;
  hasChanges: boolean;
  setHasChanges: (value: boolean) => void;
  cardRef: React.RefObject<HTMLDivElement>;
  flashSuccess: () => void;
  markSaved: () => void;
  autoSaved: boolean;
  setAutoSaved: (value: boolean) => void;
}

/**
 * Hook reutilizável para gerenciar estado comum de cards de produto
 * Encapsula: saving, justSaved, expanded, hasChanges, cardRef e animações
 */
export function useCardState(options: UseCardStateOptions = {}): UseCardStateReturn {
  const { initialExpanded = false } = options;

  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [expanded, setExpanded] = useState(initialExpanded);
  const [hasChanges, setHasChanges] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  /**
   * Dispara animação de flash de sucesso no card
   */
  const flashSuccess = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.classList.add('success-flash');
      setTimeout(() => cardRef.current?.classList.remove('success-flash'), 600);
    }
  }, []);

  /**
   * Marca o card como salvo com feedback visual e colapsa
   */
  const markSaved = useCallback(() => {
    setHasChanges(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
    flashSuccess();
    setExpanded(false);
  }, [flashSuccess]);

  return {
    saving,
    setSaving,
    justSaved,
    setJustSaved,
    expanded,
    setExpanded,
    hasChanges,
    setHasChanges,
    cardRef,
    flashSuccess,
    markSaved,
    autoSaved,
    setAutoSaved,
  };
}
