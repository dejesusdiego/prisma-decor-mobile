import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { useProducaoData, STATUS_ITEM_LABELS } from '@/hooks/useProducaoData';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, TrendingUp } from 'lucide-react';

const ETAPAS_CORES: Record<string, string> = {
  fila: '#9CA3AF',      // gray
  corte: '#F97316',     // orange
  costura: '#3B82F6',   // blue
  acabamento: '#6366F1', // indigo
  qualidade: '#8B5CF6', // purple
  pronto: '#22C55E',    // green
};

const LIMITE_GARGALO = 10; // Se tiver mais de 10 itens, é gargalo

export function PainelCapacidadeEtapas() {
  const { pedidos, isLoading } = useProducaoData();

  // Contar itens por etapa
  const contagem: Record<string, number> = {
    fila: 0,
    corte: 0,
    costura: 0,
    acabamento: 0,
    qualidade: 0,
    pronto: 0,
  };

  pedidos
    .filter(p => !['entregue', 'cancelado'].includes(p.status_producao))
    .forEach(pedido => {
      pedido.itens_pedido?.forEach(item => {
        if (contagem[item.status_item] !== undefined) {
          contagem[item.status_item]++;
        }
      });
    });

  const dados = Object.entries(contagem).map(([etapa, quantidade]) => ({
    etapa,
    label: STATUS_ITEM_LABELS[etapa]?.label || etapa,
    quantidade,
    cor: ETAPAS_CORES[etapa] || '#6B7280',
    isGargalo: quantidade >= LIMITE_GARGALO,
  }));

  const gargalos = dados.filter(d => d.isGargalo);
  const totalItens = Object.values(contagem).reduce((a, b) => a + b, 0);

  if (isLoading) {
    return <Skeleton className="h-[300px]" />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Capacidade por Etapa
          <HelpTooltip content="Quantidade de itens em cada etapa da produção. Etapas com mais de 10 itens são destacadas como possíveis gargalos." />
        </CardTitle>
        <Badge variant="secondary">{totalItens} itens ativos</Badge>
      </CardHeader>
      <CardContent>
        {/* Alerta de Gargalos */}
        {gargalos.length > 0 && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <p className="text-sm text-orange-700 dark:text-orange-300">
              <strong>Possível gargalo:</strong> {gargalos.map(g => g.label).join(', ')} 
              {gargalos.length === 1 ? ' tem' : ' têm'} muitos itens acumulados
            </p>
          </div>
        )}

        {/* Gráfico de Barras */}
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={dados} 
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis 
                type="category" 
                dataKey="label" 
                width={75}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => [`${value} item(s)`, 'Quantidade']}
                labelFormatter={(label) => `Etapa: ${label}`}
              />
              <ReferenceLine 
                x={LIMITE_GARGALO} 
                stroke="#F97316" 
                strokeDasharray="5 5" 
                label={{ value: 'Limite', fill: '#F97316', fontSize: 10 }}
              />
              <Bar dataKey="quantidade" radius={[0, 4, 4, 0]}>
                {dados.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isGargalo ? '#EF4444' : entry.cor}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4">
          {dados.map(d => (
            <div 
              key={d.etapa}
              className={`p-2 rounded-lg text-center ${
                d.isGargalo 
                  ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800' 
                  : 'bg-muted/50'
              }`}
            >
              <div 
                className="w-3 h-3 rounded-full mx-auto mb-1" 
                style={{ backgroundColor: d.cor }}
              />
              <p className={`text-lg font-bold ${d.isGargalo ? 'text-red-600' : ''}`}>
                {d.quantidade}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{d.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}