import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface ProdutoRanking {
  tipo: string;
  quantidade: number;
  faturamento: number;
}

interface RankingProdutosProps {
  produtos: ProdutoRanking[];
}

export function RankingProdutos({ produtos }: RankingProdutosProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      wave: 'Cortina Wave',
      prega: 'Cortina Prega',
      painel: 'Cortina Painel',
      rolo: 'Persiana Rolo',
      horizontal: 'Persiana Horizontal',
      vertical: 'Persiana Vertical',
      romana: 'Persiana Romana',
      celular: 'Persiana Celular',
      madeira: 'Persiana Madeira',
      outro: 'Outros',
    };
    return labels[tipo] || tipo;
  };

  const getMedalColor = (index: number) => {
    const colors = [
      'bg-amber-500', // Ouro
      'bg-slate-400', // Prata
      'bg-amber-700', // Bronze
    ];
    return colors[index] || 'bg-muted-foreground/30';
  };

  const topProdutos = produtos.slice(0, 5);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-muted-foreground" />
          Produtos Mais Vendidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topProdutos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Sem dados de produtos ainda
          </div>
        ) : (
          <div className="space-y-3">
            {topProdutos.map((produto, index) => (
              <div 
                key={produto.tipo}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className={`w-7 h-7 rounded-full ${getMedalColor(index)} flex items-center justify-center`}>
                  <span className="text-xs font-bold text-white">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {getTipoLabel(produto.tipo)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {produto.quantidade} {produto.quantidade === 1 ? 'unidade' : 'unidades'}
                  </p>
                </div>
                <span className="font-semibold text-foreground">
                  {formatCurrency(produto.faturamento)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
