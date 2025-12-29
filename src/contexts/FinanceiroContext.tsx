import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export type PeriodoFinanceiro = '7dias' | '30dias' | 'mesAtual' | 'mesAnterior' | '90dias' | 'custom';

interface DateRange {
  inicio: Date;
  fim: Date;
}

interface FinanceiroContextType {
  periodo: PeriodoFinanceiro;
  setPeriodo: (periodo: PeriodoFinanceiro) => void;
  dateRange: DateRange;
  setCustomDateRange: (inicio: Date, fim: Date) => void;
  invalidateAll: () => void;
  lastInvalidation: number;
}

const FinanceiroContext = createContext<FinanceiroContextType | undefined>(undefined);

const PERIODO_STORAGE_KEY = 'financeiro-periodo';

const getInitialPeriodo = (): PeriodoFinanceiro => {
  try {
    const saved = localStorage.getItem(PERIODO_STORAGE_KEY);
    if (saved && ['7dias', '30dias', 'mesAtual', 'mesAnterior', '90dias'].includes(saved)) {
      return saved as PeriodoFinanceiro;
    }
  } catch {
    // Ignore localStorage errors
  }
  return 'mesAtual';
};

const calculateDateRange = (periodo: PeriodoFinanceiro, customRange?: DateRange): DateRange => {
  const hoje = new Date();
  
  switch (periodo) {
    case '7dias':
      return { inicio: subDays(hoje, 7), fim: hoje };
    case '30dias':
      return { inicio: subDays(hoje, 30), fim: hoje };
    case 'mesAtual':
      return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) };
    case 'mesAnterior':
      const mesAnterior = subMonths(hoje, 1);
      return { inicio: startOfMonth(mesAnterior), fim: endOfMonth(mesAnterior) };
    case '90dias':
      return { inicio: subDays(hoje, 90), fim: hoje };
    case 'custom':
      return customRange || { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) };
    default:
      return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) };
  }
};

interface FinanceiroProviderProps {
  children: ReactNode;
}

export function FinanceiroProvider({ children }: FinanceiroProviderProps) {
  const [periodo, setPeridoState] = useState<PeriodoFinanceiro>(getInitialPeriodo);
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [lastInvalidation, setLastInvalidation] = useState(Date.now());

  const dateRange = calculateDateRange(periodo, customRange);

  const setPeriodo = useCallback((newPeriodo: PeriodoFinanceiro) => {
    setPeridoState(newPeriodo);
    try {
      localStorage.setItem(PERIODO_STORAGE_KEY, newPeriodo);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setCustomDateRange = useCallback((inicio: Date, fim: Date) => {
    setCustomRange({ inicio, fim });
    setPeridoState('custom');
  }, []);

  const invalidateAll = useCallback(() => {
    setLastInvalidation(Date.now());
  }, []);

  return (
    <FinanceiroContext.Provider
      value={{
        periodo,
        setPeriodo,
        dateRange,
        setCustomDateRange,
        invalidateAll,
        lastInvalidation,
      }}
    >
      {children}
    </FinanceiroContext.Provider>
  );
}

export function useFinanceiroContext() {
  const context = useContext(FinanceiroContext);
  if (context === undefined) {
    throw new Error('useFinanceiroContext must be used within a FinanceiroProvider');
  }
  return context;
}

// Hook simplificado para usar apenas o período (não requer Provider)
export function usePeriodoFinanceiro() {
  const [periodo, setPeridoState] = useState<PeriodoFinanceiro>(getInitialPeriodo);
  const [customRange, setCustomRange] = useState<DateRange | undefined>();

  const dateRange = calculateDateRange(periodo, customRange);

  const setPeriodo = useCallback((newPeriodo: PeriodoFinanceiro) => {
    setPeridoState(newPeriodo);
    try {
      localStorage.setItem(PERIODO_STORAGE_KEY, newPeriodo);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setCustomDateRange = useCallback((inicio: Date, fim: Date) => {
    setCustomRange({ inicio, fim });
    setPeridoState('custom');
  }, []);

  return {
    periodo,
    setPeriodo,
    dateRange,
    setCustomDateRange,
  };
}
