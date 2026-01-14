/**
 * Hook para verificar features disponíveis por plano
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

export interface OrganizationFeatures {
  plano: string;
  plano_nome: string;
  limite_orcamentos: number | null;
  limite_usuarios: number;
  orcamentos_mes: number;
  crm_basico: boolean;
  crm_avancado: boolean;
  producao_kanban: boolean;
  financeiro_completo: boolean;
  relatorios_bi: boolean;
  nfe_integracao: boolean;
  suporte_prioritario: boolean;
  whatsapp_integrado: boolean;
  api_acesso: boolean;
  customizacoes: boolean;
}

// Features e seus nomes amigáveis
export const FEATURE_NAMES: Record<string, string> = {
  crm_basico: 'CRM Básico',
  crm_avancado: 'CRM Avançado',
  producao_kanban: 'Produção (Kanban)',
  financeiro_completo: 'Financeiro Completo',
  relatorios_bi: 'Relatórios BI',
  nfe_integracao: 'Integração NF-e',
  suporte_prioritario: 'Suporte Prioritário',
  whatsapp_integrado: 'WhatsApp Integrado',
  api_acesso: 'API de Acesso',
  customizacoes: 'Customizações',
};

// Planos que desbloqueiam cada feature
export const FEATURE_UNLOCK_PLAN: Record<string, string> = {
  crm_basico: 'starter',
  crm_avancado: 'profissional',
  producao_kanban: 'starter',
  financeiro_completo: 'profissional',
  relatorios_bi: 'profissional',
  nfe_integracao: 'starter',
  suporte_prioritario: 'business',
  whatsapp_integrado: 'enterprise',
  api_acesso: 'enterprise',
  customizacoes: 'enterprise',
};

export function useFeatureFlags() {
  const { organizationId } = useOrganizationContext();

  const { data: features, isLoading, error } = useQuery({
    queryKey: ['organization-features', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;

      try {
        // Tentar buscar via RPC (função org_get_features)
        const { data, error } = await supabase
          .rpc('org_get_features', { org_id: organizationId });

        if (error) {
          // Se a função não existe ainda, usar fallback
          if (error.code === '42883' || error.message.includes('function') || error.message.includes('does not exist')) {
            // Feature flags não configurados ainda - usar fallback enterprise silenciosamente
            return getEnterpriseFeatures();
          }
          // Log apenas em desenvolvimento
          if (import.meta.env.DEV) {
            console.error('Erro ao buscar features:', error);
          }
          return getEnterpriseFeatures();
        }

        return data?.[0] as OrganizationFeatures || getEnterpriseFeatures();
      } catch (e) {
        // Log apenas em desenvolvimento
        if (import.meta.env.DEV) {
          console.warn('Erro ao buscar features, usando fallback:', e);
        }
        return getEnterpriseFeatures();
      }
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    retry: false, // Não retentar se falhar (provavelmente função não existe)
  });

  /**
   * Verifica se a organização tem acesso a uma feature específica
   */
  const hasFeature = (featureName: keyof OrganizationFeatures): boolean => {
    if (!features) return false;
    return !!features[featureName];
  };

  /**
   * Verifica se pode criar mais orçamentos no mês
   */
  const canCreateOrcamento = (): boolean => {
    if (!features) return false;
    if (features.limite_orcamentos === null) return true; // Ilimitado
    return features.orcamentos_mes < features.limite_orcamentos;
  };

  /**
   * Retorna quantos orçamentos restam no mês
   */
  const orcamentosRestantes = (): number | null => {
    if (!features) return 0;
    if (features.limite_orcamentos === null) return null; // Ilimitado
    return Math.max(0, features.limite_orcamentos - features.orcamentos_mes);
  };

  /**
   * Retorna o plano mínimo necessário para desbloquear uma feature
   */
  const getUpgradePlanFor = (featureName: string): string => {
    return FEATURE_UNLOCK_PLAN[featureName] || 'profissional';
  };

  return {
    features,
    isLoading,
    error,
    hasFeature,
    canCreateOrcamento,
    orcamentosRestantes,
    getUpgradePlanFor,
    // Atalhos para features comuns
    hasCrmAvancado: hasFeature('crm_avancado'),
    hasFinanceiro: hasFeature('financeiro_completo'),
    hasBI: hasFeature('relatorios_bi'),
    hasWhatsApp: hasFeature('whatsapp_integrado'),
    hasAPI: hasFeature('api_acesso'),
  };
}

/**
 * Features padrão para plano Starter (fallback restritivo)
 */
function getDefaultFeatures(): OrganizationFeatures {
  return {
    plano: 'starter',
    plano_nome: 'Starter',
    limite_orcamentos: 100,
    limite_usuarios: 3,
    orcamentos_mes: 0,
    crm_basico: true,
    crm_avancado: false,
    producao_kanban: true,
    financeiro_completo: false,
    relatorios_bi: false,
    nfe_integracao: true,
    suporte_prioritario: false,
    whatsapp_integrado: false,
    api_acesso: false,
    customizacoes: false,
  };
}

/**
 * Features do plano Enterprise (fallback permissivo - enquanto sistema não está configurado)
 */
function getEnterpriseFeatures(): OrganizationFeatures {
  return {
    plano: 'enterprise',
    plano_nome: 'Enterprise',
    limite_orcamentos: null,
    limite_usuarios: 50,
    orcamentos_mes: 0,
    crm_basico: true,
    crm_avancado: true,
    producao_kanban: true,
    financeiro_completo: true,
    relatorios_bi: true,
    nfe_integracao: true,
    suporte_prioritario: true,
    whatsapp_integrado: true,
    api_acesso: true,
    customizacoes: true,
  };
}

export default useFeatureFlags;
