/**
 * Hook para monitorar performance de queries e operações
 * Útil para identificar gargalos em produção
 */

import { useEffect, useRef } from 'react';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 100; // Limitar quantidade de métricas armazenadas

  /**
   * Inicia medição de performance
   */
  start(name: string): () => void {
    const startTime = performance.now();
    const timestamp = Date.now();

    return () => {
      const duration = performance.now() - startTime;
      this.record(name, duration, timestamp);
    };
  }

  /**
   * Registra uma métrica
   */
  record(name: string, duration: number, timestamp: number, metadata?: Record<string, unknown>) {
    this.metrics.push({
      name,
      duration: Math.round(duration),
      timestamp,
      metadata,
    });

    // Limitar quantidade de métricas
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log apenas em desenvolvimento ou se for muito lento (> 1s)
    if (import.meta.env.DEV || duration > 1000) {
      console.log(`⏱️  [Performance] ${name}: ${Math.round(duration)}ms`, metadata || '');
    }
  }

  /**
   * Obtém métricas agrupadas por nome
   */
  getMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const grouped: Record<string, number[]> = {};

    this.metrics.forEach(metric => {
      if (!grouped[metric.name]) {
        grouped[metric.name] = [];
      }
      grouped[metric.name].push(metric.duration);
    });

    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    Object.entries(grouped).forEach(([name, durations]) => {
      const sum = durations.reduce((a, b) => a + b, 0);
      result[name] = {
        avg: Math.round(sum / durations.length),
        min: Math.min(...durations),
        max: Math.max(...durations),
        count: durations.length,
      };
    });

    return result;
  }

  /**
   * Obtém todas as métricas
   */
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Limpa métricas
   */
  clear() {
    this.metrics = [];
  }

  /**
   * Exporta métricas para análise
   */
  export() {
    return {
      metrics: this.getAllMetrics(),
      summary: this.getMetrics(),
      timestamp: Date.now(),
    };
  }
}

// Instância global do monitor
const monitor = new PerformanceMonitor();

/**
 * Hook para monitorar performance de uma operação
 */
export function usePerformanceMonitor() {
  const endMeasurementRef = useRef<(() => void) | null>(null);

  const start = (name: string) => {
    if (endMeasurementRef.current) {
      endMeasurementRef.current(); // Finalizar medição anterior se houver
    }
    endMeasurementRef.current = monitor.start(name);
  };

  const end = () => {
    if (endMeasurementRef.current) {
      endMeasurementRef.current();
      endMeasurementRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      // Finalizar medição ao desmontar
      if (endMeasurementRef.current) {
        endMeasurementRef.current();
      }
    };
  }, []);

  return { start, end, getMetrics: () => monitor.getMetrics(), export: () => monitor.export() };
}

/**
 * Hook para monitorar performance de queries do React Query
 */
export function useQueryPerformance(queryName: string) {
  useEffect(() => {
    const end = monitor.start(`query:${queryName}`);
    return () => {
      end();
    };
  }, [queryName]);
}

/**
 * Função helper para medir performance de funções assíncronas
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const end = monitor.start(name);
  try {
    const result = await fn();
    return result;
  } finally {
    end();
  }
}

/**
 * Função helper para medir performance de funções síncronas
 */
export function measurePerformanceSync<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, unknown>
): T {
  const end = monitor.start(name);
  try {
    return fn();
  } finally {
    end();
  }
}

// Exportar instância do monitor para uso direto
export { monitor };

// Expor no window em desenvolvimento para debug
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).__performanceMonitor = monitor;
}
