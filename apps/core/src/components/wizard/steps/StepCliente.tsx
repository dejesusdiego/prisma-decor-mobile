import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { ClienteData } from '@/hooks/useOrcamentoWizard'

interface StepClienteProps {
  data: ClienteData
  onUpdate: (data: Partial<ClienteData>) => void
  errors?: string[]
}

export function StepCliente({ data, onUpdate, errors }: StepClienteProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados do Cliente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {errors && errors.length > 0 && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {errors.map((error, i) => (
              <p key={i}>{error}</p>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="nome">
              Nome Completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nome"
              value={data.nome}
              onChange={(e) => onUpdate({ nome: e.target.value })}
              placeholder="Digite o nome do cliente"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">
              Telefone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="telefone"
              value={data.telefone}
              onChange={(e) => onUpdate({ telefone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => onUpdate({ email: e.target.value })}
              placeholder="cliente@email.com"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={data.endereco}
              onChange={(e) => onUpdate({ endereco: e.target.value })}
              placeholder="Rua, número, complemento"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              value={data.cidade}
              onChange={(e) => onUpdate({ cidade: e.target.value })}
              placeholder="São Paulo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                value={data.estado}
                onChange={(e) => onUpdate({ estado: e.target.value })}
                placeholder="SP"
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={data.cep}
                onChange={(e) => onUpdate({ cep: e.target.value })}
                placeholder="00000-000"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
