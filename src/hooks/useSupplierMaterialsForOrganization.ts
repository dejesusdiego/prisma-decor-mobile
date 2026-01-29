import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SupplierMaterialOrg {
  id: string;
  supplier_id: string;
  supplier_name: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  width_meters: number | null;
  color: string | null;
  line: string | null;
  is_active: boolean;
}

export interface SupplierMaterialGrouped {
  supplier_id: string;
  supplier_name: string;
  materials: SupplierMaterialOrg[];
}

/**
 * Hook to fetch supplier materials for the current organization
 */
export function useSupplierMaterialsForOrganization(organizationId: string | null) {
  return useQuery({
    queryKey: ['supplier-materials-organization', organizationId],
    queryFn: async (): Promise<SupplierMaterialOrg[]> => {
      if (!organizationId) return [];

      const { data, error } = await (supabase as any)
        .rpc('get_supplier_materials_for_organization', {
          p_organization_id: organizationId,
        });

      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch supplier materials grouped by supplier
 */
export function useSupplierMaterialsGrouped(organizationId: string | null) {
  const { data: materials, ...rest } = useSupplierMaterialsForOrganization(organizationId);

  const grouped = materials?.reduce((acc: SupplierMaterialGrouped[], material) => {
    const existingGroup = acc.find(g => g.supplier_id === material.supplier_id);
    if (existingGroup) {
      existingGroup.materials.push(material);
    } else {
      acc.push({
        supplier_id: material.supplier_id,
        supplier_name: material.supplier_name,
        materials: [material],
      });
    }
    return acc;
  }, [] as SupplierMaterialGrouped[]);

  return {
    data: grouped,
    materials,
    ...rest,
  };
}

/**
 * Hook to get materials by category from suppliers
 */
export function useSupplierMaterialsByCategory(
  organizationId: string | null,
  category: 'tecido' | 'forro' | 'trilho' | 'persiana' | 'acessorio' | 'papel' | 'motorizado' | null
) {
  const { data: materials, ...rest } = useSupplierMaterialsForOrganization(organizationId);

  const filtered = materials?.filter(m => {
    if (!category) return true;
    
    // Map category to supplier material categories
    const categoryMap: Record<string, string[]> = {
      'tecido': ['Tecido', 'Tecidos'],
      'forro': ['Forro', 'Forros'],
      'trilho': ['Trilho', 'Trilhos', 'Trilho Suiço'],
      'persiana': ['Persiana', 'Persianas'],
      'acessorio': ['Acessório', 'Acessórios', 'Acessorio', 'Acessorios'],
      'papel': ['Papel', 'Papeis'],
      'motorizado': ['Motor', 'Motorizado', 'Motores'],
    };
    
    const validCategories = categoryMap[category] || [category];
    return validCategories.some(c => 
      m.category.toLowerCase() === c.toLowerCase()
    );
  });

  return {
    data: filtered,
    materials,
    ...rest,
  };
}
