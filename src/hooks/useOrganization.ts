import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

export function useOrganization() {
  const { user } = useAuth();

  const { data: membership, isLoading: isMembershipLoading } = useQuery({
    queryKey: ['organization-membership', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching organization membership:', error);
        return null;
      }
      
      return data as OrganizationMember;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: organization, isLoading: isOrgLoading } = useQuery({
    queryKey: ['organization', membership?.organization_id],
    queryFn: async () => {
      if (!membership?.organization_id) return null;
      
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', membership.organization_id)
        .single();
      
      if (error) {
        console.error('Error fetching organization:', error);
        return null;
      }
      
      return data as Organization;
    },
    enabled: !!membership?.organization_id,
    staleTime: 1000 * 60 * 5,
  });

  const isOwner = membership?.role === 'owner';
  const isAdmin = membership?.role === 'admin' || isOwner;
  const isMember = !!membership;

  return {
    organization,
    membership,
    isLoading: isMembershipLoading || isOrgLoading,
    isOwner,
    isAdmin,
    isMember,
    organizationId: organization?.id ?? null,
  };
}
