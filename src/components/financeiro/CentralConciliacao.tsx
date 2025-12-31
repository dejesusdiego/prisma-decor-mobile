import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  Users,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { ConciliacaoBancaria } from './ConciliacaoBancaria';
import { TabOrfaos } from './conciliacao/TabOrfaos';
import { RelatorioConciliacaoConsolidado } from './RelatorioConciliacaoConsolidado';
import { RelatorioConciliacaoClientes } from './RelatorioConciliacaoClientes';
import { BreadcrumbsFinanceiro } from './BreadcrumbsFinanceiro';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CentralConciliacaoProps {
  onNavigate?: (view: string) => void;
  onNavigateOrcamento?: (id: string) => void;
}

export function CentralConciliacao({ onNavigate, onNavigateOrcamento }: CentralConciliacaoProps) {
  const [activeTab, setActiveTab] = useState('importar');

  // Buscar estatísticas gerais
  const { data: stats } = useQuery({
    queryKey: ['central-conciliacao-stats'],
    queryFn: async () => {
      // Movimentações pendentes
      const { count: movPendentes } = await supabase
        .from('movimentacoes_extrato')
        .select('*', { count: 'exact', head: true })
        .eq('conciliado', false)
        .eq('ignorado', false);

      // Lançamentos órfãos (sem vínculo com orçamento)
      const { count: orfaos } = await supabase
        .from('lancamentos_financeiros')
        .select('*', { count: 'exact', head: true })
        .is('parcela_receber_id', null)
        .is('conta_pagar_id', null)
        .eq('tipo', 'entrada');

      // Parcelas pendentes
      const { count: parcelasPendentes } = await supabase
        .from('parcelas_receber')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente');

      return {
        movPendentes: movPendentes || 0,
        orfaos: orfaos || 0,
        parcelasPendentes: parcelasPendentes || 0
      };
    }
  });

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <BreadcrumbsFinanceiro 
        currentView="finConciliacao" 
        onNavigate={onNavigate}
      />

      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Central de Conciliação</h1>
          <p className="text-muted-foreground">
            Importe extratos, concilie movimentações e acompanhe recebimentos
          </p>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('importar')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimentações Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.movPendentes || 0}</div>
            <p className="text-xs text-muted-foreground">
              Para conciliar
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('orfaos')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lançamentos Órfãos</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.orfaos || 0}</div>
            <p className="text-xs text-muted-foreground">
              Sem vínculo com orçamento
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('consolidado')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parcelas Pendentes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.parcelasPendentes || 0}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('clientes')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Cliente</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">→</div>
            <p className="text-xs text-muted-foreground">
              Ver detalhamento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Abas principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="importar" className="gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Importar & Conciliar</span>
            <span className="sm:hidden">Importar</span>
            {stats?.movPendentes && stats.movPendentes > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.movPendentes}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="orfaos" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Órfãos</span>
            <span className="sm:hidden">Órfãos</span>
            {stats?.orfaos && stats.orfaos > 0 && (
              <Badge variant="destructive" className="ml-1">
                {stats.orfaos}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="consolidado" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Por Orçamento</span>
            <span className="sm:hidden">Orçamento</span>
          </TabsTrigger>
          <TabsTrigger value="clientes" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Por Cliente</span>
            <span className="sm:hidden">Cliente</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="importar" className="space-y-4">
          <ConciliacaoBancaria />
        </TabsContent>

        <TabsContent value="orfaos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lançamentos Órfãos</CardTitle>
              <CardDescription>
                Lançamentos de entrada sem vínculo com orçamento ou parcela
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TabOrfaos />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consolidado" className="space-y-4">
          <RelatorioConciliacaoConsolidado onNavigateOrcamento={onNavigateOrcamento} />
        </TabsContent>

        <TabsContent value="clientes" className="space-y-4">
          <RelatorioConciliacaoClientes />
        </TabsContent>
      </Tabs>
    </div>
  );
}
