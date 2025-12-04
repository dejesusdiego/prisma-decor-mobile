import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface DadoMensal {
  mes: string;
  faturamento: number;
  custoTotal: number;
}

interface GraficoFaturamentoMensalProps {
  dados: DadoMensal[];
}

export function GraficoFaturamentoMensal({ dados }: GraficoFaturamentoMensalProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: item.color }}>
              {item.name}: {formatCurrency(item.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          Faturamento Mensal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dados} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142 70% 49%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(142 70% 49%)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCusto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="mes" 
                tick={{ fontSize: 12 }} 
                className="text-muted-foreground"
                axisLine={false}
                tickLine={false}
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
              <Area 
                type="monotone" 
                dataKey="custoTotal" 
                name="Custo"
                stroke="hsl(0 84% 60%)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorCusto)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
