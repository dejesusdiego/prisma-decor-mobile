import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { ProdutoItem } from '@/hooks/useOrcamentoWizard'

interface StepProdutosProps {
  produtos: ProdutoItem[]
  onAdd: (produto: Omit<ProdutoItem, 'id'>) => void
  onUpdate: (id: string, data: Partial<ProdutoItem>) => void
  onRemove: (id: string) => void
  errors?: string[]
}

const TIPOS_PRODUTO = [
  { value: 'cortina', label: 'Cortina' },
  { value: 'persiana', label: 'Persiana' },
  { value: 'toldo', label: 'Toldo' },
  { value: 'acessorio', label: 'Acessório' },
] as const

export function StepProdutos({ produtos, onAdd, onRemove, errors }: StepProdutosProps) {
  const [novoProduto, setNovoProduto] = useState<Omit<ProdutoItem, 'id'>>({
    tipo: 'cortina',
    descricao: '',
    largura: 0,
    altura: 0,
    quantidade: 1,
    valorUnitario: 0,
    valorTotal: 0,
  })

  const calcularTotal = (p: typeof novoProduto) => {
    const area = p.largura * p.altura
    return area * p.quantidade * p.valorUnitario
  }

  const handleAdd = () => {
    if (!novoProduto.descricao) return
    onAdd({
      ...novoProduto,
      valorTotal: calcularTotal(novoProduto),
    })
    setNovoProduto({
      tipo: 'cortina',
      descricao: '',
      largura: 0,
      altura: 0,
      quantidade: 1,
      valorUnitario: 0,
      valorTotal: 0,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Produto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={novoProduto.tipo}
                onValueChange={(v) => setNovoProduto(p => ({ ...p, tipo: v as typeof p.tipo }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PRODUTO.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label>Descrição</Label>
              <Input
                value={novoProduto.descricao}
                onChange={(e) => setNovoProduto(p => ({ ...p, descricao: e.target.value }))}
                placeholder="Ex: Cortina Blackout Quarto"
              />
            </div>

            <div className="space-y-2">
              <Label>Qtd</Label>
              <Input
                type="number"
                min={1}
                value={novoProduto.quantidade}
                onChange={(e) => setNovoProduto(p => ({ ...p, quantidade: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Largura (m)</Label>
              <Input
                type="number"
                step="0.01"
                value={novoProduto.largura}
                onChange={(e) => setNovoProduto(p => ({ ...p, largura: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Altura (m)</Label>
              <Input
                type="number"
                step="0.01"
                value={novoProduto.altura}
                onChange={(e) => setNovoProduto(p => ({ ...p, altura: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Valor Unit. (m²)</Label>
              <Input
                type="number"
                step="0.01"
                value={novoProduto.valorUnitario}
                onChange={(e) => setNovoProduto(p => ({ ...p, valorUnitario: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Total</Label>
              <div className="h-10 flex items-center font-medium">
                {calcularTotal(novoProduto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
          </div>

          <Button onClick={handleAdd} disabled={!novoProduto.descricao}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Produto
          </Button>
        </CardContent>
      </Card>

      {errors && errors.length > 0 && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {errors.map((error, i) => <p key={i}>{error}</p>)}
        </div>
      )}

      {produtos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Produtos Adicionados ({produtos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {produtos.map((produto) => (
                <div
                  key={produto.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{produto.descricao}</span>
                      <span className="text-xs px-2 py-0.5 bg-muted rounded-full capitalize">
                        {produto.tipo}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {produto.largura}m × {produto.altura}m × {produto.quantidade} = {' '}
                      {(produto.largura * produto.altura * produto.quantidade).toFixed(2)}m²
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">
                      {produto.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(produto.id)}
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
    </div>
  )
}
