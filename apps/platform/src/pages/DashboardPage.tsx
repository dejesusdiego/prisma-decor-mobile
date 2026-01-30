import { Building2, Users, Truck, DollarSign, TrendingUp } from 'lucide-react'
import { usePlatformStats } from '@/hooks/usePlatformStats'
import { formatCurrency } from '@/lib/utils'

export function DashboardPage() {
  const { data: stats, isLoading } = usePlatformStats()

  const metrics = [
    {
      title: 'Organizações',
      value: stats?.totalOrganizations ?? 0,
      subtext: `${stats?.activeOrganizations ?? 0} ativas`,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'MRR',
      value: formatCurrency(stats?.mrr ?? 0),
      subtext: 'Receita mensal recorrente',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Usuários',
      value: stats?.totalUsers ?? 0,
      subtext: 'Total de usuários',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Pendentes',
      value: stats?.pendingSuppliers ?? 0,
      subtext: 'Fornecedores para aprovar',
      icon: Truck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      highlight: stats?.pendingSuppliers ? true : false,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral da plataforma Studio OS
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg border p-6 animate-pulse">
              <div className="h-10 w-10 rounded-lg bg-muted mb-4" />
              <div className="h-6 w-24 bg-muted rounded mb-2" />
              <div className="h-4 w-16 bg-muted rounded" />
            </div>
          ))
        ) : (
          metrics.map((metric) => {
            const Icon = metric.icon
            return (
              <div
                key={metric.title}
                className={`bg-card rounded-lg border p-6 ${
                  metric.highlight ? 'ring-2 ring-orange-200' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`h-6 w-6 ${metric.color}`} />
                  </div>
                  {metric.highlight && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold mt-1">{metric.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metric.subtext}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Crescimento</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Acompanhe o crescimento da plataforma e métricas de conversão.
          </p>
          <div className="mt-4 flex gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Taxa de ativação</p>
              <p className="font-semibold">
                {stats && stats.totalOrganizations > 0
                  ? Math.round((stats.activeOrganizations / stats.totalOrganizations) * 100)
                  : 0}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Ticket médio</p>
              <p className="font-semibold">
                {stats && stats.activeOrganizations > 0
                  ? formatCurrency(stats.mrr / stats.activeOrganizations)
                  : formatCurrency(0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Truck className="h-5 w-5 text-orange-500" />
            <h2 className="font-semibold">Ações Pendentes</h2>
          </div>
          {stats?.pendingSuppliers ? (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Você tem {stats.pendingSuppliers} fornecedor{stats.pendingSuppliers > 1 ? 'es' : ''} aguardando aprovação
                </p>
              </div>
              <a
                href="/suppliers"
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90"
              >
                Revisar
              </a>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma ação pendente no momento.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
