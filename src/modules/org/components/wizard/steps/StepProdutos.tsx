import { useState } from 'react'
import { Button } from '@core/components/ui/Button'
import { Input } from '@core/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@core/components/ui/Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@core/components/ui/Select'
import { Trash2, Plus } from 'lucide-react'
import type { ProdutoItem } from '@modules/org/hooks/useOrcamentoWizard'

interface StepProdutosProps {
  produtos: ProdutoItem[]
  onAdd: (produto: Omit<ProdutoItem, 'id'>) => void
  onRemove: (id: string) => void
  onUpdate?: (id: string, data: Partial<ProdutoItem>) => void
  errors?: string[]
}

const tiposProduto = [
  { value: 'cortina', label: 'Cortina' },
  { value: 'persiana', label: 'Persiana' },
  { value: 'toldo', label: 'Toldo' },
  { value: 'acessorio', label: 'Acessório' },
]

export function StepProdutos({ produtos, onAdd, onRemove, onUpdate, errors }: StepProdutosProps) {
  const [novoProduto, setNovoProduto] = useState<Partial<ProdutoItem>>({
    tipo: 'cortina',
    descricao: '',
    largura: 0,
    altura: 0,
    quantidade: 1,
    valorUnitario: 0,
  })

  const calcularTotal = (p: Partial<ProdutoItem>) => {
    const largura = p.largura || 0
    const altura = p.altura || 0
    const qtd = p.quantidade || 1
    const unitario = p.valorUnitario || 0
    return largura * altura * qtd * unitario
  }

  const handleAdd = () => {
    if (!novoProduto.descricao) return
    
    const produto = {
      tipo: novoProduto.tipo || 'cortina',
      descricao: novoProduto.descricao || '',
      largura: Number(novoProduto.largura) || 0,
      altura: Number(novoProduto.altura) || 0,
      quantidade: Number(novoProduto.quantidade) || 1,
      material: novoProduto.material || '',
      cor: novoProduto.cor || '',
      acionamento: novoProduto.acionamento || '',
      valorUnitario: Number(novoProduto.valorUnitario) || 0,
      valorTotal: calcularTotal(novoProduto),
    }
    
    onAdd(produto)
    setNovoProduto({
      tipo: 'cortina',
      descricao: '',
      largura: 0,
      altura: 0,
      quantidade: 1,
      valorUnitario: 0,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Adicionar Produto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select
                value={novoProduto.tipo}
                onValueChange={(v: string) => setNovoProduto({ ...novoProduto, tipo: v as ProdutoItem['tipo'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposProduto.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium">Descrição</label>
              <Input
                value={novoProduto.descricao}
                onChange={(e) => setNovoProduto({ ...novoProduto, descricao: e.target.value })}
                placeholder="Ex: Cortina Rolô Blackout"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Material</label>
              <Input
                value={novoProduto.material || ''}
                onChange={(e) => setNovoProduto({ ...novoProduto, material: e.target.value })}
                placeholder="Ex: Blackout"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cor</label>
              <Input
                value={novoProduto.cor || ''}
                onChange={(e) => setNovoProduto({ ...novoProduto, cor: e.target.value })}
                placeholder="Ex: Branco"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Acionamento</label>
              <Input
                value={novoProduto.acionamento || ''}
                onChange={(e) => setNovoProduto({ ...novoProduto, acionamento: e.target.value })}
                placeholder="Ex: Corrente"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Largura (m)</label>
              <Input
                type="number"
                step="0.01"
                value={novoProduto.largura || ''}
                onChange={(e) => setNovoProduto({ ...novoProduto, largura: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Altura (m)</label>
              <Input
                type="number"
                step="0.01"
                value={novoProduto.altura || ''}
                onChange={(e) => setNovoProduto({ ...novoProduto, altura: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Qtd</label>
              <Input
                type="number"
                min={1}
                value={novoProduto.quantidade || ''}
                onChange={(e) => setNovoProduto({ ...novoProduto, quantidade: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor Unit. (R$)</label>
              <Input
                type="number"
                step="0.01"
                value={novoProduto.valorUnitario || ''}
                onChange={(e) => setNovoProduto({ ...novoProduto, valorUnitario: parseFloat(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex justify-between items-center pt-2">
            <p className="text-sm text-muted-foreground">
              Total: R$ {calcularTotal(novoProduto).toFixed(2)}
            </p>
            <Button onClick={handleAdd} disabled={!novoProduto.descricao}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {produtos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Produtos Adicionados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {produtos.map((produto) => (
                <div
                  key={produto.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{produto.descricao}</p>
                    <p className="text-sm text-muted-foreground">
                      {produto.tipo} • {produto.largura}m × {produto.altura}m • 
                      Qtd: {produto.quantidade} • R$ {produto.valorTotal.toFixed(2)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(produto.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {errors && errors.length > 0 && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {errors.map((error, idx) => (
            <p key={idx}>{error}</p>
          ))}
        </div>
      )}
    </div>
  )
}
