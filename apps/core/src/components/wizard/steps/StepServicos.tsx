import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Plus, Trash2, Wrench, Truck } from 'lucide-react'
import { useState } from 'react'
import type { ServicoItem } from '@/hooks/useOrcamentoWizard'
import { formatCurrency } from '@/lib/calculations'

interface StepServicosProps {
  servicos: ServicoItem[]
  onAdd: (servico: Omit<ServicoItem, 'id'>) => void
  onRemove: (id: string) => void
  observacoes: string
  onUpdateObservacoes: (obs: string) => void
  tipoDesconto: 'percentual' | 'valor' | null
  valorDesconto: number
  onUpdateDesconto: (tipo: 'percentual' | 'valor' | null, valor: number) => void
  subtotal: number
  valorDescontoCalculado: number
  total: number
}

const TIPOS_SERVICO = [
  { value: 'instalacao', label: 'Instalação', icon: Wrench },
  { value: 'manutencao', label: 'Manutenção', icon: Wrench },
  { value: 'medicao', label: 'Medição/Visita', icon: Truck },
] as const

export function StepServicos({
  servicos,
  onAdd,
  onRemove,
  observacoes,
  onUpdateObservacoes,
  tipoDesconto,
  valorDesconto,
  onUpdateDesconto,
  subtotal,
  valorDescontoCalculado,
  total,
}: StepServicosProps) {
  const [novoServico, setNovoServico] = useState({
    tipo: 'instalacao' as const,
    descricao: '',
    valor: 0,
  })

  const handleAdd = () => {
    if (!novoServico.descricao || novoServico.valor <= 0) return
    onAdd(novoServico)
    setNovoServico({ tipo: 'instalacao', descricao: '', valor: 0 })
  }

  return (
    <div className="space-y-6">
      {/* Serviços */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Serviço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={novoServico.tipo}
                onValueChange={(v) => setNovoServico(s => ({ ...s, tipo: v as typeof s.tipo }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_SERVICO.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={novoServico.descricao}
                onChange={(e) => setNovoServico(s => ({ ...s, descricao: e.target.value }))}
                placeholder="Ex: Instalação de cortinas"
              />
            </div>

            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={novoServico.valor || ''}
                onChange={(e) => setNovoServico(s => ({ ...s, valor: Number(e.target.value) }))}
                placeholder="0,00"
              />
            </div>
          </div>

          <Button onClick={handleAdd} disabled={!novoServico.descricao || novoServico.valor <= 0}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Serviço
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Serviços */}
      {servicos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Serviços Adicionados ({servicos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {servicos.map((servico) => (
                <div
                  key={servico.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{servico.descricao}</span>
                      <span className="text-xs px-2 py-0.5 bg-muted rounded-full capitalize">
                        {servico.tipo}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">
                      {formatCurrency(servico.valor)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(servico.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desconto e Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Desconto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Desconto</Label>
              <Select
                value={tipoDesconto || 'none'}
                onValueChange={(v) => onUpdateDesconto(
                  v === 'none' ? null : v as 'percentual' | 'valor',
                  valorDesconto
                )}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem desconto</SelectItem>
                  <SelectItem value="percentual">Percentual (%)</SelectItem>
                  <SelectItem value="valor">Valor (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tipoDesconto && (
              <div className="space-y-2">
                <Label>{tipoDesconto === 'percentual' ? 'Percentual (%)' : 'Valor (R$)'}</Label>
                <Input
                  type="number"
                  min={0}
                  max={tipoDesconto === 'percentual' ? 100 : undefined}
                  step={tipoDesconto === 'percentual' ? 1 : 0.01}
                  value={valorDesconto || ''}
                  onChange={(e) => onUpdateDesconto(tipoDesconto, Number(e.target.value))}
                  placeholder={tipoDesconto === 'percentual' ? '0%' : 'R$ 0,00'}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {valorDesconto > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto:</span>
                  <span>- {formatCurrency(valorDescontoCalculado)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Observações */}
      <Card>
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[100px] p-3 border rounded-md bg-background resize-y"
            value={observacoes}
            onChange={(e) => onUpdateObservacoes(e.target.value)}
            placeholder="Adicione observações sobre o orçamento..."
          />
        </CardContent>
      </Card>
    </div>
  )
}
