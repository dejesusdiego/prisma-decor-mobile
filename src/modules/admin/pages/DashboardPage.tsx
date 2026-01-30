import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@core/components/ui/Card'
import { Button } from '@core/components/ui/Button'
import { Badge } from '@core/components/ui/Badge'
import { usePlatformStats } from '@modules/admin/hooks/usePlatformStats'
import { 
  Building2, 
  Users, 
  Truck, 
  TrendingUp, 
  Clock,
  AlertCircle
} from 'lucide-react'

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: stats, isLoading } = usePlatformStats()

  const metrics = [
    {
      title: 'Organizações',
      value: stats?.totalOrganizations || 0,
      active: stats?.activeOrganizations || 0,
      icon: Building2,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Usuários',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Fornecedores',
      value: stats?.totalSuppliers || 0,
      pending: stats?.pendingSuppliers || 0,
      icon: Truck,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'MRR',
      value: `R$ ${(stats?.mrr || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral da plataforma StudioOS
          </p>
        </div>
        <Button onClick={() => navigate('/organizations')}>
          Gerenciar Organizações
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-muted rounded w-20"></div>
                <div className="h-4 bg-muted rounded w-32 mt-2"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          metrics.map((metric) => (
            <Card key={metric.title}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                    <metric.icon className={`w-6 h-6 ${metric.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.title}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                    {metric.active !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        {metric.active} ativas
                      </p>
                    )}
                    {metric.pending !== undefined && metric.pending > 0 && (
                      <Badge variant="outline" className="mt-1 bg-orange-100 text-orange-800 border-orange-200">
                        {metric.pending} pendentes
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Organizações Recentes
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/organizations')}>
              Ver todas
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            ) : stats?.recentOrganizations?.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma organização cadastrada
              </p>
            ) : (
              <div className="space-y-3">
                {stats?.recentOrganizations?.map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between p-3 hover:bg-muted rounded-lg cursor-pointer"
                    onClick={() => navigate(`/organizations?id=${org.id}`)}
                  >
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(org.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge>Novo</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Ações Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.pendingSuppliers ? (
                <div
                  className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg cursor-pointer"
                  onClick={() => navigate('/suppliers')}
                >
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="font-medium">Fornecedores Pendentes</p>
                      <p className="text-sm text-muted-foreground">
                        {stats.pendingSuppliers} aguardando aprovação
                      </p>
                    </div>
                  </div>
                  <Button size="sm">Revisar</Button>
                </div>
              ) : null}
              
              <div className="p-3 text-center text-muted-foreground">
                Nenhuma outra ação pendente
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
