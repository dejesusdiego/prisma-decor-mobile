import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SugestaoCategoria {
  categoriaId: string;
  categoriaNome: string;
  tipoCategoria: string;
  confianca: number;
  baseadoEm: string;
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
  const palavras = normalized.split(' ').filter(p => p.length > 2);
  
  const stopWords = new Set([
    'pago', 'pagamento', 'transferencia', 'pix', 'ted', 'doc', 'debito', 'credito',
    'para', 'por', 'banco', 'conta', 'valor', 'ref', 'nf', 'numero', 'bco'
  ]);
  
  return palavras.filter(p => !stopWords.has(p)).slice(0, 6);
}

function calcularSimilaridade(palavras1: string[], palavras2: string[]): number {
  if (palavras1.length === 0 || palavras2.length === 0) return 0;
  
  let matches = 0;
  for (const p1 of palavras1) {
    if (palavras2.some(p2 => p2.includes(p1) || p1.includes(p2))) {
      matches++;
    }
  }
  
  return (matches / Math.max(palavras1.length, palavras2.length)) * 100;
}

export function useSugestaoCategoria(descricao: string, tipoMovimento: 'credito' | 'debito') {
  const { user } = useAuth();
  const tipoLancamento = tipoMovimento === 'credito' ? 'entrada' : 'saida';

  return useQuery({
    queryKey: ['sugestao-categoria', descricao, tipoMovimento],
    queryFn: async (): Promise<SugestaoCategoria | null> => {
      if (!descricao || descricao.length < 3) return null;

      // Buscar lançamentos dos últimos 6 meses com categoria definida
      const { data: lancamentos } = await supabase
        .from('lancamentos_financeiros')
        .select(`
          descricao,
          categoria_id,
          categoria:categorias_financeiras(id, nome, tipo)
        `)
        .eq('tipo', tipoLancamento)
        .not('categoria_id', 'is', null)
        .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(200);

      if (!lancamentos || lancamentos.length === 0) return null;

      const palavrasChaveDescricao = extrairPalavrasChave(descricao);
      if (palavrasChaveDescricao.length === 0) return null;

      // Agrupar por categoria e calcular similaridade
      const categoriasScore: Map<string, { 
        categoriaId: string; 
        categoriaNome: string;
        tipoCategoria: string;
        totalSimilaridade: number; 
        count: number;
        melhoresMatches: string[];
      }> = new Map();

      for (const lanc of lancamentos) {
        if (!lanc.categoria_id || !lanc.categoria) continue;
        
        const categoria = lanc.categoria as any;
        const palavrasLanc = extrairPalavrasChave(lanc.descricao);
        const similaridade = calcularSimilaridade(palavrasChaveDescricao, palavrasLanc);
        
        if (similaridade < 30) continue;

        const current = categoriasScore.get(lanc.categoria_id) || {
          categoriaId: lanc.categoria_id,
          categoriaNome: categoria.nome,
          tipoCategoria: categoria.tipo,
          totalSimilaridade: 0,
          count: 0,
          melhoresMatches: []
        };

        current.totalSimilaridade += similaridade;
        current.count++;
        if (similaridade >= 50 && current.melhoresMatches.length < 3) {
          current.melhoresMatches.push(lanc.descricao);
        }

        categoriasScore.set(lanc.categoria_id, current);
      }

      if (categoriasScore.size === 0) return null;

      // Encontrar categoria com maior score médio ponderado
      let melhorCategoria = null;
      let melhorScore = 0;

      for (const [, data] of categoriasScore) {
        const scoreMedio = data.totalSimilaridade / data.count;
        const scoreComPeso = scoreMedio * Math.min(data.count, 5); // Peso por frequência (max 5x)
        
        if (scoreComPeso > melhorScore) {
          melhorScore = scoreComPeso;
          melhorCategoria = data;
        }
      }

      if (!melhorCategoria || melhorCategoria.totalSimilaridade / melhorCategoria.count < 40) {
        return null;
      }

      const confianca = Math.min(100, Math.round((melhorCategoria.totalSimilaridade / melhorCategoria.count) + (melhorCategoria.count * 5)));

      return {
        categoriaId: melhorCategoria.categoriaId,
        categoriaNome: melhorCategoria.categoriaNome,
        tipoCategoria: melhorCategoria.tipoCategoria,
        confianca,
        baseadoEm: `${melhorCategoria.count} lançamento(s) similar(es)`
      };
    },
    enabled: !!user && !!descricao && descricao.length >= 3,
    staleTime: 30000
  });
}
