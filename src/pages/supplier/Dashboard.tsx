import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, CheckCircle2, XCircle, Info } from 'lucide-react';
import { useSupplierMaterials, useSupplierMaterialsStats } from '@/hooks/useSupplierMaterials';
// Temporariamente removido recharts para debug
// // Recharts temporariamente removido para debug
// import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

interface DashboardProps {
  supplierId: string;
  supplierStatus: 'pending' | 'approved' | 'rejected';
}

// const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function SupplierDashboard({ supplierId, supplierStatus }: DashboardProps) {
  const { data: materials = [], isLoading: isLoadingMaterials } = useSupplierMaterials(supplierId);
  const { data: stats, isLoading: isLoadingStats } = useSupplierMaterialsStats(supplierId);

  const isLoading = isLoadingMaterials || isLoadingStats;

  // Preparar dados para gráfico
  const chartData = stats
    ? Object.entries(stats.byCategory).map(([name, value]) => ({ name, value }))
    : [];

  const isApproved = supplierStatus === 'approved';
  const hasFewMaterials = (stats?.total || 0) < 10;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Materiais</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Materiais cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Materiais Ativos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.active || 0}</div>
            <p className="text-xs text-muted-foreground">Disponíveis para clientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Materiais Inativos</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.inactive || 0}</div>
            <p className="text-xs text-muted-foreground">Temporariamente ocultos</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico - Versão simplificada sem recharts */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Materiais por Categoria</CardTitle>
            <CardDescription>Distribuição dos seus materiais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded bg-muted">
                  <span className="text-sm font-medium">{item.name}</span>
                  <Badge variant="secondary">{item.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de Valor Percebido */}
      {isApproved && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Catálogo Pronto para Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Seu catálogo está aprovado e pode ser acessado por empresas que utilizam o StudioOS.
              Quanto mais completo seu catálogo, maior a chance de vendas.
            </p>
            <div className="mt-4">
              <Badge variant="outline" className="bg-white dark:bg-gray-900">
                Catálogo Profissional
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {hasFewMaterials && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-amber-600" />
              Complete seu Catálogo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Você tem poucos materiais cadastrados. Adicione mais produtos para aumentar sua visibilidade
              e atrair mais clientes.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {materials.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum Material Cadastrado</CardTitle>
            <CardDescription>
              Comece adicionando seus primeiros materiais ao catálogo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Use a aba "Catálogo" para adicionar materiais manualmente ou importar via CSV.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
