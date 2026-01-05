import { useQuery, useQueries } from '@tanstack/react-query';
import { fetchMateriaisPaginados } from '@/lib/fetchMateriaisPaginados';
import type { Material } from '@/types/orcamento';

export type CategoriasMateriais = 
  | 'tecido' 
  | 'forro' 
  | 'trilho' 
  | 'acessorio' 
  | 'persiana' 
  | 'papel' 
  | 'motorizado';

interface UseMaterialResult {
  materiais: Material[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface UseMateriaisCategoriaResult extends UseMaterialResult {
  categoria: CategoriasMateriais;
}

/**
 * Hook para carregar materiais de uma categoria específica com cache
 */
export function useMateriaisCategoria(
  categoria: CategoriasMateriais,
  apenasAtivos: boolean = true
): UseMateriaisCategoriaResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['materiais', categoria, apenasAtivos],
    queryFn: () => fetchMateriaisPaginados(categoria, apenasAtivos),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  });

  return {
    categoria,
    materiais: data || [],
    loading: isLoading,
    error: error as Error | null,
    refetch,
  };
}

interface MateriaisPorCategoria {
  tecido: Material[];
  forro: Material[];
  trilho: Material[];
  acessorio: Material[];
  persiana: Material[];
  papel: Material[];
  motorizado: Material[];
}

interface UseMateriaisMultiplasResult {
  materiais: MateriaisPorCategoria;
  loading: boolean;
  error: Error | null;
  refetchAll: () => void;
}

/**
 * Hook para carregar materiais de múltiplas categorias de uma vez
 * Usa useQueries para evitar violação das regras de hooks
 */
export function useMateriaisMultiplas(
  categorias: CategoriasMateriais[] = ['tecido', 'forro', 'trilho', 'acessorio', 'persiana', 'papel', 'motorizado'],
  apenasAtivos: boolean = true
): UseMateriaisMultiplasResult {
  const queries = useQueries({
    queries: categorias.map(categoria => ({
      queryKey: ['materiais', categoria, apenasAtivos],
      queryFn: () => fetchMateriaisPaginados(categoria, apenasAtivos),
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    }))
  });

  const loading = queries.some(q => q.isLoading);
  const error = queries.find(q => q.error)?.error as Error | null;

  const materiais: MateriaisPorCategoria = {
    tecido: [],
    forro: [],
    trilho: [],
    acessorio: [],
    persiana: [],
    papel: [],
    motorizado: [],
  };

  categorias.forEach((categoria, index) => {
    materiais[categoria] = queries[index].data || [];
  });

  const refetchAll = () => {
    queries.forEach(q => q.refetch());
  };

  return {
    materiais,
    loading,
    error,
    refetchAll,
  };
}

/**
 * Hook para cortinas - carrega tecidos, forros e trilhos
 */
export function useMateriaisCortina(apenasAtivos: boolean = true) {
  return useMateriaisMultiplas(['tecido', 'forro', 'trilho'], apenasAtivos);
}
