import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useOrcamentos } from '@/hooks/useOrcamentos'
import { Plus, Search, FileText, Loader2 } from 'lucide-react'

const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
}

const statusColors: Record<string, string> = {
  rascunho: 'bg-gray-500',
  enviado: 'bg-yellow-500',
  aprovado: 'bg-green-500',
  rejeitado: 'bg-red-500',
}

export function OrcamentosPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data: orcamentos, isLoading, error } = useOrcamentos()

  const filteredOrcamentos = orcamentos?.filter((orc) =>
    orc.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
    orc.codigo?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orçamentos</h1>
        <Button onClick={() => navigate('/orcamentos/novo')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Orçamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Erro ao carregar orçamentos
            </div>
          ) : filteredOrcamentos?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nenhum orçamento encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Código</th>
                    <th className="text-left py-3 px-4 font-medium">Cliente</th>
                    <th className="text-left py-3 px-4 font-medium">Cidade</th>
                    <th className="text-left py-3 px-4 font-medium">Valor</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrcamentos?.map((orc) => (
                    <tr key={orc.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-mono text-sm">{orc.codigo}</td>
                      <td className="py-3 px-4">{orc.cliente_nome || 'N/A'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{orc.cidade || '-'}</td>
                      <td className="py-3 px-4">
                        {(orc.total_com_desconto || orc.total_geral)?.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={statusColors[orc.status] || 'bg-gray-500'}>
                          {statusLabels[orc.status] || orc.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(orc.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
