import { useNavigate } from 'react-router-dom'
import { Button } from '@core/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@core/components/ui/Card'
import { useOrcamentoWizard, WIZARD_STEPS } from '@modules/org/hooks/useOrcamentoWizard'
import { useCriarOrcamento } from '@modules/org/hooks/useCriarOrcamento'
import { WizardProgress } from '@modules/org/components/wizard/WizardProgress'
import { StepCliente } from '@modules/org/components/wizard/steps/StepCliente'
import { StepProdutos } from '@modules/org/components/wizard/steps/StepProdutos'
import { StepServicos } from '@modules/org/components/wizard/steps/StepServicos'
import { StepResumo } from '@modules/org/components/wizard/steps/StepResumo'
import { useState, useCallback } from 'react'

export function NovoOrcamentoPage() {
  const navigate = useNavigate()
  const { mutate: criarOrcamento, isPending: isSubmitting } = useCriarOrcamento()
  const [stepValid, setStepValid] = useState(true)
  
  const {
    currentStep,
    currentStepId,
    formData,
    errors,
    validateStep,
    nextStep,
    prevStep,
    updateCliente,
    addProduto,
    removeProduto,
    addServico,
    removeServico,
    updateDesconto,
    updateObservacoes,
    resetWizard,
    subtotalProdutos,
    subtotalServicos,
    subtotal,
    valorDesconto,
    total,
  } = useOrcamentoWizard()

  const handleNext = () => {
    const isValid = validateStep(currentStep)
    setStepValid(isValid)
    if (isValid) {
      nextStep()
    }
  }

  const handleSubmit = async () => {
    const isValid = validateStep(currentStep)
    if (!isValid) {
      setStepValid(false)
      return
    }

    criarOrcamento(formData, {
      onSuccess: () => {
        resetWizard()
        navigate('/orcamentos')
      },
    })
  }

  const getStepErrors = useCallback(() => {
    return errors[currentStepId] || []
  }, [errors, currentStepId])

  const renderStep = () => {
    const stepErrors = getStepErrors()
    
    switch (currentStepId) {
      case 'cliente':
        return (
          <StepCliente
            data={formData.cliente}
            onUpdate={updateCliente}
            errors={stepErrors}
          />
        )
      case 'produtos':
        return (
          <StepProdutos
            produtos={formData.produtos}
            onAdd={addProduto}
            onRemove={removeProduto}
            errors={stepErrors}
          />
        )
      case 'servicos':
        return (
          <StepServicos
            servicos={formData.servicos}
            onAdd={addServico}
            onRemove={removeServico}
            tipoDesconto={formData.tipoDesconto}
            valorDesconto={formData.valorDesconto}
            onUpdateDesconto={updateDesconto}
            observacoes={formData.observacoes}
            onUpdateObservacoes={updateObservacoes}
            subtotal={subtotal}
            valorDescontoCalculado={valorDesconto}
            total={total}
          />
        )
      case 'resumo':
        return (
          <StepResumo
            formData={formData}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            subtotalProdutos={subtotalProdutos}
            subtotalServicos={subtotalServicos}
            subtotal={subtotal}
            valorDesconto={valorDesconto}
            total={total}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/orcamentos')}
        >
          ← Voltar
        </Button>
        <h1 className="text-3xl font-bold">Novo Orçamento</h1>
      </div>

      <WizardProgress
        steps={WIZARD_STEPS}
        currentStep={currentStep}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {WIZARD_STEPS[currentStep]?.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          Anterior
        </Button>
        {currentStep < WIZARD_STEPS.length - 1 ? (
          <Button onClick={handleNext}>
            Próximo
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Finalizar Orçamento'}
          </Button>
        )}
      </div>
    </div>
  )
}
