import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SupplierMaterial {
  id: string;
  supplier_id: string;
  sku: string | null;
  name: string;
  description: string | null;
  unit: string | null;
  price: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierMaterialsStats {
  total: number;
  active: number;
  inactive: number;
  byCategory: Record<string, number>;
}

/**
 * Hook para buscar materiais do fornecedor logado
 */
export function useSupplierMaterials(supplierId: string | null) {
  return useQuery({
    queryKey: ['supplier-materials', supplierId],
    queryFn: async (): Promise<SupplierMaterial[]> => {
      if (!supplierId) return [];

      const { data, error } = await supabase
        .from('supplier_materials')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []) as SupplierMaterial[];
    },
    enabled: !!supplierId,
    staleTime: 2 * 60 * 1000, // Cache por 2 minutos
    gcTime: 10 * 60 * 1000, // Manter em cache por 10 minutos
  });
}

/**
 * Hook para buscar estatísticas dos materiais do fornecedor
 */
export function useSupplierMaterialsStats(supplierId: string | null) {
  return useQuery({
    queryKey: ['supplier-materials-stats', supplierId],
    queryFn: async (): Promise<SupplierMaterialsStats> => {
      if (!supplierId) {
        return { total: 0, active: 0, inactive: 0, byCategory: {} };
      }

      const { data, error } = await supabase
        .from('supplier_materials')
        .select('active, unit')
        .eq('supplier_id', supplierId);

      if (error) throw error;

      const materials = (data || []) as SupplierMaterial[];
      const total = materials.length;
      const active = materials.filter(m => m.active).length;
      const inactive = total - active;

      // Agrupar por categoria (usando unit como proxy de categoria por enquanto)
      // TODO: Adicionar campo category em supplier_materials se necessário
      const byCategory: Record<string, number> = {};
      materials.forEach(m => {
        const category = m.unit || 'Outros';
        byCategory[category] = (byCategory[category] || 0) + 1;
      });

      return { total, active, inactive, byCategory };
    },
    enabled: !!supplierId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para invalidar cache de materiais após mutações
 */
export function useInvalidateSupplierMaterials() {
  const queryClient = useQueryClient();

  return (supplierId: string | null) => {
    queryClient.invalidateQueries({ queryKey: ['supplier-materials', supplierId] });
    queryClient.invalidateQueries({ queryKey: ['supplier-materials-stats', supplierId] });
  };
}
