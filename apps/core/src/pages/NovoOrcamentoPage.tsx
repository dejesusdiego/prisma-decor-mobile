import { useNavigate } from 'react-router-dom'
import { useOrcamentoWizard, WIZARD_STEPS } from '@/hooks/useOrcamentoWizard'
import { useCriarOrcamento } from '@/hooks/useCriarOrcamento'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { StepCliente } from '@/components/wizard/steps/StepCliente'
import { StepProdutos } from '@/components/wizard/steps/StepProdutos'
import { StepServicos } from '@/components/wizard/steps/StepServicos'
import { StepResumo } from '@/components/wizard/steps/StepResumo'
import { WizardProgress } from '@/components/wizard/WizardProgress'
import { ArrowLeft, ArrowRight, Save } from 'lucide-react'
import { formatCurrency } from '@/lib/calculations'

export function NovoOrcamentoPage() {
  const navigate = useNavigate()
  const criarOrcamento = useCriarOrcamento()

  const {
    currentStep,
    currentStepId,
    formData,
    isSubmitting,
    errors,
    nextStep,
    prevStep,
    validateStep,
    updateCliente,
    addProduto,
    updateProduto,
    removeProduto,
    addServico,
    removeServico,
    updateObservacoes,
    updateDesconto,
    subtotalProdutos,
    subtotalServicos,
    subtotal,
    valorDesconto,
    total,
    setIsSubmitting,
  } = useOrcamentoWizard()

  const handleNext = () => {
    if (validateStep(currentStep)) {
      nextStep()
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setIsSubmitting(true)
    try {
      await criarOrcamento.mutateAsync(formData)
      navigate('/orcamentos')
    } catch (error) {
      console.error('Erro ao criar orçamento:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStepId) {
      case 'cliente':
        return (
          <StepCliente
            data={formData.cliente}
            onUpdate={updateCliente}
            errors={errors.cliente}
          />
        )
      case 'produtos':
        return (
          <StepProdutos
            produtos={formData.produtos}
            onAdd={addProduto}
            onUpdate={updateProduto}
            onRemove={removeProduto}
            errors={errors.produtos}
          />
        )
      case 'servicos':
        return (
          <StepServicos
            servicos={formData.servicos}
            onAdd={addServico}
            onRemove={removeServico}
            observacoes={formData.observacoes}
            onUpdateObservacoes={updateObservacoes}
            tipoDesconto={formData.tipoDesconto}
            valorDesconto={formData.valorDesconto}
            onUpdateDesconto={updateDesconto}
            subtotal={subtotal}
            valorDescontoCalculado={valorDesconto}
            total={total}
          />
        )
      case 'resumo':
        return (
          <StepResumo
            formData={formData}
            subtotalProdutos={subtotalProdutos}
            subtotalServicos={subtotalServicos}
            subtotal={subtotal}
            valorDesconto={valorDesconto}
            total={total}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/orcamentos')}
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Novo Orçamento</h1>
          <p className="text-muted-foreground">
            Total: {formatCurrency(total)}
          </p>
        </div>
      </div>

      {/* Progress */}
      <WizardProgress
        steps={WIZARD_STEPS}
        currentStep={currentStep}
      />

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0 || isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>

        {currentStep < WIZARD_STEPS.length - 1 ? (
          <Button onClick={handleNext}>
            Próximo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || criarOrcamento.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            {criarOrcamento.isPending ? 'Salvando...' : 'Finalizar Orçamento'}
          </Button>
        )}
      </div>

      {/* Error Display */}
      {criarOrcamento.error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {criarOrcamento.error.message}
        </div>
      )}
    </div>
  )
}
