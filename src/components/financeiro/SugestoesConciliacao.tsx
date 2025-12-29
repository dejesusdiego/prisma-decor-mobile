import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Sparkles, ArrowRight } from 'lucide-react';
import { useSugestoesConciliacao, SugestaoContaReceber, SugestaoContaPagar, SugestaoOrcamento } from '@/hooks/useSugestoesConciliacao';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface SugestoesConciliacaoProps {
  movimentacao: {
    id: string;
    descricao: string;
    valor: number;
    tipo: string | null;
    data_movimentacao: string;
  } | null;
  onSelecionarRecebimento?: (parcela: SugestaoContaReceber) => void;
  onSelecionarPagamento?: (conta: SugestaoContaPagar) => void;
  onSelecionarOrcamento?: (orcamento: SugestaoOrcamento) => void;
}

export function SugestoesConciliacao({ 
  movimentacao, 
  onSelecionarRecebimento,
  onSelecionarPagamento,
  onSelecionarOrcamento
}: SugestoesConciliacaoProps) {
  const { 
    sugestoesRecebimento, 
    sugestoesPagamento, 
    sugestoesOrcamento, 
    isLoading, 
    temSugestoes 
  } = useSugestoesConciliacao(movimentacao);

  if (!movimentacao) return null;

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span className="text-sm">Buscando sugestões...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!temSugestoes) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">Sugestões Inteligentes</span>
        </div>

        {/* Sugestões de Recebimento (créditos) */}
        {sugestoesRecebimento.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Parcelas a receber compatíveis:</p>
            {sugestoesRecebimento.map((sugestao) => (
              <div 
                key={sugestao.parcelaId}
                className="flex items-center justify-between p-2 bg-background rounded border hover:border-primary/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        sugestao.similaridade >= 80 
                          ? 'border-green-500 text-green-600' 
                          : 'border-amber-500 text-amber-600'
                      }`}
                    >
                      {sugestao.similaridade}% match
                    </Badge>
                    {sugestao.orcamentoCodigo && (
                      <span className="text-xs text-muted-foreground">
                        {sugestao.orcamentoCodigo}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate mt-1">
                    {sugestao.clienteNome} - Parcela {sugestao.numeroParcela}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatCurrency(sugestao.valorParcela)}</span>
                    <span>•</span>
                    <span>Venc: {formatDate(sugestao.dataVencimento)}</span>
                  </div>
                  <p className="text-xs text-primary mt-0.5">{sugestao.motivoMatch}</p>
                </div>
                {onSelecionarRecebimento && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => onSelecionarRecebimento(sugestao)}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Sugestões de Pagamento (débitos) */}
        {sugestoesPagamento.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Contas a pagar compatíveis:</p>
            {sugestoesPagamento.map((sugestao) => (
              <div 
                key={sugestao.contaId}
                className="flex items-center justify-between p-2 bg-background rounded border hover:border-primary/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        sugestao.similaridade >= 80 
                          ? 'border-green-500 text-green-600' 
                          : 'border-amber-500 text-amber-600'
                      }`}
                    >
                      {sugestao.similaridade}% match
                    </Badge>
                    {sugestao.orcamentoCodigo && (
                      <span className="text-xs text-muted-foreground">
                        {sugestao.orcamentoCodigo}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate mt-1">
                    {sugestao.descricao}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatCurrency(sugestao.valor)}</span>
                    {sugestao.fornecedor && (
                      <>
                        <span>•</span>
                        <span>{sugestao.fornecedor}</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-primary mt-0.5">{sugestao.motivoMatch}</p>
                </div>
                {onSelecionarPagamento && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => onSelecionarPagamento(sugestao)}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Sugestões de Orçamento */}
        {sugestoesOrcamento.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Orçamentos relacionados:</p>
            {sugestoesOrcamento.map((sugestao) => (
              <div 
                key={sugestao.orcamentoId}
                className="flex items-center justify-between p-2 bg-background rounded border hover:border-primary/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">
                      {sugestao.codigo}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        sugestao.similaridade >= 60 
                          ? 'border-green-500 text-green-600' 
                          : 'border-muted'
                      }`}
                    >
                      {sugestao.similaridade}%
                    </Badge>
                  </div>
                  <p className="text-sm truncate mt-1">{sugestao.clienteNome}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatCurrency(sugestao.valorTotal)}</span>
                    <span>•</span>
                    <span>{sugestao.motivoMatch}</span>
                  </div>
                </div>
                {onSelecionarOrcamento && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => onSelecionarOrcamento(sugestao)}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
