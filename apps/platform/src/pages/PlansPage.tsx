import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'

interface Plan {
  id: string
  name: string
  description: string | null
  price: number
  max_users: number
  features: string[]
  is_active: boolean
  created_at: string
}

export function PlansPage() {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Plan>>({})

  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true })

      if (error) throw error
      return data || []
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Plan> & { id: string }) => {
      const { error } = await supabase
        .from('plans')
        .update(data)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      setIsEditing(null)
    },
  })

  const handleEdit = (plan: Plan) => {
    setIsEditing(plan.id)
    setEditForm(plan)
  }

  const handleSave = () => {
    if (isEditing && editForm) {
      updateMutation.mutate({ id: isEditing, ...editForm })
    }
  }

  const handleCancel = () => {
    setIsEditing(null)
    setEditForm({})
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os planos de assinatura da plataforma
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg border p-6 animate-pulse">
              <div className="h-8 w-32 bg-muted rounded mb-4" />
              <div className="h-12 w-24 bg-muted rounded mb-4" />
              <div className="h-4 w-full bg-muted rounded" />
            </div>
          ))
        ) : (
          plans?.map((plan) => (
            <div
              key={plan.id}
              className={`bg-card rounded-lg border p-6 ${
                plan.is_active ? '' : 'opacity-60'
              }`}
            >
              {isEditing === plan.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Nome</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Preço (R$)</label>
                    <input
                      type="number"
                      value={editForm.price || 0}
                      onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Máx. usuários</label>
                    <input
                      type="number"
                      value={editForm.max_users || 0}
                      onChange={(e) => setEditForm({ ...editForm, max_users: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      className="flex-1 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center justify-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Salvar
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 py-2 border rounded-md hover:bg-muted flex items-center justify-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {plan.is_active ? 'Ativo' : 'Inativo'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEdit(plan)}
                      className="p-2 hover:bg-muted rounded-md"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <span className="text-3xl font-bold">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    {plan.description || 'Sem descrição'}
                  </p>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Recursos:</p>
                    <ul className="space-y-1">
                      <li className="text-sm text-muted-foreground flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Até {plan.max_users} usuários
                      </li>
                      {plan.features?.map((feature, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-muted-foreground flex items-center gap-2"
                        >
                          <Check className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
