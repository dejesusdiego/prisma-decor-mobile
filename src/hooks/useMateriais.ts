import { useQuery } from '@tanstack/react-query';
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
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (antigo cacheTime)
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
 * Ideal para EtapaProdutos onde precisamos de todas as categorias
 */
export function useMateriaisMultiplas(
  categorias: CategoriasMateriais[] = ['tecido', 'forro', 'trilho', 'acessorio', 'persiana', 'papel', 'motorizado'],
  apenasAtivos: boolean = true
): UseMateriaisMultiplasResult {
  const queries = categorias.map(categoria => 
    useQuery({
      queryKey: ['materiais', categoria, apenasAtivos],
      queryFn: () => fetchMateriaisPaginados(categoria, apenasAtivos),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    })
  );

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
