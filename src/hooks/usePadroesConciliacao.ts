import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface PadraoConciliacao {
  id: string;
  padrao_descricao: string;
  tipo_conciliacao: string;
  categoria_id: string | null;
  tipo_lancamento: string | null;
  vezes_usado: number;
  confianca: number;
  ativo: boolean;
}

export interface SugestaoPadrao {
  padrao: PadraoConciliacao;
  matchScore: number;
  categoria?: { id: string; nome: string; tipo: string };
}

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extrairPalavrasChave(descricao: string): string[] {
  const normalized = normalizarTexto(descricao);
  const palavras = normalized.split(' ').filter(p => p.length > 3);
  
  // Remover palavras muito comuns em extratos
  const stopWords = new Set([
    'pago', 'pagamento', 'transferencia', 'pix', 'ted', 'doc', 'debito', 'credito',
    'para', 'de', 'do', 'da', 'dos', 'das', 'com', 'por', 'banco', 'conta', 'valor'
  ]);
  
  return palavras.filter(p => !stopWords.has(p));
}

function calcularMatchScore(descricaoExtrato: string, padraoDescricao: string): number {
  const palavrasExtrato = extrairPalavrasChave(descricaoExtrato);
  const palavrasPadrao = extrairPalavrasChave(padraoDescricao);
  
  if (palavrasExtrato.length === 0 || palavrasPadrao.length === 0) return 0;
  
  let matches = 0;
  for (const pe of palavrasExtrato) {
    if (palavrasPadrao.some(pp => pp.includes(pe) || pe.includes(pp))) {
      matches++;
    }
  }
  
  const baseScore = (matches / Math.max(palavrasExtrato.length, palavrasPadrao.length)) * 100;
  return Math.round(baseScore);
}

export interface MatchAltaProbabilidade {
  movimentacaoId: string;
  descricao: string;
  valor: number;
  padrao: PadraoConciliacao;
  matchScore: number;
  categoria?: { id: string; nome: string; tipo: string };
}

export function usePadroesConciliacao() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar todos os padrões ativos
  const { data: padroes = [], isLoading } = useQuery({
    queryKey: ['padroes-conciliacao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('padroes_conciliacao')
        .select(`
          id,
          padrao_descricao,
          tipo_conciliacao,
          categoria_id,
          tipo_lancamento,
          vezes_usado,
          confianca,
          ativo,
          categoria:categorias_financeiras(id, nome, tipo)
        `)
        .eq('ativo', true)
        .order('confianca', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Verificar matches de alta probabilidade para movimentações
  const verificarMatchesAlta = (movimentacoes: Array<{
    id: string;
    descricao: string;
    valor: number;
    tipo: string;
    conciliado?: boolean;
    ignorado?: boolean;
  }>): MatchAltaProbabilidade[] => {
    const matches: MatchAltaProbabilidade[] = [];

    for (const mov of movimentacoes) {
      if (mov.conciliado || mov.ignorado) continue;

      const tipoLancamento = mov.tipo === 'credito' ? 'entrada' : 'saida';
      
      for (const padrao of padroes) {
        if (padrao.tipo_lancamento && padrao.tipo_lancamento !== tipoLancamento) continue;

        const matchScore = calcularMatchScore(mov.descricao, padrao.padrao_descricao);
        
        // Alta probabilidade: score >= 70%
        if (matchScore >= 70) {
          matches.push({
            movimentacaoId: mov.id,
            descricao: mov.descricao,
            valor: mov.valor,
            padrao,
            matchScore,
            categoria: (padrao as any).categoria
          });
          break; // Um match por movimentação
        }
      }
    }

    return matches;
  };

  // Buscar sugestões baseadas em padrões para uma descrição
  const buscarSugestoesPorPadrao = (descricaoExtrato: string, tipoMovimento: 'credito' | 'debito'): SugestaoPadrao[] => {
    const tipoLancamento = tipoMovimento === 'credito' ? 'entrada' : 'saida';
    
    const sugestoes: SugestaoPadrao[] = [];

    for (const padrao of padroes) {
      // Filtrar por tipo compatível
      if (padrao.tipo_lancamento && padrao.tipo_lancamento !== tipoLancamento) continue;

      const matchScore = calcularMatchScore(descricaoExtrato, padrao.padrao_descricao);
      
      // Só considerar se tiver match mínimo
      if (matchScore < 30) continue;

      // Ajustar score baseado na confiança do padrão
      const scoreAjustado = Math.round((matchScore * 0.6) + (padrao.confianca * 0.4));

      sugestoes.push({
        padrao,
        matchScore: scoreAjustado,
        categoria: (padrao as any).categoria
      });
    }

    return sugestoes
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
  };

  // Salvar/atualizar padrão após conciliação bem sucedida
  const salvarPadraoMutation = useMutation({
    mutationFn: async ({
      descricaoExtrato,
      tipoConciliacao,
      categoriaId,
      tipoLancamento
    }: {
      descricaoExtrato: string;
      tipoConciliacao: string;
      categoriaId?: string;
      tipoLancamento?: string;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const palavrasChave = extrairPalavrasChave(descricaoExtrato).slice(0, 5).join(' ');
      if (!palavrasChave) return null;

      // Verificar se já existe padrão similar
      const { data: existentes } = await supabase
        .from('padroes_conciliacao')
        .select('id, vezes_usado, confianca')
        .eq('padrao_descricao', palavrasChave)
        .eq('tipo_conciliacao', tipoConciliacao)
        .eq('ativo', true)
        .limit(1);

      if (existentes && existentes.length > 0) {
        // Atualizar padrão existente
        const padrao = existentes[0];
        const novaConfianca = Math.min(100, padrao.confianca + 5);
        
        const { error } = await supabase
          .from('padroes_conciliacao')
          .update({
            vezes_usado: padrao.vezes_usado + 1,
            confianca: novaConfianca,
            ultima_utilizacao: new Date().toISOString()
          })
          .eq('id', padrao.id);

        if (error) throw error;
        return padrao;
      } else {
        // Criar novo padrão
        const { data, error } = await supabase
          .from('padroes_conciliacao')
          .insert({
            padrao_descricao: palavrasChave,
            tipo_conciliacao: tipoConciliacao,
            categoria_id: categoriaId || null,
            tipo_lancamento: tipoLancamento || null,
            created_by_user_id: user.id,
            confianca: 50
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['padroes-conciliacao'] });
    },
    onError: (error: Error) => {
      console.error('Erro ao salvar padrão:', error);
    }
  });

  // Desativar padrão (quando usuário rejeita sugestão)
  const desativarPadraoMutation = useMutation({
    mutationFn: async (padraoId: string) => {
      const { error } = await supabase
        .from('padroes_conciliacao')
        .update({ ativo: false })
        .eq('id', padraoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['padroes-conciliacao'] });
      toast.success('Sugestão removida');
    }
  });

  return {
    padroes,
    isLoading,
    buscarSugestoesPorPadrao,
    verificarMatchesAlta,
    salvarPadrao: salvarPadraoMutation.mutate,
    desativarPadrao: desativarPadraoMutation.mutate
  };
}
