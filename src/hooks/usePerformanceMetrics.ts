/**
 * Hook para coletar e analisar métricas de performance em produção
 * Envia dados para análise e gera alertas
 */

import { useEffect, useRef } from 'react';
import { monitor } from './usePerformanceMonitor';

interface PerformanceMetrics {
  queries: {
    name: string;
    avgTime: number;
    maxTime: number;
    count: number;
    lastExecuted: number;
  }[];
  slowQueries: {
    name: string;
    time: number;
    timestamp: number;
  }[];
  errors: {
    name: string;
    message: string;
    timestamp: number;
  }[];
}

const SLOW_QUERY_THRESHOLD = 1000; // 1 segundo
const METRICS_INTERVAL = 60000; // 1 minuto

export function usePerformanceMetrics() {
  const metricsRef = useRef<PerformanceMetrics>({
    queries: [],
    slowQueries: [],
    errors: [],
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const allMetrics = monitor.getAllMetrics();
      const summary = monitor.getMetrics();

      // Atualizar métricas de queries
      const queries = Object.entries(summary).map(([name, data]) => ({
        name,
        avgTime: data.avg,
        maxTime: data.max,
        count: data.count,
        lastExecuted: Date.now(),
      }));

      // Identificar queries lentas
      const slowQueries = allMetrics
        .filter(m => m.duration > SLOW_QUERY_THRESHOLD)
        .map(m => ({
          name: m.name,
          time: m.duration,
          timestamp: m.timestamp,
        }));

      metricsRef.current = {
        queries,
        slowQueries,
        errors: [], // Pode ser expandido para coletar erros
      };

      // Em produção, enviar para serviço de monitoramento
      if (import.meta.env.PROD && slowQueries.length > 0) {
        // TODO: Integrar com serviço de APM (Sentry, New Relic, etc.)
        console.warn('⚠️ Queries lentas detectadas:', slowQueries);
      }
    }, METRICS_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const getMetrics = () => metricsRef.current;

  const getSlowQueries = () => metricsRef.current.slowQueries;

  const getQueryStats = (queryName: string) => {
    return metricsRef.current.queries.find(q => q.name === queryName);
  };

  return {
    getMetrics,
    getSlowQueries,
    getQueryStats,
  };
}

/**
 * Função para exportar métricas para análise
 */
export function exportMetricsForAnalysis() {
  const data = monitor.export();
  
  return {
    ...data,
    timestamp: Date.now(),
    environment: import.meta.env.MODE,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  };
}
