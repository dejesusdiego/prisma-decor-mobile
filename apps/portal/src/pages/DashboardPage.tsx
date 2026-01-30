import { Package, ShoppingCart, Eye, TrendingUp } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSupplierStats } from '@/hooks/useSupplierStats'

export function DashboardPage() {
  const { supplier } = useAuth()
  const { data: stats, isLoading } = useSupplierStats(supplier?.id)

  const metrics = [
    {
      title: 'Produtos',
      value: stats?.totalProducts ?? 0,
      subtext: 'No catálogo',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pedidos Pendentes',
      value: stats?.pendingOrders ?? 0,
      subtext: 'Aguardando',
      icon: ShoppingCart,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      highlight: stats?.pendingOrders ? true : false,
    },
    {
      title: 'Visualizações',
      value: stats?.viewsToday ?? 0,
      subtext: 'Hoje',
      icon: Eye,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo, {supplier?.name || 'Fornecedor'}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
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
      <div className="bg-blue-50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold">Dica</h2>
        </div>
        <p className="text-gray-600">
          Mantenha seus produtos atualizados para aparecer nas buscas dos orçamentos.
          Produtos com preços e descrições completos têm mais chances de serem selecionados.
        </p>
        <div className="mt-4 flex gap-4">
          <a
            href="/catalogo"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            Gerenciar Catálogo
          </a>
          <a
            href="/pedidos"
            className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted"
          >
            Ver Pedidos
          </a>
        </div>
      </div>
    </div>
  )
}
