import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Eye } from 'lucide-react'
import { supabase } from '@core/lib/supabase'
import { formatCurrency } from '@core/lib/utils'

interface Organization {
  id: string
  name: string
  slug: string
  status: 'trial' | 'active' | 'suspended' | 'cancelled'
  plan_id: string
  plan_name: string
  plan_price: number
  created_at: string
  users_count: number
}

export function OrganizationsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: organizations, isLoading } = useQuery<Organization[]>({
    queryKey: ['organizations', search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('organizations')
        .select(`
          id,
          name,
          slug,
          status,
          plan_id,
          plans(name, price),
          created_at,
          profiles(count)
        `)
        .order('created_at', { ascending: false })

      if (search) {
        query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`)
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error

      return (data || []).map((org: any) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        status: org.status,
        plan_id: org.plan_id,
        plan_name: org.plans?.name || '-',
        plan_price: org.plans?.price || 0,
        created_at: org.created_at,
        users_count: org.profiles?.[0]?.count || 0,
      }))
    },
  })

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      trial: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    }
    const labels: Record<string, string> = {
      trial: 'Trial',
      active: 'Ativa',
      suspended: 'Suspensa',
      cancelled: 'Cancelada',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.cancelled}`}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organizações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todas as organizações da plataforma
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome ou slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todos os status</option>
          <option value="trial">Trial</option>
          <option value="active">Ativa</option>
          <option value="suspended">Suspensa</option>
          <option value="cancelled">Cancelada</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Organização</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Plano</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Usuários</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Criada em</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="animate-pulse flex gap-4">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-4 w-20 bg-muted rounded" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : organizations?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhuma organização encontrada
                  </td>
                </tr>
              ) : (
                organizations?.map((org) => (
                  <tr key={org.id} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-sm text-muted-foreground">{org.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm">{org.plan_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(org.plan_price)}/mês
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(org.status)}</td>
                    <td className="px-4 py-3 text-sm">{org.users_count}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(org.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-2 hover:bg-muted rounded-md">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
