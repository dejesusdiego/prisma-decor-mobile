import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { MapPin } from 'lucide-react';

interface CidadeData {
  cidade: string;
  quantidade: number;
  valor: number;
}

interface DistribuicaoCidadesProps {
  dados: CidadeData[];
}

const CORES = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function DistribuicaoCidades({ dados }: DistribuicaoCidadesProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.cidade}</p>
          <p className="text-sm text-muted-foreground">{data.quantidade} orçamentos</p>
          <p className="text-sm font-medium">{formatCurrency(data.valor)}</p>
        </div>
      );
    }
    return null;
  };

  // Filtrar apenas cidades válidas e formatar
  const dadosValidos = dados.filter(d => d.cidade && d.cidade !== 'Não informada' && d.cidade !== 'Não inform...');
  const dadosFormatados = dadosValidos.map(d => ({
    ...d,
    cidadeAbrev: d.cidade.length > 12 ? d.cidade.substring(0, 10) + '...' : d.cidade,
  }));

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          Distribuição por Cidade
        </CardTitle>
      </CardHeader>
      <CardContent>
        {dados.length === 0 || dados.every(d => !d.cidade || d.cidade === 'Não informada' || d.cidade === 'Não inform...') ? (
          <div className="h-[250px] flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sem dados de cidades ainda</p>
              <p className="text-xs mt-1">As cidades aparecerão aqui quando os orçamentos tiverem cidade informada</p>
            </div>
          </div>
        ) : (
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dadosFormatados.length > 0 ? dadosFormatados : []}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <XAxis 
                  type="number" 
                  hide 
                  domain={[0, 'dataMax']}
                />
                <YAxis 
                  type="category" 
                  dataKey="cidadeAbrev"
                  width={90}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                <Bar 
                  dataKey="valor" 
                  radius={[0, 4, 4, 0]}
                  maxBarSize={32}
                >
                  {dadosFormatados.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
