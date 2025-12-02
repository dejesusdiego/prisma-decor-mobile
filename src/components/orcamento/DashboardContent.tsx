import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  FileText, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardContentProps {
  onNovoOrcamento: () => void;
  onMeusOrcamentos: () => void;
  onVisualizarOrcamento: (id: string) => void;
}

interface RecentOrcamento {
  id: string;
  codigo: string;
  cliente_nome: string;
  total_geral: number;
  created_at: string;
  status: string;
}

interface Stats {
  totalOrcamentos: number;
  valorTotal: number;
  pendentes: number;
  finalizados: number;
}

export function DashboardContent({ onNovoOrcamento, onMeusOrcamentos, onVisualizarOrcamento }: DashboardContentProps) {
  const [recentOrcamentos, setRecentOrcamentos] = useState<RecentOrcamento[]>([]);
  const [stats, setStats] = useState<Stats>({ totalOrcamentos: 0, valorTotal: 0, pendentes: 0, finalizados: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load recent budgets
      const { data: recentData, error: recentError } = await supabase
        .from('orcamentos')
        .select('id, codigo, cliente_nome, total_geral, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;
      setRecentOrcamentos(recentData || []);

      // Load stats
      const { data: allData, error: allError } = await supabase
        .from('orcamentos')
        .select('total_geral, status');

      if (allError) throw allError;

      const totalOrcamentos = allData?.length || 0;
      const valorTotal = allData?.reduce((sum, orc) => sum + (orc.total_geral || 0), 0) || 0;
      const pendentes = allData?.filter(orc => orc.status === 'pendente' || orc.status === 'rascunho').length || 0;
      const finalizados = allData?.filter(orc => orc.status === 'finalizado' || orc.status === 'aprovado').length || 0;

      setStats({ totalOrcamentos, valorTotal, pendentes, finalizados });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado':
        return 'text-green-600 bg-green-100 dark:bg-green-950 dark:text-green-400';
      case 'pendente':
      case 'rascunho':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-400';
      case 'rejeitado':
        return 'text-red-600 bg-red-100 dark:bg-red-950 dark:text-red-400';
      case 'finalizado':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-950 dark:text-blue-400';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const statsCards = [
    { 
      title: 'Total de Orçamentos', 
      value: stats.totalOrcamentos, 
      icon: FileText, 
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    { 
      title: 'Valor Total', 
      value: formatCurrency(stats.valorTotal), 
      icon: DollarSign, 
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-950'
    },
    { 
      title: 'Pendentes', 
      value: stats.pendentes, 
      icon: Clock, 
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-950'
    },
    { 
      title: 'Finalizados', 
      value: stats.finalizados, 
      icon: CheckCircle, 
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-950'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header with CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral do sistema de orçamentos</p>
        </div>
        <Button 
          size="lg" 
          onClick={onNovoOrcamento}
          className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="mr-2 h-5 w-5" />
          Novo Orçamento
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Budgets */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Orçamentos Recentes
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onMeusOrcamentos} className="text-primary">
              Ver todos
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : recentOrcamentos.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum orçamento criado ainda</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={onNovoOrcamento}
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar primeiro orçamento
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrcamentos.map((orc) => (
                <div
                  key={orc.id}
                  onClick={() => onVisualizarOrcamento(orc.id)}
                  className="flex items-center justify-between p-4 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 cursor-pointer transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-foreground">
                        {orc.codigo}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(orc.status)}`}>
                        {orc.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {orc.cliente_nome}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(orc.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(orc.total_geral || 0)}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
