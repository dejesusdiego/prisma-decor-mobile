import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import type { FluxoCaixaDia } from '@/hooks/useFinanceiroData';

interface GraficoFluxoCaixaProps {
  data: FluxoCaixaDia[];
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function GraficoFluxoCaixa({ data, isLoading }: GraficoFluxoCaixaProps) {
  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Nenhum lançamento no período selecionado
      </div>
    );
  }

  // Filtrar apenas dias com movimento para gráficos com muitos dias
  const dataFiltered = data.length > 31 
    ? data.filter(d => d.entradas > 0 || d.saidas > 0)
    : data;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={dataFiltered} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis 
          dataKey="dataFormatada" 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="fill-muted-foreground"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => formatCurrency(value)}
          tickLine={false}
          axisLine={false}
          className="fill-muted-foreground"
          width={80}
        />
        <Tooltip 
          formatter={(value: number, name: string) => [
            formatCurrency(value),
            name === 'entradas' ? 'Entradas' : name === 'saidas' ? 'Saídas' : 'Saldo Acumulado'
          ]}
          labelFormatter={(label) => `Data: ${label}`}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
        />
        <Legend 
          formatter={(value) => 
            value === 'entradas' ? 'Entradas' : 
            value === 'saidas' ? 'Saídas' : 'Saldo Acumulado'
          }
        />
        <Bar 
          dataKey="entradas" 
          fill="hsl(142 76% 36%)" 
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
        <Bar 
          dataKey="saidas" 
          fill="hsl(0 84% 60%)" 
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
        <Line 
          type="monotone" 
          dataKey="saldo" 
          stroke="hsl(221 83% 53%)" 
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
