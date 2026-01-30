import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Package, Search, Plus, Edit, Trash2 } from 'lucide-react'
import { supabase } from '@core/lib/supabase'
import { useAuth } from '@core/auth'
import { formatCurrency } from '@core/lib/utils'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  unit: string
  is_active: boolean
}

export function CatalogoPage() {
  const { supplierId } = useAuth()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['supplier-products', supplierId, search, categoryFilter],
    queryFn: async () => {
      if (!supplierId) return []

      let query = supabase
        .from('supplier_materials')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('name', { ascending: true })

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled: !!supplierId,
  })

  const categories = [...new Set(products?.map(p => p.category) || [])]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meu Catálogo</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus produtos e preços
          </p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Produto
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todas as categorias</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg border p-4 animate-pulse">
              <div className="h-6 w-3/4 bg-muted rounded mb-2" />
              <div className="h-4 w-1/2 bg-muted rounded mb-4" />
              <div className="h-8 w-24 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : products?.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum produto encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Adicione produtos ao seu catálogo para começar
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products?.map((product) => (
            <div key={product.id} className={`bg-card rounded-lg border p-4 ${!product.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.category}</p>
                </div>
                {!product.is_active && (
                  <span className="text-xs bg-muted px-2 py-1 rounded">Inativo</span>
                )}
              </div>
              
              {product.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {product.description}
                </p>
              )}

              <div className="mt-4 flex items-center justify-between">
                <p className="text-lg font-bold">
                  {formatCurrency(product.price)}
                  <span className="text-sm font-normal text-muted-foreground">/{product.unit}</span>
                </p>
                <div className="flex gap-1">
                  <button className="p-2 hover:bg-muted rounded-md" title="Editar">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="p-2 hover:bg-destructive/10 text-destructive rounded-md" title="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
