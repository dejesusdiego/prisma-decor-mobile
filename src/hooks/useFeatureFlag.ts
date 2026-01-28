import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FeatureFlag {
  name: string;
  description: string;
  category: string;
  value: boolean;
  has_override: boolean;
  plan_value: boolean;
}

interface UseFeatureFlagsResult {
  flags: FeatureFlag[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  checkFlag: (flagName: string) => boolean;
}

interface UseFeatureFlagResult {
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to get all feature flags for the current organization
 */
export function useFeatureFlags(organizationId: string | null): UseFeatureFlagsResult {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    if (!organizationId) {
      setFlags([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: rpcError } = await (supabase as any)
        .rpc('get_organization_features', {
          p_organization_id: organizationId,
        });

      if (rpcError) throw rpcError;

      setFlags(data || []);
    } catch (err: any) {
      console.error('Error fetching feature flags:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const checkFlag = useCallback(
    (flagName: string): boolean => {
      const flag = flags.find((f) => f.name === flagName);
      return flag?.value ?? false;
    },
    [flags]
  );

  return {
    flags,
    isLoading,
    error,
    refetch: fetchFlags,
    checkFlag,
  };
}

/**
 * Hook to check a single feature flag
 */
export function useFeatureFlag(
  organizationId: string | null,
  flagName: string
): UseFeatureFlagResult {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkFeature = async () => {
      if (!organizationId || !flagName) {
        setIsEnabled(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const { data, error: rpcError } = await (supabase as any)
          .rpc('check_feature_flag', {
            p_organization_id: organizationId,
            p_flag_name: flagName,
          });

        if (rpcError) throw rpcError;

        setIsEnabled(data ?? false);
      } catch (err: any) {
        console.error('Error checking feature flag:', err);
        setError(err.message);
        setIsEnabled(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkFeature();
  }, [organizationId, flagName]);

  return { isEnabled, isLoading, error };
}

/**
 * Hook to manage feature flags (Super Admin only)
 */
export function useFeatureFlagManager() {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Update feature flag default values for plans
   */
  const updatePlanValues = useCallback(
    async (
      flagId: string,
      planValues: Record<string, boolean>
    ): Promise<boolean> => {
      try {
        setIsLoading(true);

        const { error } = await supabase
          .from('feature_flags')
          .update({ plan_values: planValues })
          .eq('id', flagId);

        if (error) throw error;

        toast.success('Valores do plano atualizados com sucesso');
        return true;
      } catch (err: any) {
        console.error('Error updating plan values:', err);
        toast.error('Erro ao atualizar valores do plano');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Create or update organization override
   */
  const setOrganizationOverride = useCallback(
    async (
      organizationId: string,
      flagName: string,
      value: boolean,
      reason?: string
    ): Promise<boolean> => {
      try {
        setIsLoading(true);

        // Call Edge Function
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;

        if (!token) {
          throw new Error('No authentication token');
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-feature-flag`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              organizationId,
              flagName,
              value,
              reason,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update feature flag');
        }

        toast.success(
          `Feature flag ${flagName} ${value ? 'habilitada' : 'desabilitada'} para a organização`
        );
        return true;
      } catch (err: any) {
        console.error('Error setting organization override:', err);
        toast.error('Erro ao atualizar feature flag');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Remove organization override
   */
  const removeOverride = useCallback(
    async (organizationId: string, flagId: string): Promise<boolean> => {
      try {
        setIsLoading(true);

        const { error } = await supabase
          .from('organization_feature_overrides')
          .delete()
          .eq('organization_id', organizationId)
          .eq('feature_flag_id', flagId);

        if (error) throw error;

        toast.success('Override removido com sucesso');
        return true;
      } catch (err: any) {
        console.error('Error removing override:', err);
        toast.error('Erro ao remover override');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    updatePlanValues,
    setOrganizationOverride,
    removeOverride,
  };
}

export default useFeatureFlag;
