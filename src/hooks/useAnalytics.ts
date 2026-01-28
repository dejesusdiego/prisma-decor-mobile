/**
 * Hook de Analytics para StudioOS
 *
 * Responsável por:
 * - Tracking de eventos (page views, cliques, conversões)
 * - Busca de métricas agregadas
 * - Cálculo de taxas de conversão
 * - Dashboard de analytics
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useOrganization } from '@/hooks/useOrganization';

// Type extensions para database schema não gerado ainda
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

// ===========================================
// TIPOS
// ===========================================

export type EventCategory = 'page_view' | 'interaction' | 'conversion' | 'error' | 'engagement';

export interface AnalyticsEvent {
  id: string;
  organization_id: string;
  event_type: string;
  event_category: EventCategory;
  user_id: string | null;
  session_id: string | null;
  properties: Record<string, unknown>;
  page_url: string | null;
  referrer: string | null;
  created_at: string;
}

export interface DailyMetrics {
  id: string;
  organization_id: string;
  metric_date: string;
  page_views: number;
  unique_visitors: number;
  sessions: number;
  orcamentos_criados: number;
  orcamentos_convertidos: number;
  visitas_solicitadas: number;
  visitas_agendadas: number;
  avg_session_duration: number;
  bounce_rate: number;
  receita_total: number;
  ticket_medio: number;
  updated_at: string;
}

export interface FunnelMetrics {
  funnel_date: string;
  visitas_landing: number;
  cliques_whatsapp: number;
  orcamentos_criados: number;
  orcamentos_aprovados: number;
  taxa_conversao: number;
}

export interface ConversionMetrics {
  totalOrcamentos: number;
  orcamentosAprovados: number;
  orcamentosPendentes: number;
  orcamentosRecusados: number;
  taxaConversao: number;
  ticketMedio: number;
  receitaTotal: number;
  periodo: string;
}

export interface DashboardAnalytics {
  // Resumo
  totalOrcamentos: number;
  orcamentosAprovados: number;
  orcamentosPendentes: number;
  taxaConversao: number;
  receitaTotal: number;
  ticketMedio: number;
  
  // Visitas
  visitasTotais: number;
  visitasMes: number;
  visitasSemana: number;
  
  // Funil
  funil: FunnelMetrics[];
  
  // Tendências
  tendenciaOrcamentos: 'up' | 'down' | 'stable';
  tendenciaReceita: 'up' | 'down' | 'stable';
}

export interface PeriodFilter {
  startDate: Date;
  endDate: Date;
  label: string;
}

// ===========================================
// CONSTANTES
// ===========================================

export const EVENT_TYPES = {
  // Page Views
  PAGE_VIEW: 'page_view',
  LANDING_VIEW: 'landing_view',
  
  // Interactions
  WHATSAPP_CLICK: 'whatsapp_click',
  FORM_SUBMIT: 'form_submit',
  BUTTON_CLICK: 'button_click',
  
  // Conversões
  ORCAMENTO_CREATED: 'orcamento_created',
  ORCAMENTO_APPROVED: 'orcamento_approved',
  VISITA_SOLICITADA: 'visita_solicitada',
  VISITA_AGENDADA: 'visita_agendada',
  
  // Engagement
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  
  // Errors
  ERROR: 'error',
} as const;

// ===========================================
// FUNÇÕES UTILITÁRIAS
// ===========================================

/**
 * Gera um ID de sessão único
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Obtém ou cria session_id
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Obtém períodos predefinidos
 */
export function getPeriods(): Record<string, PeriodFilter> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  return {
    '7d': {
      startDate: sevenDaysAgo,
      endDate: today,
      label: 'Últimos 7 dias',
    },
    '30d': {
      startDate: thirtyDaysAgo,
      endDate: today,
      label: 'Últimos 30 dias',
    },
    '90d': {
      startDate: ninetyDaysAgo,
      endDate: today,
      label: 'Últimos 90 dias',
    },
    'month': {
      startDate: startOfMonth,
      endDate: today,
      label: 'Este mês',
    },
  };
}

// ===========================================
// HOOKS
// ===========================================

/**
 * Hook para tracking de eventos
 */
export function useAnalyticsTracking() {
  const { organization } = useOrganization();
  const organizationId = organization?.id;

  const trackEvent = useMutation({
    mutationFn: async ({
      eventType,
      eventCategory,
      properties = {},
    }: {
      eventType: string;
      eventCategory: EventCategory;
      properties?: Record<string, unknown>;
    }) => {
      if (!organizationId) {
        logger.warn('Analytics: Tentativa de track sem organization_id');
        return null;
      }

      try {
        const sessionId = getSessionId();
        
        // Usar RPC para inserir evento (com type assertion)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as AnySupabase).rpc('track_analytics_event', {
          p_organization_id: organizationId,
          p_event_type: eventType,
          p_event_category: eventCategory,
          p_properties: properties,
          p_page_url: typeof window !== 'undefined' ? window.location.href : null,
          p_referrer: typeof document !== 'undefined' ? document.referrer : null,
        });

        if (error) {
          // Fallback: inserir diretamente se RPC falhar
          const { error: insertError } = await (supabase as AnySupabase)
            .from('analytics_events')
            .insert({
              organization_id: organizationId,
              event_type: eventType,
              event_category: eventCategory,
              properties,
              page_url: typeof window !== 'undefined' ? window.location.href : null,
              referrer: typeof document !== 'undefined' ? document.referrer : null,
              session_id: sessionId,
            });

          if (insertError) throw insertError;
        }

        return data;
      } catch (error) {
        logger.error('Analytics: Erro ao track evento', { error, eventType });
        return null;
      }
    },
  });

  const trackPageView = (pageName?: string) => {
    return trackEvent.mutate({
      eventType: EVENT_TYPES.PAGE_VIEW,
      eventCategory: 'page_view',
      properties: {
        page: pageName || (typeof window !== 'undefined' ? window.location.pathname : ''),
        title: typeof document !== 'undefined' ? document.title : '',
      },
    });
  };

  const trackWhatsAppClick = (vendedorId?: string) => {
    return trackEvent.mutate({
      eventType: EVENT_TYPES.WHATSAPP_CLICK,
      eventCategory: 'conversion',
      properties: {
        vendedor_id: vendedorId,
        source: 'whatsapp_button',
      },
    });
  };

  const trackOrcamentoCreated = (orcamentoId: string, valor?: number) => {
    return trackEvent.mutate({
      eventType: EVENT_TYPES.ORCAMENTO_CREATED,
      eventCategory: 'conversion',
      properties: {
        orcamento_id: orcamentoId,
        valor: valor || 0,
      },
    });
  };

  const trackConversion = (type: string, value?: number, metadata?: Record<string, unknown>) => {
    return trackEvent.mutate({
      eventType: type,
      eventCategory: 'conversion',
      properties: {
        value: value || 0,
        ...metadata,
      },
    });
  };

  return {
    trackEvent: trackEvent.mutate,
    trackPageView,
    trackWhatsAppClick,
    trackOrcamentoCreated,
    trackConversion,
    isPending: trackEvent.isPending,
  };
}

/**
 * Hook para métricas diárias
 */
export function useDailyMetrics(period: string = '30d') {
  const { organization } = useOrganization();
  const organizationId = organization?.id;
  const periods = getPeriods();
  const selectedPeriod = periods[period] || periods['30d'];

  return useQuery({
    queryKey: ['dailyMetrics', organizationId, period],
    queryFn: async (): Promise<DailyMetrics[]> => {
      if (!organizationId) return [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as AnySupabase)
        .from('analytics_daily_metrics')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('metric_date', selectedPeriod.startDate.toISOString().split('T')[0])
        .lte('metric_date', selectedPeriod.endDate.toISOString().split('T')[0])
        .order('metric_date', { ascending: false });

      if (error) {
        logger.error('Analytics: Erro ao buscar métricas diárias', { error });
        throw error;
      }

      return (data || []) as DailyMetrics[];
    },
    enabled: !!organizationId,
  });
}

/**
 * Hook para métricas do funil
 */
export function useFunnelMetrics(period: string = '30d') {
  const { organization } = useOrganization();
  const organizationId = organization?.id;
  const periods = getPeriods();
  const selectedPeriod = periods[period] || periods['30d'];

  return useQuery({
    queryKey: ['funnelMetrics', organizationId, period],
    queryFn: async (): Promise<FunnelMetrics[]> => {
      if (!organizationId) return [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as AnySupabase).rpc('calculate_funnel_metrics', {
        p_organization_id: organizationId,
        p_start_date: selectedPeriod.startDate.toISOString().split('T')[0],
        p_end_date: selectedPeriod.endDate.toISOString().split('T')[0],
      });

      if (error) {
        logger.error('Analytics: Erro ao buscar métricas do funil', { error });
        throw error;
      }

      return (data || []) as FunnelMetrics[];
    },
    enabled: !!organizationId,
  });
}

/**
 * Hook para métricas de conversão
 */
export function useConversionMetrics(period: string = '30d') {
  const { organization } = useOrganization();
  const organizationId = organization?.id;
  const periods = getPeriods();
  const selectedPeriod = periods[period] || periods['30d'];

  return useQuery({
    queryKey: ['conversionMetrics', organizationId, period],
    queryFn: async (): Promise<ConversionMetrics> => {
      if (!organizationId) {
        return {
          totalOrcamentos: 0,
          orcamentosAprovados: 0,
          orcamentosPendentes: 0,
          orcamentosRecusados: 0,
          taxaConversao: 0,
          ticketMedio: 0,
          receitaTotal: 0,
          periodo: selectedPeriod.label,
        };
      }

      const startDate = selectedPeriod.startDate.toISOString();
      const endDate = new Date(selectedPeriod.endDate);
      endDate.setHours(23, 59, 59, 999);

      // Buscar orçamentos do período
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: orcamentos, error } = await (supabase as AnySupabase)
        .from('orcamentos')
        .select('status, valor_total')
        .eq('organization_id', organizationId)
        .gte('created_at', startDate)
        .lte('created_at', endDate.toISOString());

      if (error) {
        logger.error('Analytics: Erro ao buscar orçamentos', { error });
        throw error;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orcList = (orcamentos || []) as any[];
      const total = orcList.length || 0;
      const aprovados = orcList.filter(o => o.status === 'aprovado').length || 0;
      const pendentes = orcList.filter(o => o.status === 'pendente').length || 0;
      const recusados = orcList.filter(o => o.status === 'recusado').length || 0;
      
      const receitaTotal = orcList
        .filter(o => o.status === 'aprovado')
        .reduce((sum, o) => sum + (o.valor_total || 0), 0) || 0;

      return {
        totalOrcamentos: total,
        orcamentosAprovados: aprovados,
        orcamentosPendentes: pendentes,
        orcamentosRecusados: recusados,
        taxaConversao: total > 0 ? (aprovados / total) * 100 : 0,
        ticketMedio: aprovados > 0 ? receitaTotal / aprovados : 0,
        receitaTotal,
        periodo: selectedPeriod.label,
      };
    },
    enabled: !!organizationId,
  });
}

/**
 * Hook para dashboard completo de analytics
 */
export function useAnalyticsDashboard(period: string = '30d') {
  const { organization } = useOrganization();
  const organizationId = organization?.id;
  
  const { data: dailyMetrics } = useDailyMetrics(period);
  const { data: funnelMetrics } = useFunnelMetrics(period);
  const { data: conversionMetrics } = useConversionMetrics(period);

  // Calcular visitas totais
  const visitasTotais = dailyMetrics?.reduce((sum, m) => sum + (m.page_views || 0), 0) || 0;
  
  // Calcular tendências (comparar com período anterior)
  const calcularTendencia = (atual: number, anterior: number): 'up' | 'down' | 'stable' => {
    if (anterior === 0) return atual > 0 ? 'up' : 'stable';
    const variacao = ((atual - anterior) / anterior) * 100;
    if (variacao > 5) return 'up';
    if (variacao < -5) return 'down';
    return 'stable';
  };

  // Dados agregados
  const dashboard: DashboardAnalytics = {
    totalOrcamentos: conversionMetrics?.totalOrcamentos || 0,
    orcamentosAprovados: conversionMetrics?.orcamentosAprovados || 0,
    orcamentosPendentes: conversionMetrics?.orcamentosPendentes || 0,
    taxaConversao: conversionMetrics?.taxaConversao || 0,
    receitaTotal: conversionMetrics?.receitaTotal || 0,
    ticketMedio: conversionMetrics?.ticketMedio || 0,
    visitasTotais,
    visitasMes: visitasTotais,
    visitasSemana: (dailyMetrics || []).slice(0, 7).reduce((sum, m) => sum + (m.page_views || 0), 0),
    funil: funnelMetrics || [],
    tendenciaOrcamentos: 'stable',
    tendenciaReceita: 'stable',
  };

  return {
    dashboard,
    dailyMetrics,
    funnelMetrics,
    conversionMetrics,
    isLoading: !dailyMetrics || !funnelMetrics || !conversionMetrics,
  };
}

/**
 * Hook para atualizar métricas diárias (admin)
 */
export function useUpdateDailyMetrics() {
  const { organization } = useOrganization();
  const organizationId = organization?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (date?: Date) => {
      if (!organizationId) throw new Error('Organization ID não encontrado');

      const targetDate = date || new Date();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as AnySupabase).rpc('update_daily_metrics', {
        p_organization_id: organizationId,
        p_date: targetDate.toISOString().split('T')[0],
      });

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['conversionMetrics'] });
    },
  });
}

// ===========================================
// EXPORT DEFAULT
// ===========================================

export function useAnalytics() {
  const tracking = useAnalyticsTracking();
  const dashboard = useAnalyticsDashboard();

  return {
    ...tracking,
    ...dashboard,
  };
}

export default useAnalytics;
