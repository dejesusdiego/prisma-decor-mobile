import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface SupplierStats {
  totalProducts: number
  pendingOrders: number
  viewsToday: number
}

export function useSupplierStats(supplierId: string | null) {
  return useQuery<SupplierStats>({
    queryKey: ['supplier-stats', supplierId],
    queryFn: async () => {
      if (!supplierId) {
        return { totalProducts: 0, pendingOrders: 0, viewsToday: 0 }
      }

      // Get products count
      const { count: productsCount } = await supabase
        .from('supplier_materials')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', supplierId)

      // Get pending orders count
      const { count: ordersCount } = await supabase
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', supplierId)
        .eq('status', 'pending')

      return {
        totalProducts: productsCount || 0,
        pendingOrders: ordersCount || 0,
        viewsToday: 0, // Would need analytics table
      }
    },
    enabled: !!supplierId,
  })
}
