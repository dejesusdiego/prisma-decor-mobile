import { supabase } from '@/integrations/supabase/client';
import type { Material } from '@/types/orcamento';

/**
 * Busca todos os materiais do banco de dados usando paginação
 * para contornar o limite de 1000 registros do Supabase
 */
export async function fetchMateriaisPaginados(
  categoria?: string,
  apenasAtivos: boolean = true
): Promise<Material[]> {
  let allMateriais: Material[] = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from('materiais')
      .select('*')
      .order('nome', { ascending: true })
      .range(from, from + pageSize - 1);

    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    if (apenasAtivos) {
      query = query.eq('ativo', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (data && data.length > 0) {
      const materiaisMapeados = data.map((m): Material => ({
        id: m.id,
        codigo_item: m.codigo_item || '',
        nome: m.nome,
        categoria: m.categoria,
        unidade: m.unidade,
        largura_metro: m.largura_metro || undefined,
        preco_custo: m.preco_custo,
        preco_tabela: m.preco_tabela,
        ativo: m.ativo,
        tipo: m.tipo || undefined,
        linha: m.linha || undefined,
        cor: m.cor || undefined,
        fornecedor: m.fornecedor || undefined,
        area_min_fat: m.area_min_fat || undefined,
        potencia: m.potencia || undefined,
        aplicacao: m.aplicacao || undefined,
      }));
      
      allMateriais = [...allMateriais, ...materiaisMapeados];
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  return allMateriais;
}

/**
 * Busca todos os materiais de múltiplas categorias
 */
export async function fetchMateriaisPorCategorias(
  categorias: string[],
  apenasAtivos: boolean = true
): Promise<Record<string, Material[]>> {
  const resultado: Record<string, Material[]> = {};
  
  await Promise.all(
    categorias.map(async (categoria) => {
      resultado[categoria] = await fetchMateriaisPaginados(categoria, apenasAtivos);
    })
  );
  
  return resultado;
}
