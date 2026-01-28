import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Users,
  CreditCard
} from 'lucide-react';
import { MRRChart } from './MRRChart';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PlatformMetrics {
  mrr: number;
  arr: number;
  total_tenants: number;
  active_tenants: number;
  churn_rate: number;
  avg_ltv: number;
  new_this_month: number;
  canceled_this_month: number;
  growth_rate: number;
}

export function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await (supabase as any)
        .rpc('get_platform_metrics');

      if (error) throw error;

      if (data && data.length > 0) {
        setMetrics(data[0]);
      }
    } catch (err: any) {
      console.error('Error loading metrics:', err);
      toast.error('Erro ao carregar métricas da plataforma');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Dashboard da Plataforma</h2>
          <p className="text-muted-foreground">
            Visão geral do MRR, ARR e métricas da plataforma
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <MRRChart />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard da Plataforma</h2>
        <p className="text-muted-foreground">
          Visão geral do MRR, ARR e métricas da plataforma
        </p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_tenants || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics?.new_this_month || 0} este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics?.mrr)}</div>
            <div className={`flex items-center text-xs ${(metrics?.growth_rate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(metrics?.growth_rate || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {(metrics?.growth_rate || 0).toFixed(1)}% vs mês anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics?.arr)}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              Projeção anual
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics?.churn_rate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.canceled_this_month || 0} cancelamentos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de MRR */}
      <MRRChart />

      {/* Últimas Assinaturas */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Assinaturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Organização {i}</p>
                    <p className="text-sm text-muted-foreground">Plano Pro</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">Ativa</Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(299 * i)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}