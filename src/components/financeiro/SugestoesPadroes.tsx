import { Lightbulb, Brain, X, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { usePadroesConciliacao, SugestaoPadrao } from '@/hooks/usePadroesConciliacao';
import { cn } from '@/lib/utils';

interface SugestoesPadroesProps {
  descricaoExtrato: string;
  tipoMovimento: 'credito' | 'debito';
  onSelecionarCategoria?: (categoriaId: string, tipoLancamento: string) => void;
  className?: string;
}

export function SugestoesPadroes({
  descricaoExtrato,
  tipoMovimento,
  onSelecionarCategoria,
  className
}: SugestoesPadroesProps) {
  const { buscarSugestoesPorPadrao, desativarPadrao, isLoading } = usePadroesConciliacao();

  if (isLoading || !descricaoExtrato) return null;

  const sugestoes = buscarSugestoesPorPadrao(descricaoExtrato, tipoMovimento);

  if (sugestoes.length === 0) return null;

  return (
    <Card className={cn("border-primary/20 bg-primary/5", className)}>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Sugestões baseadas em padrões anteriores</span>
          <Sparkles className="h-3 w-3 text-amber-500" />
        </div>
        
        <div className="space-y-2">
          {sugestoes.map((sugestao) => (
            <div
              key={sugestao.padrao.id}
              className="flex items-center justify-between p-2 rounded-lg bg-background border"
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {sugestao.categoria?.nome || 'Categoria não definida'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Padrão: "{sugestao.padrao.padrao_descricao}"
                  </span>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    sugestao.matchScore >= 80 && "bg-green-50 text-green-700 border-green-200",
                    sugestao.matchScore >= 50 && sugestao.matchScore < 80 && "bg-amber-50 text-amber-700 border-amber-200",
                    sugestao.matchScore < 50 && "bg-muted"
                  )}
                >
                  {sugestao.matchScore}% match
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Usado {sugestao.padrao.vezes_usado}x
                </Badge>
              </div>
              
              <div className="flex items-center gap-1">
                {sugestao.categoria && onSelecionarCategoria && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => onSelecionarCategoria(
                      sugestao.categoria!.id,
                      sugestao.padrao.tipo_lancamento || (tipoMovimento === 'credito' ? 'entrada' : 'saida')
                    )}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Usar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-muted-foreground hover:text-destructive"
                  onClick={() => desativarPadrao(sugestao.padrao.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <Lightbulb className="h-3 w-3" />
          Padrões aprendidos automaticamente das suas conciliações anteriores
        </p>
      </CardContent>
    </Card>
  );
}
