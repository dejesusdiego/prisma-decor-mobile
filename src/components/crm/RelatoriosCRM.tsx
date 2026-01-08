import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  Target,
  XCircle,
  Trophy
} from 'lucide-react';
import { useContatos } from '@/hooks/useCRMData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const ORIGENS_LABELS: Record<string, string> = {
  site: 'Site',
  indicacao: 'Indicação',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  outro: 'Outro',
  null: 'Não informada'
};

// Status de orçamentos que indicam "ganho" (venda fechada)
const STATUS_GANHO = ['pago_40', 'pago_parcial', 'pago_60', 'pago', 'em_producao', 'instalado', 'finalizado'];
// Status que indica "perda"
const STATUS_PERDIDO = ['recusado'];

export function RelatoriosCRM() {
  const { organizationId } = useOrganization();
  const { data: contatos, isLoading: loadingContatos } = useContatos();
  
  // Buscar orçamentos em vez de oportunidades legadas
  const { data: orcamentos, isLoading: loadingOrcamentos } = useQuery({
    queryKey: ['orcamentos-relatorio-crm', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orcamentos')
        .select(`
          id,
          codigo,
          status,
          total_geral,
          created_by_user_id,
          contato_id,
          observacoes,
          contato:contatos(origem)
        `)
        .eq('organization_id', organizationId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId
  });
  
  if (loadingOrcamentos || loadingContatos) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  // ========== CONVERSÃO POR ORIGEM (usando orçamentos) ==========
  const contatosPorOrigem = contatos?.reduce((acc, c) => {
    const origem = c.origem || 'null';
    acc[origem] = (acc[origem] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Orçamentos ganhos agrupados por origem do contato
  const orcamentosGanhosPorOrigem = orcamentos
    ?.filter(o => STATUS_GANHO.includes(o.status))
    .reduce((acc, o) => {
      const origem = (o.contato as any)?.origem || 'null';
      acc[origem] = (acc[origem] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

  const conversaoPorOrigem = Object.keys(contatosPorOrigem).map(origem => {
    const total = contatosPorOrigem[origem] || 0;
    const convertidos = orcamentosGanhosPorOrigem[origem] || 0;
    const taxa = total > 0 ? (convertidos / total) * 100 : 0;
    return {
      origem: ORIGENS_LABELS[origem] || origem,
      total,
      convertidos,
      taxa: Math.round(taxa * 10) / 10
    };
  }).sort((a, b) => b.taxa - a.taxa);

  // ========== MOTIVOS DE PERDA (orçamentos recusados) ==========
  const orcamentosPerdidos = orcamentos?.filter(o => STATUS_PERDIDO.includes(o.status)) || [];
  
  // Extrair motivo das observações (formato: "Motivo: xxx" ou usar "Não informado")
  const motivosPerdaContagem = orcamentosPerdidos.reduce((acc, o) => {
    let motivo = 'Não informado';
    if (o.observacoes) {
      const match = o.observacoes.match(/motivo[:\s]+([^,.\n]+)/i);
      if (match) {
        motivo = match[1].trim();
      } else if (o.observacoes.toLowerCase().includes('preço')) {
        motivo = 'Preço Alto';
      } else if (o.observacoes.toLowerCase().includes('concorr')) {
        motivo = 'Concorrência';
      } else if (o.observacoes.toLowerCase().includes('prazo')) {
        motivo = 'Prazo';
      } else if (o.observacoes.toLowerCase().includes('desist')) {
        motivo = 'Desistência';
      }
    }
    acc[motivo] = (acc[motivo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const motivosPerdaData = Object.entries(motivosPerdaContagem).map(([motivo, quantidade]) => ({
    motivo,
    quantidade,
    percentual: orcamentosPerdidos.length > 0 
      ? Math.round((quantidade / orcamentosPerdidos.length) * 100) 
      : 0
  })).sort((a, b) => b.quantidade - a.quantidade);

  const valorPerdido = orcamentosPerdidos.reduce((sum, o) => sum + (o.total_geral || 0), 0);

  // ========== RANKING VENDEDORES (usando orçamentos) ==========
  const vendedoresStats = orcamentos?.reduce((acc, o) => {
    const vendedor = o.created_by_user_id;
    if (!acc[vendedor]) {
      acc[vendedor] = { 
        total: 0, 
        ganhas: 0, 
        valor: 0,
        valorGanho: 0
      };
    }
    acc[vendedor].total += 1;
    acc[vendedor].valor += o.total_geral || 0;
    if (STATUS_GANHO.includes(o.status)) {
      acc[vendedor].ganhas += 1;
      acc[vendedor].valorGanho += o.total_geral || 0;
    }
    return acc;
  }, {} as Record<string, { total: number; ganhas: number; valor: number; valorGanho: number }>) || {};

  const rankingVendedores = Object.entries(vendedoresStats)
    .map(([userId, stats]) => ({
      userId,
      nome: `Vendedor ${userId.slice(0, 4)}...`,
      ...stats,
      taxaConversao: stats.total > 0 ? Math.round((stats.ganhas / stats.total) * 100) : 0
    }))
    .sort((a, b) => b.valorGanho - a.valorGanho);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Relatórios CRM</h2>
      </div>

      <Tabs defaultValue="conversao" className="space-y-4">
        <TabsList>
          <TabsTrigger value="conversao" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Conversão por Origem
          </TabsTrigger>
          <TabsTrigger value="perda" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Motivos de Perda
          </TabsTrigger>
          <TabsTrigger value="vendedores" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Ranking Vendedores
          </TabsTrigger>
        </TabsList>

        {/* CONVERSÃO POR ORIGEM */}
        <TabsContent value="conversao" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Contatos por Origem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={conversaoPorOrigem}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="origem" 
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="total" name="Total" fill="hsl(var(--muted-foreground))" />
                      <Bar dataKey="convertidos" name="Convertidos" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Taxa de Conversão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conversaoPorOrigem.map((item, index) => (
                    <div key={item.origem} className="flex items-center gap-4">
                      <div className="w-28 text-sm font-medium truncate">{item.origem}</div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${Math.min(item.taxa, 100)}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-20 text-right">
                        <Badge variant={item.taxa >= 50 ? 'default' : item.taxa >= 25 ? 'secondary' : 'outline'}>
                          {item.taxa}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {conversaoPorOrigem.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum dado disponível
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* MOTIVOS DE PERDA */}
        <TabsContent value="perda" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-500/10 rounded-lg">
                    <XCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{orcamentosPerdidos.length}</p>
                    <p className="text-sm text-muted-foreground">Orçamentos Recusados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 rounded-lg">
                    <TrendingDown className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(valorPerdido)}</p>
                    <p className="text-sm text-muted-foreground">Valor Total Perdido</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Target className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{motivosPerdaData[0]?.motivo || '-'}</p>
                    <p className="text-sm text-muted-foreground">Principal Motivo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Motivos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={motivosPerdaData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="quantidade"
                        nameKey="motivo"
                        label={({ motivo, percentual }) => `${motivo} (${percentual}%)`}
                        labelLine={false}
                      >
                        {motivosPerdaData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {motivosPerdaData.map((item, index) => (
                    <div key={item.motivo} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{item.motivo}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">{item.quantidade} orçamentos</span>
                        <Badge>{item.percentual}%</Badge>
                      </div>
                    </div>
                  ))}
                  {motivosPerdaData.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum orçamento recusado registrado
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* RANKING VENDEDORES */}
        <TabsContent value="vendedores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Ranking de Vendedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rankingVendedores.map((vendedor, index) => (
                  <div 
                    key={vendedor.userId}
                    className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      index === 0 ? 'bg-yellow-500 text-yellow-950' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-amber-600 text-amber-50' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{vendedor.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {vendedor.ganhas} vendas fechadas de {vendedor.total} orçamentos
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(vendedor.valorGanho)}
                      </p>
                      <Badge variant={vendedor.taxaConversao >= 50 ? 'default' : 'secondary'}>
                        {vendedor.taxaConversao}% conversão
                      </Badge>
                    </div>
                  </div>
                ))}
                {rankingVendedores.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum dado disponível
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
