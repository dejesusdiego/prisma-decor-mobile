import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { TrendingUp, Calendar, CalendarDays } from 'lucide-react';

interface DadoPeriodo {
  periodo: string;
  faturamento: number;
  quantidade: number;
}

interface GraficoFaturamentoMensalProps {
  dadosDiarios: DadoPeriodo[];
  dadosMensais: DadoPeriodo[];
}

// Calcula média móvel de N períodos
function calcularMediaMovel(dados: DadoPeriodo[], periodos: number = 3): (number | null)[] {
  return dados.map((_, index) => {
    if (index < periodos - 1) return null;
    const soma = dados
      .slice(index - periodos + 1, index + 1)
      .reduce((acc, d) => acc + d.faturamento, 0);
    return soma / periodos;
  });
}

export function GraficoFaturamentoMensal({ dadosDiarios, dadosMensais }: GraficoFaturamentoMensalProps) {
  const [visualizacao, setVisualizacao] = useState<'diario' | 'mensal'>('diario');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Dados com média móvel
  const dadosComMediaMovel = useMemo(() => {
    const dadosBase = visualizacao === 'diario' ? dadosDiarios : dadosMensais;
    const periodosMM = visualizacao === 'diario' ? 3 : 2;
    const mediaMovel = calcularMediaMovel(dadosBase, periodosMM);
    
    return dadosBase.map((d, i) => ({
      ...d,
      mediaMovel: mediaMovel[i],
    }));
  }, [dadosDiarios, dadosMensais, visualizacao]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dadoAtual = payload[0]?.payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          <p className="text-sm text-emerald-500">
            Faturamento: {formatCurrency(dadoAtual?.faturamento || 0)}
          </p>
          <p className="text-sm text-muted-foreground">
            Orçamentos: {dadoAtual?.quantidade || 0}
          </p>
          {dadoAtual?.mediaMovel && (
            <p className="text-sm text-amber-500">
              Média móvel: {formatCurrency(dadoAtual.mediaMovel)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            {visualizacao === 'diario' ? 'Faturamento Diário' : 'Faturamento Mensal'}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant={visualizacao === 'diario' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVisualizacao('diario')}
              className="h-7 px-2"
            >
              <CalendarDays className="h-3.5 w-3.5 mr-1" />
              Dia
            </Button>
            <Button
              variant={visualizacao === 'mensal' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVisualizacao('mensal')}
              className="h-7 px-2"
            >
              <Calendar className="h-3.5 w-3.5 mr-1" />
              Mês
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dadosComMediaMovel} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142 70% 49%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(142 70% 49%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="periodo" 
                tick={{ fontSize: 11 }} 
                className="text-muted-foreground"
                axisLine={false}
                tickLine={false}
                interval={visualizacao === 'diario' ? 'preserveStartEnd' : 0}
              />
              <YAxis 
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="faturamento" 
                name="Faturamento"
                stroke="hsl(142 70% 49%)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorFaturamento)" 
              />
              <Line
                type="monotone"
                dataKey="mediaMovel"
                name="Média Móvel"
                stroke="hsl(43 74% 52%)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span>Faturamento</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-amber-500" style={{ borderStyle: 'dashed' }} />
            <span>Média Móvel ({visualizacao === 'diario' ? '3 dias' : '2 meses'})</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
