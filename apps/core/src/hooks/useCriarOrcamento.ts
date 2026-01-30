import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { OrcamentoFormData } from './useOrcamentoWizard'

interface CriarOrcamentoResult {
  id: string
  numero: string
}

interface CriarOrcamentoError {
  message: string
}

export function useCriarOrcamento() {
  const queryClient = useQueryClient()

  return useMutation<CriarOrcamentoResult, CriarOrcamentoError, OrcamentoFormData>({
    mutationFn: async (formData): Promise<CriarOrcamentoResult> => {
      // Calcular totais
      const subtotalProdutos = formData.produtos.reduce((sum, p) => sum + p.valorTotal, 0)
      const subtotalServicos = formData.servicos.reduce((sum, s) => sum + s.valor, 0)
      const subtotal = subtotalProdutos + subtotalServicos

      const valorDesconto = formData.tipoDesconto === 'percentual'
        ? subtotal * (formData.valorDesconto / 100)
        : formData.valorDesconto

      const total = subtotal - valorDesconto

      // Gerar número do orçamento (formato: ORC-AAAA-XXXXX)
      const year = new Date().getFullYear()
      const { count } = await supabase
        .from('orcamentos')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${year}-01-01`)

      const sequencia = (count ?? 0) + 1
      const numero = `ORC-${year}-${sequencia.toString().padStart(5, '0')}`

      // Criar orçamento
      const { data, error } = await supabase
        .from('orcamentos')
        .insert({
          numero,
          nome_cliente: formData.cliente.nome,
          telefone_cliente: formData.cliente.telefone,
          email_cliente: formData.cliente.email || null,
          endereco_cliente: formData.cliente.endereco || null,
          cidade_cliente: formData.cliente.cidade || null,
          estado_cliente: formData.cliente.estado || null,
          cep_cliente: formData.cliente.cep || null,
          total_geral: subtotal,
          total_com_desconto: formData.tipoDesconto ? total : null,
          tipo_desconto: formData.tipoDesconto,
          valor_desconto: formData.valorDesconto > 0 ? valorDesconto : null,
          observacoes: formData.observacoes || null,
          prazo_entrega: formData.prazoEntrega,
          status: 'rascunho',
        })
        .select('id, numero')
        .single()

      if (error) {
        throw { message: error.message }
      }

      if (!data) {
        throw { message: 'Erro ao criar orçamento' }
      }

      // Inserir produtos
      if (formData.produtos.length > 0) {
        const produtosToInsert = formData.produtos.map((p) => ({
          orcamento_id: data.id,
          tipo: p.tipo,
          descricao: p.descricao,
          largura: p.largura,
          altura: p.altura,
          quantidade: p.quantidade,
          material: p.material || null,
          cor: p.cor || null,
          acionamento: p.acionamento || null,
          valor_unitario: p.valorUnitario,
          valor_total: p.valorTotal,
        }))

        const { error: produtosError } = await supabase
          .from('orcamento_itens')
          .insert(produtosToInsert)

        if (produtosError) {
          throw { message: `Erro ao salvar produtos: ${produtosError.message}` }
        }
      }

      // Inserir serviços
      if (formData.servicos.length > 0) {
        const servicosToInsert = formData.servicos.map((s) => ({
          orcamento_id: data.id,
          tipo: s.tipo,
          descricao: s.descricao,
          valor: s.valor,
        }))

        const { error: servicosError } = await supabase
          .from('orcamento_servicos')
          .insert(servicosToInsert)

        if (servicosError) {
          throw { message: `Erro ao salvar serviços: ${servicosError.message}` }
        }
      }

      return { id: data.id, numero: data.numero }
    },
    onSuccess: () => {
      // Invalidar queries para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
