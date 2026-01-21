/**
 * Script para criar pedidos a partir de orçamentos pagos
 * Isso simula o trigger que cria pedidos automaticamente quando orçamento atinge 40%+
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://tjwpqrlfhngibuwqodcn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyODU1NCwiZXhwIjoyMDgzOTA0NTU0fQ.fNRNdHBpxoy7dCxeQRJyDt4_SUY51u9gzU21UmSKmuI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function gerarNumeroPedido() {
  const ano = new Date().getFullYear();
  
  // Buscar último número do ano
  const { data: ultimoPedido } = await supabase
    .from('pedidos')
    .select('numero_pedido')
    .like('numero_pedido', `PED-${ano}-%`)
    .order('numero_pedido', { ascending: false })
    .limit(1);
  
  let sequencia = 1;
  if (ultimoPedido && ultimoPedido.length > 0) {
    const match = ultimoPedido[0].numero_pedido.match(/PED-\d{4}-(\d+)/);
    if (match) {
      sequencia = parseInt(match[1]) + 1;
    }
  }
  
  return `PED-${ano}-${sequencia.toString().padStart(4, '0')}`;
}

async function criarPedidosDeOrcamentos() {
  console.log('🔍 Buscando orçamentos com status de pagamento...\n');

  // Buscar orçamentos com status de pagamento que ainda não têm pedido
  const { data: orcamentos, error: errorOrcamentos } = await supabase
    .from('orcamentos')
    .select('id, codigo, status, cliente_nome, total_com_desconto, total_geral, created_by_user_id, organization_id')
    .in('status', ['pago_40', 'pago_parcial', 'pago_60', 'pago']);

  if (errorOrcamentos) {
    console.error('❌ Erro ao buscar orçamentos:', errorOrcamentos.message);
    return;
  }

  console.log(`📊 Encontrados ${orcamentos?.length || 0} orçamentos com status de pagamento\n`);

  if (!orcamentos || orcamentos.length === 0) {
    console.log('⚠️  Nenhum orçamento com status de pagamento encontrado');
    return;
  }

  // Verificar quais já têm pedido
  const orcamentoIds = orcamentos.map(o => o.id);
  const { data: pedidosExistentes } = await supabase
    .from('pedidos')
    .select('orcamento_id')
    .in('orcamento_id', orcamentoIds);

  const orcamentosComPedido = new Set(pedidosExistentes?.map(p => p.orcamento_id) || []);
  const orcamentosSemPedido = orcamentos.filter(o => !orcamentosComPedido.has(o.id));

  console.log(`✅ Orçamentos que já têm pedido: ${orcamentosComPedido.size}`);
  console.log(`📝 Orçamentos que precisam de pedido: ${orcamentosSemPedido.length}\n`);

  if (orcamentosSemPedido.length === 0) {
    console.log('✨ Todos os orçamentos já têm pedidos criados!');
    return;
  }

  let criados = 0;
  let erros = 0;

  for (const orcamento of orcamentosSemPedido) {
    try {
      // Verificar se tem cortinas/itens
      const { data: cortinas } = await supabase
        .from('cortina_items')
        .select('id')
        .eq('orcamento_id', orcamento.id)
        .limit(1);

      if (!cortinas || cortinas.length === 0) {
        console.log(`⚠️  Orçamento ${orcamento.codigo} ignorado: sem itens/cortinas`);
        continue;
      }

      // Gerar número do pedido
      const numeroPedido = await gerarNumeroPedido();

      // Determinar prioridade
      let prioridade = 'normal';
      if (orcamento.status === 'pago') {
        prioridade = 'alta';
      } else if (orcamento.status === 'pago_60') {
        prioridade = 'normal';
      }

      // Calcular previsão de entrega (15 dias padrão)
      const previsaoEntrega = new Date();
      previsaoEntrega.setDate(previsaoEntrega.getDate() + 15);

      // Criar pedido
      const { data: pedido, error: errorPedido } = await supabase
        .from('pedidos')
        .insert({
          orcamento_id: orcamento.id,
          numero_pedido: numeroPedido,
          status_producao: 'aguardando_materiais',
          prioridade: prioridade,
          previsao_entrega: previsaoEntrega.toISOString().split('T')[0],
          data_prevista: previsaoEntrega.toISOString(),
          observacoes_producao: `Pedido criado automaticamente a partir do orçamento ${orcamento.codigo} (status: ${orcamento.status}). Previsão: ${previsaoEntrega.toISOString().split('T')[0]}`,
          observacoes: `Pedido criado automaticamente a partir do orçamento ${orcamento.codigo}`,
          created_by_user_id: orcamento.created_by_user_id,
          organization_id: orcamento.organization_id,
        })
        .select('id')
        .single();

      if (errorPedido) {
        console.error(`❌ Erro ao criar pedido para ${orcamento.codigo}:`, errorPedido.message);
        erros++;
        continue;
      }

      // Criar itens do pedido
      const { data: todasCortinas } = await supabase
        .from('cortina_items')
        .select('id')
        .eq('orcamento_id', orcamento.id);

      if (todasCortinas && todasCortinas.length > 0) {
        const itensPedido = todasCortinas.map(cortina => ({
          pedido_id: pedido.id,
          cortina_item_id: cortina.id,
          status_item: 'fila',
        }));

        const { error: errorItens } = await supabase
          .from('itens_pedido')
          .insert(itensPedido);

        if (errorItens) {
          console.error(`⚠️  Erro ao criar itens do pedido ${numeroPedido}:`, errorItens.message);
        }
      }

      // Registrar no histórico
      const { error: errorHistorico } = await supabase
        .from('historico_producao')
        .insert({
          pedido_id: pedido.id,
          tipo_evento: 'criacao',
          status_novo: 'aguardando_materiais',
          descricao: `Pedido criado automaticamente a partir do orçamento ${orcamento.codigo} (status: ${orcamento.status}). Previsão: ${previsaoEntrega.toISOString().split('T')[0]}`,
          usuario_id: orcamento.created_by_user_id,
          usuario_nome: orcamento.cliente_nome || 'Sistema',
        });

      if (errorHistorico) {
        console.error(`⚠️  Erro ao criar histórico para pedido ${numeroPedido}:`, errorHistorico.message);
      }

      criados++;
      console.log(`✅ Pedido ${numeroPedido} criado para orçamento ${orcamento.codigo}`);
    } catch (error) {
      console.error(`❌ Erro ao processar orçamento ${orcamento.codigo}:`, error.message);
      erros++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO');
  console.log('='.repeat(60));
  console.log(`✅ Pedidos criados: ${criados}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`📦 Total processado: ${orcamentosSemPedido.length}`);
  console.log('='.repeat(60));

  if (criados > 0) {
    console.log('\n✨ Agora você pode importar o histórico de produção!');
    console.log('   Execute: node scripts/importar-historico-producao.mjs');
  }
}

criarPedidosDeOrcamentos().catch(console.error);
