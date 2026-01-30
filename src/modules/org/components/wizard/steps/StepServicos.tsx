import { useState } from 'react'
import { Button } from '@core/components/ui/Button'
import { Input } from '@core/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@core/components/ui/Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@core/components/ui/Select'
import { Trash2, Plus, Calculator } from 'lucide-react'
import type { ServicoItem } from '@modules/org/hooks/useOrcamentoWizard'

interface StepServicosProps {
  servicos: ServicoItem[]
  onAdd: (servico: Omit<ServicoItem, 'id'>) => void
  onRemove: (id: string) => void
  tipoDesconto: 'percentual' | 'valor' | null
  valorDesconto: number
  onUpdateDesconto: (tipo: 'percentual' | 'valor' | null, valor: number) => void
  observacoes: string
  onUpdateObservacoes: (observacoes: string) => void
  subtotal: number
  valorDescontoCalculado: number
  total: number
}

const tiposServico = [
  { value: 'instalacao', label: 'Instalação' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'medicao', label: 'Medição' },
]

export function StepServicos({
  servicos,
  onAdd,
  onRemove,
  tipoDesconto,
  valorDesconto,
  onUpdateDesconto,
  observacoes,
  onUpdateObservacoes,
  subtotal,
  valorDescontoCalculado,
  total,
}: StepServicosProps) {
  const [novoServico, setNovoServico] = useState<Partial<ServicoItem>>({
    tipo: 'instalacao',
    descricao: '',
    valor: 0,
  })

  const handleAdd = () => {
    if (!novoServico.descricao || !novoServico.valor) return
    
    onAdd({
      tipo: novoServico.tipo || 'instalacao',
      descricao: novoServico.descricao || '',
      valor: Number(novoServico.valor) || 0,
    })
    
    setNovoServico({
      tipo: 'instalacao',
      descricao: '',
      valor: 0,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Adicionar Serviço
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select
                value={novoServico.tipo}
                onValueChange={(v: string) => setNovoServico({ ...novoServico, tipo: v as ServicoItem['tipo'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposServico.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Descrição</label>
              <Input
                value={novoServico.descricao}
                onChange={(e) => setNovoServico({ ...novoServico, descricao: e.target.value })}
                placeholder="Ex: Instalação de cortinas"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor (R$)</label>
              <Input
                type="number"
                step="0.01"
                value={novoServico.valor || ''}
                onChange={(e) => setNovoServico({ ...novoServico, valor: parseFloat(e.target.value) })}
              />
            </div>
          </div>
          <Button 
            onClick={handleAdd} 
            disabled={!novoServico.descricao || (novoServico.valor || 0) <= 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Serviço
          </Button>
        </CardContent>
      </Card>

      {servicos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Serviços Adicionados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {servicos.map((servico) => (
                <div
                  key={servico.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{servico.descricao}</p>
                    <p className="text-sm text-muted-foreground">
                      {servico.tipo} • R$ {servico.valor.toFixed(2)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(servico.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Desconto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Desconto</label>
              <Select
                value={tipoDesconto || 'none'}
                onValueChange={(v: string) => onUpdateDesconto(
                  v === 'none' ? null : v as 'percentual' | 'valor', 
                  valorDesconto
                )}
              >
                <SelectTrigger>
                  <SelectValue />
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
                <label className="text-sm font-medium">
                  {tipoDesconto === 'percentual' ? 'Percentual' : 'Valor'} do Desconto
                </label>
                <Input
                  type="number"
                  step={tipoDesconto === 'percentual' ? '1' : '0.01'}
                  value={valorDesconto || ''}
                  onChange={(e) => onUpdateDesconto(tipoDesconto, parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo dos Valores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              {tipoDesconto && valorDesconto > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Desconto:</span>
                  <span>- R$ {valorDescontoCalculado.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total:</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[100px] p-3 rounded-md border bg-background"
            placeholder="Adicione observações gerais sobre o orçamento..."
            value={observacoes}
            onChange={(e) => onUpdateObservacoes(e.target.value)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
