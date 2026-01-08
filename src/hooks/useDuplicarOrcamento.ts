import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DuplicarOrcamentoParams {
  orcamentoId: string;
  userId: string;
  novoClienteNome?: string;
}

export function useDuplicarOrcamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orcamentoId, userId, novoClienteNome }: DuplicarOrcamentoParams) => {
      // 1. Buscar orçamento original
      const { data: original, error: orcError } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('id', orcamentoId)
        .single();

      if (orcError) throw orcError;

      // 2. Buscar itens do orçamento
      const { data: itens, error: itensError } = await supabase
        .from('cortina_items')
        .select('*')
        .eq('orcamento_id', orcamentoId);

      if (itensError) throw itensError;

      // 3. Criar novo orçamento (código é gerado automaticamente via trigger)
      const { data: novo, error: novoError } = await supabase
        .from('orcamentos')
        .insert({
          cliente_nome: novoClienteNome || original.cliente_nome,
          cliente_telefone: original.cliente_telefone,
          endereco: original.endereco,
          cidade: original.cidade,
          observacoes: original.observacoes,
          margem_tipo: original.margem_tipo,
          margem_percent: original.margem_percent,
          desconto_tipo: original.desconto_tipo,
          desconto_valor: original.desconto_valor,
          validade_dias: original.validade_dias,
          subtotal_materiais: original.subtotal_materiais,
          subtotal_mao_obra_costura: original.subtotal_mao_obra_costura,
          subtotal_instalacao: original.subtotal_instalacao,
          custo_total: original.custo_total,
          total_geral: original.total_geral,
          total_com_desconto: original.total_com_desconto,
          status: 'rascunho',
          created_by_user_id: userId,
          vendedor_id: userId,
          codigo: '', // Trigger gera automaticamente
          contato_id: null, // Não herda vínculo CRM
          custos_gerados: false,
          organization_id: original.organization_id, // Copiar organization_id
        })
        .select()
        .single();

      if (novoError) throw novoError;

      // 4. Copiar itens para novo orçamento
      if (itens && itens.length > 0) {
        const novosItens = itens.map((item) => ({
          orcamento_id: novo.id,
          nome_identificacao: item.nome_identificacao,
          ambiente: item.ambiente,
          largura: item.largura,
          altura: item.altura,
          quantidade: item.quantidade,
          tipo_cortina: item.tipo_cortina,
          tipo_produto: item.tipo_produto,
          tecido_id: item.tecido_id,
          forro_id: item.forro_id,
          trilho_id: item.trilho_id,
          material_principal_id: item.material_principal_id,
          precisa_instalacao: item.precisa_instalacao,
          pontos_instalacao: item.pontos_instalacao,
          motorizada: item.motorizada,
          barra_cm: item.barra_cm,
          barra_forro_cm: item.barra_forro_cm,
          custo_tecido: item.custo_tecido,
          custo_forro: item.custo_forro,
          custo_trilho: item.custo_trilho,
          custo_acessorios: item.custo_acessorios,
          custo_costura: item.custo_costura,
          custo_instalacao: item.custo_instalacao,
          custo_total: item.custo_total,
          preco_unitario: item.preco_unitario,
          preco_venda: item.preco_venda,
          descricao: item.descricao,
          observacoes_internas: item.observacoes_internas,
          fabrica: item.fabrica,
          is_outro: item.is_outro,
          servicos_adicionais_ids: item.servicos_adicionais_ids,
        }));

        const { error: itensInsertError } = await supabase
          .from('cortina_items')
          .insert(novosItens);

        if (itensInsertError) {
          console.error('Erro ao copiar itens:', itensInsertError);
          // Não falhar completamente, avisar o usuário
          toast({
            title: 'Aviso',
            description: 'Orçamento duplicado, mas alguns itens não foram copiados.',
          });
        }
      }

      return novo;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      toast({
        title: 'Orçamento duplicado!',
        description: `Novo código: ${data.codigo}`,
      });
    },
    onError: (error) => {
      console.error('Erro ao duplicar orçamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível duplicar o orçamento',
        variant: 'destructive',
      });
    },
  });
}
