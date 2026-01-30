import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { FileText, User, Package, Wrench, CheckCircle, Loader2 } from 'lucide-react'
import type { OrcamentoFormData } from '@/hooks/useOrcamentoWizard'
import { formatCurrency } from '@/lib/calculations'

interface StepResumoProps {
  formData: OrcamentoFormData
  subtotalProdutos: number
  subtotalServicos: number
  subtotal: number
  valorDesconto: number
  total: number
  isSubmitting: boolean
  onSubmit: () => void
}

export function StepResumo({
  formData,
  subtotalProdutos,
  subtotalServicos,
  subtotal,
  valorDesconto,
  total,
  isSubmitting,
  onSubmit,
}: StepResumoProps) {
  return (
    <div className="space-y-6">
      {/* Alerta de Revisão */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 text-blue-700 rounded-lg">
        <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium">Revise as informações antes de finalizar</p>
          <p className="text-sm text-blue-600">
            Após finalizar, o orçamento será salvo como rascunho e você poderá enviá-lo ao cliente.
          </p>
        </div>
      </div>

      {/* Dados do Cliente */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Dados do Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="font-medium">{formData.cliente.nome}</p>
          <p className="text-sm text-muted-foreground">{formData.cliente.telefone}</p>
          {formData.cliente.email && (
            <p className="text-sm text-muted-foreground">{formData.cliente.email}</p>
          )}
          {(formData.cliente.endereco || formData.cliente.cidade) && (
            <p className="text-sm text-muted-foreground">
              {[formData.cliente.endereco, formData.cliente.cidade, formData.cliente.estado]
                .filter(Boolean)
                .join(', ')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Produtos */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Produtos ({formData.produtos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {formData.produtos.map((produto, index) => (
              <div key={produto.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{index + 1}. {produto.descricao}</span>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {produto.tipo}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {produto.largura}m × {produto.altura}m × {produto.quantidade} und
                  </p>
                </div>
                <span className="font-medium">{formatCurrency(produto.valorTotal)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 pt-4 border-t">
            <span className="text-muted-foreground">Subtotal Produtos:</span>
            <span className="font-medium">{formatCurrency(subtotalProdutos)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Serviços */}
      {formData.servicos.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Wrench className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Serviços ({formData.servicos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formData.servicos.map((servico) => (
                <div key={servico.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{servico.descricao}</span>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {servico.tipo}
                      </Badge>
                    </div>
                  </div>
                  <span className="font-medium">{formatCurrency(servico.valor)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 pt-4 border-t">
              <span className="text-muted-foreground">Subtotal Serviços:</span>
              <span className="font-medium">{formatCurrency(subtotalServicos)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observações */}
      {formData.observacoes && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{formData.observacoes}</p>
          </CardContent>
        </Card>
      )}

      {/* Resumo Final */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {valorDesconto > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>
                  Desconto {formData.tipoDesconto === 'percentual' ? `(${formData.valorDesconto}%)` : ''}:
                </span>
                <span>- {formatCurrency(valorDesconto)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-primary/20">
              <span>Total do Orçamento:</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
            <p className="text-sm text-muted-foreground pt-2">
              Prazo de entrega: {formData.prazoEntrega} dias úteis
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Botão Finalizar */}
      <Button
        size="lg"
        className="w-full"
        onClick={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Criando Orçamento...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-5 w-5" />
            Finalizar Orçamento
          </>
        )}
      </Button>
    </div>
  )
}
