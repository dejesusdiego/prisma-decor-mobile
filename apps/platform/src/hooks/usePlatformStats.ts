import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface PlatformStats {
  totalOrganizations: number
  activeOrganizations: number
  totalUsers: number
  pendingSuppliers: number
  mrr: number
}

export function usePlatformStats() {
  return useQuery<PlatformStats>({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      // Get organizations count
      const { count: orgsCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })

      // Get active organizations (trial or active status)
      const { count: activeOrgsCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .in('status', ['trial', 'active'])

      // Get users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Get pending suppliers
      const { count: pendingSuppliersCount } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Calculate MRR (Monthly Recurring Revenue)
      const { data: orgs } = await supabase
        .from('organizations')
        .select('plan_id, plans(price)')
        .eq('status', 'active')

      const mrr = (orgs || []).reduce((acc, org) => {
        const price = (org.plans as any)?.price || 0
        return acc + price
      }, 0)

      return {
        totalOrganizations: orgsCount || 0,
        activeOrganizations: activeOrgsCount || 0,
        totalUsers: usersCount || 0,
        pendingSuppliers: pendingSuppliersCount || 0,
        mrr,
      }
    },
  })
}
