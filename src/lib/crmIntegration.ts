import { supabase } from '@/integrations/supabase/client';

/**
 * Registra atividade de pagamento no CRM
 */
export async function registrarAtividadePagamento({
  contatoId,
  orcamentoId,
  orcamentoCodigo,
  clienteNome,
  valor,
  numeroParcela,
  totalParcelas,
  percentualPago,
  userId,
  organizationId,
}: {
  contatoId: string | null;
  orcamentoId: string;
  orcamentoCodigo: string;
  clienteNome: string;
  valor: number;
  numeroParcela: number;
  totalParcelas: number;
  percentualPago: number;
  userId: string;
  organizationId?: string;
}) {
  if (!contatoId) {
    // Se não tem contato vinculado, tentar encontrar pelo orçamento
    const { data: orcamento } = await supabase
      .from('orcamentos')
      .select('contato_id')
      .eq('id', orcamentoId)
      .single();
    
    contatoId = orcamento?.contato_id ?? null;
  }

  // Se ainda não tem contato, não criar atividade
  if (!contatoId) {
    console.log('Atividade de pagamento não criada: contato não encontrado');
    return null;
  }

  // Determinar tipo de atividade baseado no pagamento
  const isPagamentoTotal = percentualPago >= 100;
  const isPagamento60 = percentualPago >= 60 && percentualPago < 100;
  const isPagamento40 = percentualPago >= 40 && percentualPago < 60;

  let titulo = `Pagamento recebido - ${orcamentoCodigo}`;
  let descricao = `Parcela ${numeroParcela}/${totalParcelas} no valor de R$ ${valor.toFixed(2).replace('.', ',')} recebida.`;

  if (isPagamentoTotal) {
    titulo = `💰 Pagamento TOTAL - ${orcamentoCodigo}`;
    descricao = `${clienteNome} realizou o pagamento total do orçamento. Valor recebido: R$ ${valor.toFixed(2).replace('.', ',')}. Pedido liberado para produção e instalação!`;
  } else if (isPagamento60) {
    titulo = `📊 60% Pago - ${orcamentoCodigo}`;
    descricao = `Parcela ${numeroParcela}/${totalParcelas} (R$ ${valor.toFixed(2).replace('.', ',')}) recebida. Total pago: ${percentualPago.toFixed(0)}%. Instalação liberada!`;
  } else if (isPagamento40) {
    titulo = `📊 40% Pago - ${orcamentoCodigo}`;
    descricao = `Parcela ${numeroParcela}/${totalParcelas} (R$ ${valor.toFixed(2).replace('.', ',')}) recebida. Total pago: ${percentualPago.toFixed(0)}%. Materiais liberados!`;
  } else {
    descricao = `Parcela ${numeroParcela}/${totalParcelas} (R$ ${valor.toFixed(2).replace('.', ',')}) recebida. Total pago: ${percentualPago.toFixed(0)}% do orçamento.`;
  }

  const { data, error } = await supabase
    .from('atividades_crm')
    .insert({
      contato_id: contatoId,
      orcamento_id: orcamentoId,
      tipo: 'pagamento',
      titulo,
      descricao,
      concluida: true,
      data_atividade: new Date().toISOString(),
      created_by_user_id: userId,
      organization_id: organizationId || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao registrar atividade de pagamento no CRM:', error);
    return null;
  }

  // Atualizar ultima_interacao_em do contato
  await supabase
    .from('contatos')
    .update({ ultima_interacao_em: new Date().toISOString() })
    .eq('id', contatoId);

  return data;
}

/**
 * Busca o contato vinculado a um orçamento
 */
export async function buscarContatoDoOrcamento(orcamentoId: string): Promise<string | null> {
  const { data } = await supabase
    .from('orcamentos')
    .select('contato_id')
    .eq('id', orcamentoId)
    .single();

  return data?.contato_id ?? null;
}

/**
 * Registra atividade genérica no CRM
 */
export async function registrarAtividadeCRM({
  contatoId,
  tipo,
  titulo,
  descricao,
  userId,
  orcamentoId,
  concluida = false,
  dataLembrete,
  organizationId,
}: {
  contatoId: string;
  tipo: string;
  titulo: string;
  descricao?: string;
  userId: string;
  orcamentoId?: string;
  concluida?: boolean;
  dataLembrete?: Date;
  organizationId?: string;
}) {
  const { data, error } = await supabase
    .from('atividades_crm')
    .insert({
      contato_id: contatoId,
      orcamento_id: orcamentoId,
      tipo,
      titulo,
      descricao,
      concluida,
      data_atividade: new Date().toISOString(),
      data_lembrete: dataLembrete?.toISOString(),
      created_by_user_id: userId,
      organization_id: organizationId || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao registrar atividade no CRM:', error);
    return null;
  }

  // Atualizar ultima_interacao_em do contato
  await supabase
    .from('contatos')
    .update({ ultima_interacao_em: new Date().toISOString() })
    .eq('id', contatoId);

  return data;
}
