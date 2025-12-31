import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, HelpCircle, Loader2 } from 'lucide-react';
import { calcularScoreCombinado, extrairNomesDeDescricao } from '@/lib/conciliacaoInteligente';
import { useConciliacaoLote, MatchParaConciliar } from '@/hooks/useConciliacaoLote';

interface MovimentacaoImportada {
  id: string;
  descricao: string;
  valor: number;
  data_movimentacao: string;
  tipo: string;
  conciliado: boolean;
  ignorado: boolean;
}

interface ParcelaPendente {
  id: string;
  numero_parcela: number;
  valor: number;
  data_vencimento: string;
  conta_receber: {
    id: string;
    cliente_nome: string;
    orcamento?: { id: string; codigo: string } | null;
  } | null;
}

interface DialogRevisaoImportacaoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extratoId: string;
  nomeArquivo: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR');
};

export function DialogRevisaoImportacao({
  open,
  onOpenChange,
  extratoId,
  nomeArquivo
}: DialogRevisaoImportacaoProps) {
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('alta');
  const { conciliarLote, isProcessando } = useConciliacaoLote();

  // Buscar movimentações do extrato recém-importado
  const { data: movimentacoes = [], isLoading: loadingMov } = useQuery({
    queryKey: ['movimentacoes-revisao', extratoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movimentacoes_extrato')
        .select('id, descricao, valor, data_movimentacao, tipo, conciliado, ignorado')
        .eq('extrato_id', extratoId)
        .eq('conciliado', false)
        .eq('ignorado', false);
      
      if (error) throw error;
      return (data || []) as MovimentacaoImportada[];
    },
    enabled: open && !!extratoId
  });

  // Buscar parcelas pendentes
  const { data: parcelasPendentes = [], isLoading: loadingParcelas } = useQuery({
    queryKey: ['parcelas-revisao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parcelas_receber')
        .select(`
          id, numero_parcela, valor, data_vencimento,
          conta_receber:contas_receber(
            id, cliente_nome,
            orcamento:orcamentos(id, codigo)
          )
        `)
        .eq('status', 'pendente');
      
      if (error) throw error;
      return (data || []) as ParcelaPendente[];
    },
    enabled: open
  });

  // Calcular matches
  const matches = useMemo(() => {
    const resultado: MatchParaConciliar[] = [];
    
    // Apenas créditos para match com parcelas
    const creditos = movimentacoes.filter(m => m.tipo === 'credito');
    
    for (const mov of creditos) {
      const nomesExtraidos = extrairNomesDeDescricao(mov.descricao);
      
      for (const parcela of parcelasPendentes) {
        if (!parcela.conta_receber) continue;
        
        const clienteNome = parcela.conta_receber.cliente_nome;
        const score = calcularScoreCombinado(
          mov.descricao,
          clienteNome,
          mov.valor,
          parcela.valor,
          mov.data_movimentacao,
          parcela.data_vencimento
        );
        
        if (score.scoreTotal >= 40) {
          resultado.push({
            movimentacaoId: mov.id,
            movimentacaoDescricao: mov.descricao,
            movimentacaoValor: mov.valor,
            movimentacaoData: mov.data_movimentacao,
            parcelaId: parcela.id,
            parcelaNumero: parcela.numero_parcela,
            parcelaValor: parcela.valor,
            contaReceberId: parcela.conta_receber.id,
            clienteNome: clienteNome,
            orcamentoCodigo: parcela.conta_receber.orcamento?.codigo,
            score: score.scoreTotal,
            confianca: score.confianca
          });
        }
      }
    }
    
    // Ordenar por score
    return resultado.sort((a, b) => b.score - a.score);
  }, [movimentacoes, parcelasPendentes]);

  // Separar por confiança
  const matchesAlta = matches.filter(m => m.confianca === 'alta');
  const matchesMedia = matches.filter(m => m.confianca === 'media');
  const semMatch = movimentacoes.filter(m => 
    m.tipo === 'credito' && !matches.some(match => match.movimentacaoId === m.id)
  );

  // Toggle seleção
  const toggleMatch = (movId: string) => {
    setSelectedMatches(prev => {
      const next = new Set(prev);
      if (next.has(movId)) {
        next.delete(movId);
      } else {
        next.add(movId);
      }
      return next;
    });
  };

  // Selecionar todos de alta confiança
  const selecionarTodosAlta = () => {
    setSelectedMatches(new Set(matchesAlta.map(m => m.movimentacaoId)));
  };

  // Confirmar selecionados
  const confirmarSelecionados = () => {
    const matchesSelecionados = matches.filter(m => selectedMatches.has(m.movimentacaoId));
    conciliarLote(matchesSelecionados, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  const isLoading = loadingMov || loadingParcelas;

  const renderMatchCard = (match: MatchParaConciliar) => (
    <div 
      key={match.movimentacaoId}
      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
    >
      <Checkbox
        checked={selectedMatches.has(match.movimentacaoId)}
        onCheckedChange={() => toggleMatch(match.movimentacaoId)}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{match.movimentacaoDescricao}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(match.movimentacaoData)} • {formatCurrency(match.movimentacaoValor)}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs">→</span>
          <span className="text-xs font-medium text-primary">
            {match.clienteNome}
            {match.orcamentoCodigo && ` - ${match.orcamentoCodigo}`}
            {match.parcelaNumero && ` (Parc. ${match.parcelaNumero})`}
          </span>
        </div>
        <div className="flex gap-1 mt-1">
          <Badge variant="outline" className="text-[10px]">
            Score: {match.score}%
          </Badge>
          {Math.abs(match.movimentacaoValor - (match.parcelaValor || 0)) < 1 && (
            <Badge variant="secondary" className="text-[10px]">Valor exato</Badge>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Revisão de Importação
          </DialogTitle>
          <DialogDescription>
            {nomeArquivo} • {movimentacoes.length} movimentações importadas
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="alta" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Alta ({matchesAlta.length})
                </TabsTrigger>
                <TabsTrigger value="media" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                  Média ({matchesMedia.length})
                </TabsTrigger>
                <TabsTrigger value="sem" className="flex items-center gap-1">
                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  Sem Match ({semMatch.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="alta" className="mt-4">
                {matchesAlta.length > 0 ? (
                  <>
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm text-muted-foreground">
                        Matches com alta probabilidade de correspondência
                      </p>
                      <Button variant="outline" size="sm" onClick={selecionarTodosAlta}>
                        Selecionar Todos
                      </Button>
                    </div>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {matchesAlta.map(renderMatchCard)}
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum match de alta confiança encontrado</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="media" className="mt-4">
                {matchesMedia.length > 0 ? (
                  <ScrollArea className="h-[300px]">
                    <p className="text-sm text-muted-foreground mb-3">
                      Revise estes matches com atenção antes de confirmar
                    </p>
                    <div className="space-y-2">
                      {matchesMedia.map(renderMatchCard)}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum match de média confiança</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sem" className="mt-4">
                {semMatch.length > 0 ? (
                  <ScrollArea className="h-[300px]">
                    <p className="text-sm text-muted-foreground mb-3">
                      Estas movimentações precisam de conciliação manual
                    </p>
                    <div className="space-y-2">
                      {semMatch.map(mov => (
                        <div key={mov.id} className="p-3 border rounded-lg">
                          <p className="text-sm font-medium truncate">{mov.descricao}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(mov.data_movimentacao)} • {formatCurrency(mov.valor)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <HelpCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Todas as movimentações têm sugestões de match</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {selectedMatches.size > 0 && (
              <div className="bg-primary/10 rounded-lg p-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedMatches.size} conciliação(ões) selecionada(s)
                  </span>
                  <Progress 
                    value={(selectedMatches.size / matches.length) * 100} 
                    className="w-24 h-2" 
                  />
                </div>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Revisar Depois
          </Button>
          <Button 
            onClick={confirmarSelecionados}
            disabled={selectedMatches.size === 0 || isProcessando}
          >
            {isProcessando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              `Confirmar ${selectedMatches.size} Selecionado(s)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
