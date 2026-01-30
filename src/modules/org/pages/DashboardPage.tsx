import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@core/components/ui/Card'
import { Button } from '@core/components/ui/Button'
import { Badge } from '@core/components/ui/Badge'
import { useDashboardStats } from '@modules/org/hooks/useDashboardStats'
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Loader2,
  ArrowRight
} from 'lucide-react'

const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  enviado: 'Pendente',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
}

const statusColors: Record<string, string> = {
  rascunho: 'bg-gray-500',
  enviado: 'bg-yellow-500',
  aprovado: 'bg-green-500',
  rejeitado: 'bg-red-500',
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: stats, isLoading } = useDashboardStats()

  const metrics = [
    {
      title: 'Total Orçamentos',
      value: stats?.totalOrcamentos || 0,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Pendentes',
      value: stats?.orcamentosPendentes || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Aprovados',
      value: stats?.orcamentosAprovados || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Valor Total',
      value: (stats?.totalValor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do seu negócio
          </p>
        </div>
        <Button onClick={() => navigate('/orcamentos/novo')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-3/4 mt-2"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          metrics.map((metric) => (
            <Card key={metric.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </p>
                    <p className="text-2xl font-bold mt-1">{metric.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${metric.bgColor}`}>
                    <metric.icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orçamentos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Orçamentos Recentes</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/orcamentos')}>
              Ver todos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : stats?.recentOrcamentos?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Nenhum orçamento encontrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats?.recentOrcamentos?.map((orc) => (
                  <div
                    key={orc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate('/orcamentos')}
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{orc.cliente_nome || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {orc.codigo}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge className={statusColors[orc.status] || 'bg-gray-500'}>
                        {statusLabels[orc.status] || orc.status}
                      </Badge>
                      <p className="text-sm font-medium">
                        {(orc.total_com_desconto || 0).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Button 
                variant="outline" 
                className="justify-start h-auto py-4"
                onClick={() => navigate('/orcamentos/novo')}
              >
                <div className="p-2 bg-blue-100 rounded-lg mr-4">
                  <Plus className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Criar Orçamento</p>
                  <p className="text-sm text-muted-foreground">
                    Iniciar novo orçamento para cliente
                  </p>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="justify-start h-auto py-4"
                onClick={() => navigate('/orcamentos')}
              >
                <div className="p-2 bg-green-100 rounded-lg mr-4">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Ver Orçamentos</p>
                  <p className="text-sm text-muted-foreground">
                    Listar todos os orçamentos
                  </p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
