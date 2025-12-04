import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  FileText, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  ArrowRight,
  Send,
  Percent,
  Target,
  Wallet,
  AlertTriangle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getStatusConfig, getStatusLabel } from '@/lib/statusOrcamento';
import { GraficoFaturamentoMensal } from './charts/GraficoFaturamentoMensal';
import { GraficoCustos } from './charts/GraficoCustos';
import { FunilVendas } from './charts/FunilVendas';
import { RankingProdutos } from './charts/RankingProdutos';
import { toast } from 'sonner';

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
  enviados: number;
  semResposta: number;
  pagos: number;
  ticketMedio: number;
  taxaConversao: number;
  aReceber: number;
  margemMedia: number;
}

interface DadoMensal {
  mes: string;
  faturamento: number;
  custoTotal: number;
}

interface DadoCusto {
  nome: string;
  valor: number;
  cor: string;
}

interface EtapaFunil {
  status: string;
  label: string;
  quantidade: number;
  valor: number;
  cor: string;
}

interface ProdutoRanking {
  tipo: string;
  quantidade: number;
  faturamento: number;
}

interface Comparativo {
  valorAtual: number;
  valorAnterior: number;
  percentual: number;
}

export function DashboardContent({ onNovoOrcamento, onMeusOrcamentos, onVisualizarOrcamento }: DashboardContentProps) {
  const [recentOrcamentos, setRecentOrcamentos] = useState<RecentOrcamento[]>([]);
  const [stats, setStats] = useState<Stats>({ 
    totalOrcamentos: 0, 
    valorTotal: 0, 
    pendentes: 0, 
    enviados: 0, 
    semResposta: 0,
    pagos: 0,
    ticketMedio: 0,
    taxaConversao: 0,
    aReceber: 0,
    margemMedia: 0
  });
  const [loading, setLoading] = useState(true);
  const [dadosMensais, setDadosMensais] = useState<DadoMensal[]>([]);
  const [dadosCustos, setDadosCustos] = useState<DadoCusto[]>([]);
  const [etapasFunil, setEtapasFunil] = useState<EtapaFunil[]>([]);
  const [rankingProdutos, setRankingProdutos] = useState<ProdutoRanking[]>([]);
  const [comparativoFaturamento, setComparativoFaturamento] = useState<Comparativo>({ valorAtual: 0, valorAnterior: 0, percentual: 0 });

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

      // Load all budgets for stats
      const { data: allData, error: allError } = await supabase
        .from('orcamentos')
        .select('total_geral, custo_total, status, margem_percent, created_at, subtotal_materiais, subtotal_mao_obra_costura, subtotal_instalacao');

      if (allError) throw allError;

      // Basic stats
      const totalOrcamentos = allData?.length || 0;
      const valorTotal = allData?.reduce((sum, orc) => sum + (orc.total_geral || 0), 0) || 0;
      const pendentes = allData?.filter(orc => orc.status === 'rascunho' || orc.status === 'finalizado').length || 0;
      const enviados = allData?.filter(orc => orc.status === 'enviado').length || 0;
      const semResposta = allData?.filter(orc => orc.status === 'sem_resposta').length || 0;
      const pagos = allData?.filter(orc => orc.status === 'pago' || orc.status === 'pago_parcial').length || 0;

      // Advanced stats
      const ticketMedio = totalOrcamentos > 0 ? valorTotal / totalOrcamentos : 0;
      const enviadosTotal = allData?.filter(orc => ['enviado', 'sem_resposta', 'recusado', 'pago', 'pago_parcial'].includes(orc.status)).length || 0;
      const convertidos = allData?.filter(orc => ['pago', 'pago_parcial'].includes(orc.status)).length || 0;
      const taxaConversao = enviadosTotal > 0 ? (convertidos / enviadosTotal) * 100 : 0;
      const aReceber = allData?.filter(orc => orc.status === 'pago_parcial')
        .reduce((sum, orc) => sum + (orc.total_geral || 0), 0) || 0;
      const margemMedia = allData?.length ? 
        allData.reduce((sum, orc) => sum + (orc.margem_percent || 0), 0) / allData.length : 0;

      setStats({ totalOrcamentos, valorTotal, pendentes, enviados, semResposta, pagos, ticketMedio, taxaConversao, aReceber, margemMedia });

      // Notificação de orçamentos sem resposta
      if (semResposta > 0) {
        toast.warning(`${semResposta} orçamento(s) sem resposta`, {
          description: 'Clique em "Meus Orçamentos" para visualizar',
          duration: 5000,
        });
      }

      // Monthly data for chart (last 6 months)
      const mesesData: DadoMensal[] = [];
      for (let i = 5; i >= 0; i--) {
        const mesDate = subMonths(new Date(), i);
        const inicio = startOfMonth(mesDate);
        const fim = endOfMonth(mesDate);
        
        const orcamentosMes = allData?.filter(orc => {
          const dataOrc = new Date(orc.created_at);
          return dataOrc >= inicio && dataOrc <= fim;
        }) || [];

        mesesData.push({
          mes: format(mesDate, 'MMM', { locale: ptBR }),
          faturamento: orcamentosMes.reduce((sum, orc) => sum + (orc.total_geral || 0), 0),
          custoTotal: orcamentosMes.reduce((sum, orc) => sum + (orc.custo_total || 0), 0),
        });
      }
      setDadosMensais(mesesData);

      // Comparativo com mês anterior
      const mesAtual = mesesData[mesesData.length - 1]?.faturamento || 0;
      const mesAnterior = mesesData[mesesData.length - 2]?.faturamento || 0;
      const percentualVariacao = mesAnterior > 0 ? ((mesAtual - mesAnterior) / mesAnterior) * 100 : 0;
      setComparativoFaturamento({ valorAtual: mesAtual, valorAnterior: mesAnterior, percentual: percentualVariacao });

      // Cost breakdown
      const totalMateriais = allData?.reduce((sum, orc) => sum + (orc.subtotal_materiais || 0), 0) || 0;
      const totalMaoObra = allData?.reduce((sum, orc) => sum + (orc.subtotal_mao_obra_costura || 0), 0) || 0;
      const totalInstalacao = allData?.reduce((sum, orc) => sum + (orc.subtotal_instalacao || 0), 0) || 0;
      
      setDadosCustos([
        { nome: 'Materiais', valor: totalMateriais, cor: 'hsl(217 91% 60%)' },
        { nome: 'Mão de Obra', valor: totalMaoObra, cor: 'hsl(43 74% 52%)' },
        { nome: 'Instalação', valor: totalInstalacao, cor: 'hsl(142 70% 49%)' },
      ]);

      // Sales funnel
      const statusMap = [
        { status: 'rascunho', label: 'Rascunho', cor: 'hsl(0 0% 55%)' },
        { status: 'finalizado', label: 'Finalizado', cor: 'hsl(270 60% 55%)' },
        { status: 'enviado', label: 'Enviado', cor: 'hsl(45 93% 47%)' },
        { status: 'sem_resposta', label: 'Sem Resposta', cor: 'hsl(25 95% 53%)' },
        { status: 'pago_parcial', label: 'Pago 50%', cor: 'hsl(199 89% 48%)' },
        { status: 'pago', label: 'Pago', cor: 'hsl(142 70% 40%)' },
      ];

      const funilData = statusMap.map(s => ({
        ...s,
        quantidade: allData?.filter(orc => orc.status === s.status).length || 0,
        valor: allData?.filter(orc => orc.status === s.status).reduce((sum, orc) => sum + (orc.total_geral || 0), 0) || 0,
      }));
      setEtapasFunil(funilData);

      // Product ranking
      const { data: produtosData, error: produtosError } = await supabase
        .from('cortina_items')
        .select('tipo_cortina, quantidade, preco_venda');

      if (!produtosError && produtosData) {
        const agrupado: Record<string, { quantidade: number; faturamento: number }> = {};
        produtosData.forEach(item => {
          const tipo = item.tipo_cortina || 'outro';
          if (!agrupado[tipo]) {
            agrupado[tipo] = { quantidade: 0, faturamento: 0 };
          }
          agrupado[tipo].quantidade += item.quantidade || 1;
          agrupado[tipo].faturamento += item.preco_venda || 0;
        });

        const ranking = Object.entries(agrupado)
          .map(([tipo, dados]) => ({ tipo, ...dados }))
          .sort((a, b) => b.faturamento - a.faturamento);
        
        setRankingProdutos(ranking);
      }

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

  const statsCards = [
    { 
      title: 'Total Orçamentos', 
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
      bgColor: 'bg-green-100 dark:bg-green-950',
      comparativo: comparativoFaturamento.percentual
    },
    { 
      title: 'Ticket Médio', 
      value: formatCurrency(stats.ticketMedio), 
      icon: Target, 
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-950'
    },
    { 
      title: 'Taxa Conversão', 
      value: `${stats.taxaConversao.toFixed(1)}%`, 
      icon: Percent, 
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-950'
    },
    { 
      title: 'A Receber', 
      value: formatCurrency(stats.aReceber), 
      icon: Wallet, 
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-950'
    },
    { 
      title: 'Margem Média', 
      value: `${stats.margemMedia.toFixed(1)}%`, 
      icon: TrendingUp, 
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-950'
    },
  ];

  return (
    <div className="space-y-6">
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{stat.title}</p>
                  <p className="text-lg font-bold mt-1 truncate">{stat.value}</p>
                  {stat.comparativo !== undefined && stat.comparativo !== 0 && (
                    <div className={`flex items-center gap-1 text-xs mt-1 ${stat.comparativo > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.comparativo > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>{Math.abs(stat.comparativo).toFixed(0)}% vs mês ant.</span>
                    </div>
                  )}
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor} flex-shrink-0`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraficoFaturamentoMensal dados={dadosMensais} />
        <FunilVendas etapas={etapasFunil} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraficoCustos dados={dadosCustos} />
        <RankingProdutos produtos={rankingProdutos} />
      </div>

      {/* Recent Budgets */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
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
              {recentOrcamentos.map((orc) => {
                const statusConfig = getStatusConfig(orc.status);
                return (
                  <div
                    key={orc.id}
                    onClick={() => onVisualizarOrcamento(orc.id)}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-foreground">
                          {orc.codigo}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig.color}`}>
                          {getStatusLabel(orc.status)}
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
