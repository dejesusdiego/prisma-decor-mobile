import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Check, X, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Supplier {
  id: string
  name: string
  email: string
  phone: string
  categories: string[]
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  company_name: string
  document: string
}

export function SuppliersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  const { data: suppliers, isLoading } = useQuery<Supplier[]>({
    queryKey: ['suppliers', search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false })

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`)
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
  })

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suppliers')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['platform-stats'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suppliers')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['platform-stats'] })
    },
  })

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    const labels: Record<string, string> = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fornecedores</h1>
          <p className="text-muted-foreground mt-1">
            Aprove ou rejeite cadastros de fornecedores
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar fornecedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todos os status</option>
          <option value="pending">Pendentes</option>
          <option value="approved">Aprovados</option>
          <option value="rejected">Rejeitados</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Fornecedor</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Categorias</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Cadastro</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td colSpan={5} className="px-4 py-4">
                      <div className="animate-pulse flex gap-4">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-4 w-24 bg-muted rounded" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : suppliers?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum fornecedor encontrado
                  </td>
                </tr>
              ) : (
                suppliers?.map((supplier) => (
                  <tr key={supplier.id} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{supplier.company_name || supplier.name}</p>
                        <p className="text-sm text-muted-foreground">{supplier.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {supplier.categories?.slice(0, 2).map((cat) => (
                          <span key={cat} className="px-2 py-0.5 bg-muted rounded text-xs">
                            {cat}
                          </span>
                        ))}
                        {supplier.categories?.length > 2 && (
                          <span className="px-2 py-0.5 text-xs text-muted-foreground">
                            +{supplier.categories.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(supplier.status)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(supplier.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {supplier.status === 'pending' && (
                          <>
                            <button
                              onClick={() => approveMutation.mutate(supplier.id)}
                              disabled={approveMutation.isPending}
                              className="p-2 hover:bg-green-100 text-green-600 rounded-md"
                              title="Aprovar"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => rejectMutation.mutate(supplier.id)}
                              disabled={rejectMutation.isPending}
                              className="p-2 hover:bg-red-100 text-red-600 rounded-md"
                              title="Rejeitar"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedSupplier(supplier)}
                          className="p-2 hover:bg-muted rounded-md"
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Detalhes do Fornecedor</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Nome</label>
                <p className="font-medium">{selectedSupplier.name}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Empresa</label>
                <p className="font-medium">{selectedSupplier.company_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <p className="font-medium">{selectedSupplier.email}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Telefone</label>
                <p className="font-medium">{selectedSupplier.phone || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Documento</label>
                <p className="font-medium">{selectedSupplier.document || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Categorias</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedSupplier.categories?.map((cat) => (
                    <span key={cat} className="px-2 py-1 bg-muted rounded text-sm">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-2">
              {selectedSupplier.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      rejectMutation.mutate(selectedSupplier.id)
                      setSelectedSupplier(null)
                    }}
                    className="px-4 py-2 border rounded-md hover:bg-muted"
                  >
                    Rejeitar
                  </button>
                  <button
                    onClick={() => {
                      approveMutation.mutate(selectedSupplier.id)
                      setSelectedSupplier(null)
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Aprovar
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedSupplier(null)}
                className="px-4 py-2 border rounded-md hover:bg-muted"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
