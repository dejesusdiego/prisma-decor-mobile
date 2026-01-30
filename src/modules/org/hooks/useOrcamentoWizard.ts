import { useState, useCallback } from 'react'

export interface ClienteData {
  nome: string
  telefone: string
  email: string
  endereco: string
  cidade: string
  estado: string
  cep: string
}

export interface ProdutoItem {
  id: string
  tipo: 'cortina' | 'persiana' | 'toldo' | 'acessorio'
  descricao: string
  largura: number
  altura: number
  quantidade: number
  material?: string
  cor?: string
  acionamento?: string
  valorUnitario: number
  valorTotal: number
}

export interface ServicoItem {
  id: string
  tipo: 'instalacao' | 'manutencao' | 'medicao'
  descricao: string
  valor: number
}

export interface OrcamentoFormData {
  cliente: ClienteData
  produtos: ProdutoItem[]
  servicos: ServicoItem[]
  observacoes: string
  prazoEntrega: number
  tipoDesconto: 'percentual' | 'valor' | null
  valorDesconto: number
}

const initialFormData: OrcamentoFormData = {
  cliente: {
    nome: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
  },
  produtos: [],
  servicos: [],
  observacoes: '',
  prazoEntrega: 15,
  tipoDesconto: null,
  valorDesconto: 0,
}

export const WIZARD_STEPS = [
  { id: 'cliente', label: 'Cliente', description: 'Dados do cliente' },
  { id: 'produtos', label: 'Produtos', description: 'Itens do orçamento' },
  { id: 'servicos', label: 'Serviços', description: 'Instalação e extras' },
  { id: 'resumo', label: 'Resumo', description: 'Revisão e finalização' },
] as const

export type WizardStepId = typeof WIZARD_STEPS[number]['id']

export function useOrcamentoWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<OrcamentoFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const currentStepId = WIZARD_STEPS[currentStep].id

  const validateStep = useCallback((step: number): boolean => {
    const stepId = WIZARD_STEPS[step].id
    const newErrors: string[] = []

    switch (stepId) {
      case 'cliente':
        if (!formData.cliente.nome.trim()) {
          newErrors.push('Nome do cliente é obrigatório')
        }
        if (!formData.cliente.telefone.trim()) {
          newErrors.push('Telefone é obrigatório')
        }
        break

      case 'produtos':
        if (formData.produtos.length === 0) {
          newErrors.push('Adicione pelo menos um produto')
        }
        break

      case 'servicos':
        // Serviços são opcionais
        break

      case 'resumo':
        // Validação final
        if (formData.produtos.length === 0) {
          newErrors.push('Adicione pelo menos um produto')
        }
        break
    }

    setErrors(prev => ({ ...prev, [stepId]: newErrors }))
    return newErrors.length === 0
  }, [formData])

  const nextStep = useCallback(() => {
    if (validateStep(currentStep) && currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
      return true
    }
    return false
  }, [currentStep, validateStep])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      return true
    }
    return false
  }, [currentStep])

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < WIZARD_STEPS.length) {
      setCurrentStep(step)
    }
  }, [])

  const updateCliente = useCallback((data: Partial<ClienteData>) => {
    setFormData(prev => ({
      ...prev,
      cliente: { ...prev.cliente, ...data },
    }))
  }, [])

  const addProduto = useCallback((produto: Omit<ProdutoItem, 'id'>) => {
    const newProduto: ProdutoItem = {
      ...produto,
      id: crypto.randomUUID(),
    }
    setFormData(prev => ({
      ...prev,
      produtos: [...prev.produtos, newProduto],
    }))
  }, [])

  const updateProduto = useCallback((id: string, data: Partial<ProdutoItem>) => {
    setFormData(prev => ({
      ...prev,
      produtos: prev.produtos.map(p =>
        p.id === id ? { ...p, ...data } : p
      ),
    }))
  }, [])

  const removeProduto = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      produtos: prev.produtos.filter(p => p.id !== id),
    }))
  }, [])

  const addServico = useCallback((servico: Omit<ServicoItem, 'id'>) => {
    const newServico: ServicoItem = {
      ...servico,
      id: crypto.randomUUID(),
    }
    setFormData(prev => ({
      ...prev,
      servicos: [...prev.servicos, newServico],
    }))
  }, [])

  const removeServico = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      servicos: prev.servicos.filter(s => s.id !== id),
    }))
  }, [])

  const updateObservacoes = useCallback((observacoes: string) => {
    setFormData(prev => ({ ...prev, observacoes }))
  }, [])

  const updateDesconto = useCallback((tipo: 'percentual' | 'valor' | null, valor: number) => {
    setFormData(prev => ({
      ...prev,
      tipoDesconto: tipo,
      valorDesconto: valor,
    }))
  }, [])

  const resetWizard = useCallback(() => {
    setCurrentStep(0)
    setFormData(initialFormData)
    setErrors({})
  }, [])

  // Cálculos
  const subtotalProdutos = formData.produtos.reduce((sum, p) => sum + p.valorTotal, 0)
  const subtotalServicos = formData.servicos.reduce((sum, s) => sum + s.valor, 0)
  const subtotal = subtotalProdutos + subtotalServicos

  const valorDesconto = formData.tipoDesconto === 'percentual'
    ? subtotal * (formData.valorDesconto / 100)
    : formData.valorDesconto

  const total = subtotal - valorDesconto

  return {
    // State
    currentStep,
    currentStepId,
    formData,
    isSubmitting,
    errors,
    
    // Navigation
    nextStep,
    prevStep,
    goToStep,
    validateStep,
    
    // Actions
    updateCliente,
    addProduto,
    updateProduto,
    removeProduto,
    addServico,
    removeServico,
    updateObservacoes,
    updateDesconto,
    resetWizard,
    setIsSubmitting,
    
    // Calculated values
    subtotalProdutos,
    subtotalServicos,
    subtotal,
    valorDesconto,
    total,
  }
}
