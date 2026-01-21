import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import type { Material } from '@/types/orcamento';

interface SupplierMaterial {
  id: string;
  supplier_id: string;
  supplier_name: string;
  sku: string | null;
  name: string;
  description: string | null;
  unit: string | null;
  price: number;
  active: boolean;
}

/**
 * Hook para buscar materiais de fornecedores e transformá-los em formato Material
 * para uso no MaterialSelector
 */
export function useSupplierMaterials() {
  const { organizationId } = useOrganizationContext();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['supplier-materials', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      // Buscar fornecedores vinculados e ativos
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('supplier_organizations')
        .select('supplier_id')
        .eq('organization_id', organizationId)
        .eq('active', true);

      if (suppliersError) throw suppliersError;
      if (!suppliersData || suppliersData.length === 0) return [];

      const supplierIds = suppliersData.map(s => s.supplier_id);

      // Buscar materiais dos fornecedores
      const { data: materialsData, error: materialsError } = await supabase
        .from('supplier_materials')
        .select(`
          id,
          supplier_id,
          sku,
          name,
          description,
          unit,
          price,
          active,
          suppliers (
            id,
            name
          )
        `)
        .eq('active', true)
        .in('supplier_id', supplierIds)
        .order('name', { ascending: true });

      if (materialsError) throw materialsError;

      // Transformar em formato Material compatível
      const materials: (Material & { supplier_material_id?: string; supplier_id?: string; supplier_name?: string; price_snapshot?: number })[] = 
        (materialsData || []).map((item: any) => ({
          id: `supplier_${item.id}`, // Prefixo para identificar como supplier material
          nome: item.name,
          codigo_item: item.sku || '',
          preco_custo: item.price,
          preco_venda: item.price,
          categoria: 'acessorio' as const, // Default, pode ser ajustado depois
          ativo: item.active,
          fornecedor: item.suppliers?.name || 'Fornecedor',
          // Campos específicos de supplier
          supplier_material_id: item.id,
          supplier_id: item.supplier_id,
          supplier_name: item.suppliers?.name,
          price_snapshot: item.price, // Snapshot inicial
        }));

      return materials;
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutos (materiais de fornecedor mudam menos)
    gcTime: 15 * 60 * 1000,
  });

  return {
    materials: data || [],
    loading: isLoading,
    error: error as Error | null,
    refetch,
  };
}
