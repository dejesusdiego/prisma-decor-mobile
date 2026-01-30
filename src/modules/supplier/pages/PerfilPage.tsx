import { useState } from 'react'
import { useAuth } from '@core/auth'
import { User, Mail, Phone, Building2, MapPin } from 'lucide-react'

export function PerfilPage() {
  const { user, supplierId, isApprovedSupplier } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas informações de fornecedor
        </p>
      </div>

      <div className="bg-card rounded-lg border p-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user?.email?.split('@')[0] || 'Fornecedor'}</h2>
            <p className="text-sm text-muted-foreground">
              {isApprovedSupplier ? 'Fornecedor aprovado' : 'Aguardando aprovação'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                ID do Fornecedor
              </label>
              <p className="font-medium mt-1">{supplierId || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <p className="font-medium mt-1">{user?.email || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone
              </label>
              <p className="font-medium mt-1">-</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Localização
              </label>
              <p className="font-medium mt-1">-</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-medium mb-2">Categorias</h3>
            <div className="flex flex-wrap gap-2">
              <span className="text-muted-foreground text-sm">
                Nenhuma categoria cadastrada
              </span>
            </div>
          </div>

          <div className="pt-4 flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90"
            >
              Editar Perfil
            </button>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Editar Perfil</h3>
            <p className="text-muted-foreground mb-4">
              Em breve você poderá editar suas informações.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setIsEditing(false)}
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
