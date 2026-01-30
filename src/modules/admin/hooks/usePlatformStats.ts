import { useQuery } from '@tanstack/react-query'
import { supabase } from '@core/lib/supabase'

export interface PlatformStats {
  totalOrganizations: number
  activeOrganizations: number
  totalUsers: number
  totalSuppliers: number
  pendingSuppliers: number
  mrr: number
  recentOrganizations: {
    id: string
    name: string
    created_at: string
  }[]
}

export function usePlatformStats() {
  return useQuery<PlatformStats>({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      // Get organizations count
      const { count: totalOrganizations, error: orgsError } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })

      if (orgsError) throw orgsError

      // Get active organizations
      const { count: activeOrganizations, error: activeOrgsError } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      if (activeOrgsError) throw activeOrgsError

      // Get users count
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      if (usersError) throw usersError

      // Get suppliers count
      const { count: totalSuppliers, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true })

      if (suppliersError) throw suppliersError

      // Get pending suppliers
      const { count: pendingSuppliers, error: pendingError } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (pendingError) throw pendingError

      // Get recent organizations
      const { data: recentOrgs, error: recentError } = await supabase
        .from('organizations')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentError) throw recentError

      // Calculate MRR (Monthly Recurring Revenue)
      const { data: orgs, error: mrrError } = await supabase
        .from('organizations')
        .select('subscription_plan')
        .eq('status', 'active')

      if (mrrError) throw mrrError

      const mrr = (orgs || []).reduce((acc, org) => {
        const plan = org.subscription_plan || 'free'
        const planValue = plan === 'pro' ? 197 : plan === 'enterprise' ? 497 : 0
        return acc + planValue
      }, 0)

      return {
        totalOrganizations: totalOrganizations || 0,
        activeOrganizations: activeOrganizations || 0,
        totalUsers: totalUsers || 0,
        totalSuppliers: totalSuppliers || 0,
        pendingSuppliers: pendingSuppliers || 0,
        mrr,
        recentOrganizations: recentOrgs || [],
      }
    },
  })
}
