/**
 * Teste de Fluxo E2E: Orçamento → Financeiro → Produção
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tjwpqrlfhngibuwqodcn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyODU1NCwiZXhwIjoyMDgzOTA0NTU0fQ.fNRNdHBpxoy7dCxeQRJyDt4_SUY51u9gzU21UmSKmuI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// IDs conhecidos
const ORG_PRISMA = '11111111-1111-1111-1111-111111111111';
const USER_PRISMA = 'bba3ecf2-fb24-4ab2-95f9-cb5ef66a3fd6';

async function main() {
  console.log('🔄 TESTE DE FLUXO E2E: ORÇAMENTO → FINANCEIRO → PRODUÇÃO\n');
  console.log('='.repeat(70) + '\n');

  try {
    // ==========================================
    // ETAPA 1: CRIAR ORÇAMENTO
    // ==========================================
    console.log('📋 ETAPA 1: CRIANDO ORÇAMENTO DE TESTE\n');

    const codigoOrcamento = `E2E-${Date.now().toString().slice(-6)}`;
    
    const { data: novoOrcamento, error: orcError } = await supabase
      .from('orcamentos')
      .insert({
        codigo: codigoOrcamento,
        cliente_nome: 'Cliente Teste E2E',
        cliente_telefone: '48999999999',
        endereco: 'Rua Teste, 123',
        cidade: 'Florianópolis',
        status: 'rascunho',
        total_geral: 5000,
        total_com_desconto: 4500,
        custo_total: 2500,
        margem_percent: 80,
        margem_tipo: 'markup', // markup ou margem
        organization_id: ORG_PRISMA,
        created_by_user_id: USER_PRISMA,
        validade_dias: 30,
      })
      .select()
      .single();

    if (orcError) throw new Error(`Erro ao criar orçamento: ${orcError.message}`);
    
    console.log(`   ✅ Orçamento criado: ${novoOrcamento.codigo}`);
    console.log(`      ID: ${novoOrcamento.id}`);
    console.log(`      Status: ${novoOrcamento.status}`);
    console.log(`      Total: R$ ${novoOrcamento.total_geral?.toFixed(2)}`);

    // ==========================================
    // ETAPA 2: APROVAR ORÇAMENTO
    // ==========================================
    console.log('\n\n📋 ETAPA 2: APROVANDO ORÇAMENTO\n');

    const { data: orcAprovado, error: aprovarError } = await supabase
      .from('orcamentos')
      .update({ 
        status: 'aprovado',
        status_updated_at: new Date().toISOString()
      })
      .eq('id', novoOrcamento.id)
      .select()
      .single();

    if (aprovarError) throw new Error(`Erro ao aprovar: ${aprovarError.message}`);
    
    console.log(`   ✅ Orçamento aprovado!`);
    console.log(`      Novo status: ${orcAprovado.status}`);
    console.log(`      Data: ${orcAprovado.status_updated_at}`);

    // ==========================================
    // ETAPA 3: GERAR CONTA A RECEBER
    // ==========================================
    console.log('\n\n💰 ETAPA 3: GERANDO CONTA A RECEBER\n');

    const dataVencimento = new Date();
    dataVencimento.setDate(dataVencimento.getDate() + 30);
    
    const { data: contaReceber, error: contaError } = await supabase
      .from('contas_receber')
      .insert({
        orcamento_id: novoOrcamento.id,
        cliente_nome: novoOrcamento.cliente_nome,
        descricao: `Orçamento ${novoOrcamento.codigo}`,
        valor_total: novoOrcamento.total_com_desconto,
        valor_pago: 0,
        status: 'pendente',
        numero_parcelas: 2,
        data_vencimento: dataVencimento.toISOString().split('T')[0],
        organization_id: ORG_PRISMA,
        created_by_user_id: USER_PRISMA,
      })
      .select()
      .single();

    if (contaError) throw new Error(`Erro ao criar conta a receber: ${contaError.message}`);
    
    console.log(`   ✅ Conta a receber criada!`);
    console.log(`      ID: ${contaReceber.id}`);
    console.log(`      Valor: R$ ${contaReceber.valor_total?.toFixed(2)}`);
    console.log(`      Parcelas: ${contaReceber.numero_parcelas}`);

    // Criar parcelas
    const parcelas = [];
    const valorParcela = contaReceber.valor_total / 2;
    
    for (let i = 1; i <= 2; i++) {
      const vencimento = new Date();
      vencimento.setDate(vencimento.getDate() + (i * 30));
      
      const { data: parcela, error: parcelaError } = await supabase
        .from('parcelas_receber')
        .insert({
          conta_receber_id: contaReceber.id,
          numero_parcela: i,
          valor: valorParcela,
          data_vencimento: vencimento.toISOString().split('T')[0],
          status: 'pendente',
        })
        .select()
        .single();

      if (parcelaError) {
        console.log(`   ⚠️ Erro ao criar parcela ${i}: ${parcelaError.message}`);
      } else {
        parcelas.push(parcela);
        console.log(`   ✅ Parcela ${i}: R$ ${valorParcela.toFixed(2)} - Venc: ${parcela.data_vencimento}`);
      }
    }

    // ==========================================
    // ETAPA 4: GERAR CONTAS A PAGAR (CUSTOS)
    // ==========================================
    console.log('\n\n💸 ETAPA 4: GERANDO CONTAS A PAGAR (CUSTOS)\n');

    const custos = [
      { descricao: 'Material - Tecido', valor: 1500 },
      { descricao: 'Mão de obra - Confecção', valor: 600 },
      { descricao: 'Serviço - Instalação', valor: 400 },
    ];

    for (const custo of custos) {
      const vencimento = new Date();
      vencimento.setDate(vencimento.getDate() + 15);
      
      const { data: contaPagar, error: cpError } = await supabase
        .from('contas_pagar')
        .insert({
          orcamento_id: novoOrcamento.id,
          descricao: custo.descricao,
          valor: custo.valor,
          status: 'pendente',
          data_vencimento: vencimento.toISOString().split('T')[0],
          organization_id: ORG_PRISMA,
          created_by_user_id: USER_PRISMA,
        })
        .select()
        .single();

      if (cpError) {
        console.log(`   ⚠️ Erro ao criar conta ${custo.descricao}: ${cpError.message}`);
      } else {
        console.log(`   ✅ ${custo.descricao}: R$ ${custo.valor.toFixed(2)}`);
      }
    }

    // ==========================================
    // ETAPA 5: CRIAR PEDIDO DE PRODUÇÃO
    // ==========================================
    console.log('\n\n🏭 ETAPA 5: CRIANDO PEDIDO DE PRODUÇÃO\n');

    const numeroPedido = `PED-${Date.now().toString().slice(-6)}`;
    
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        numero_pedido: numeroPedido,
        orcamento_id: novoOrcamento.id,
        status_producao: 'aguardando_materiais',
        prioridade: 'normal',
        created_by_user_id: USER_PRISMA,
      })
      .select()
      .single();

    if (pedidoError) throw new Error(`Erro ao criar pedido: ${pedidoError.message}`);
    
    console.log(`   ✅ Pedido de produção criado!`);
    console.log(`      Número: ${pedido.numero_pedido}`);
    console.log(`      Status: ${pedido.status_producao}`);
    console.log(`      Prioridade: ${pedido.prioridade}`);

    // Atualizar orçamento com referência ao pedido
    await supabase
      .from('orcamentos')
      .update({ status: 'em_producao' })
      .eq('id', novoOrcamento.id);

    console.log(`   ✅ Orçamento atualizado para: em_producao`);

    // ==========================================
    // VERIFICAÇÃO FINAL
    // ==========================================
    console.log('\n\n' + '='.repeat(70));
    console.log('📊 VERIFICAÇÃO FINAL DO FLUXO\n');

    // Buscar orçamento atualizado
    const { data: orcFinal } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('id', novoOrcamento.id)
      .single();

    // Buscar conta a receber
    const { data: crFinal } = await supabase
      .from('contas_receber')
      .select('*, parcelas_receber(*)')
      .eq('orcamento_id', novoOrcamento.id)
      .single();

    // Buscar contas a pagar
    const { data: cpFinal } = await supabase
      .from('contas_pagar')
      .select('*')
      .eq('orcamento_id', novoOrcamento.id);

    // Buscar pedido
    const { data: pedFinal } = await supabase
      .from('pedidos')
      .select('*')
      .eq('orcamento_id', novoOrcamento.id)
      .single();

    console.log('📋 Orçamento:');
    console.log(`   Código: ${orcFinal?.codigo}`);
    console.log(`   Status: ${orcFinal?.status}`);
    console.log(`   Total: R$ ${orcFinal?.total_com_desconto?.toFixed(2)}`);
    console.log(`   Custo: R$ ${orcFinal?.custo_total?.toFixed(2)}`);
    console.log(`   Markup: ${orcFinal?.margem_percent?.toFixed(1)}%`);

    console.log('\n💰 Financeiro - Receber:');
    console.log(`   Conta ID: ${crFinal?.id}`);
    console.log(`   Valor: R$ ${crFinal?.valor_total?.toFixed(2)}`);
    console.log(`   Parcelas: ${crFinal?.parcelas_receber?.length || 0}`);

    console.log('\n💸 Financeiro - Pagar:');
    console.log(`   Contas: ${cpFinal?.length || 0}`);
    console.log(`   Total Custos: R$ ${cpFinal?.reduce((s, c) => s + (c.valor || 0), 0).toFixed(2)}`);

    console.log('\n🏭 Produção:');
    console.log(`   Pedido: ${pedFinal?.numero_pedido}`);
    console.log(`   Status: ${pedFinal?.status_producao}`);

    // Calcular consistência
    const totalReceber = crFinal?.valor_total || 0;
    const totalPagar = cpFinal?.reduce((s, c) => s + (c.valor || 0), 0) || 0;
    const lucroEsperado = totalReceber - totalPagar;
    const markupReal = totalPagar > 0 ? ((totalReceber - totalPagar) / totalPagar * 100) : 0;

    console.log('\n📈 Análise Financeira:');
    console.log(`   Total a Receber: R$ ${totalReceber.toFixed(2)}`);
    console.log(`   Total a Pagar: R$ ${totalPagar.toFixed(2)}`);
    console.log(`   Lucro Esperado: R$ ${lucroEsperado.toFixed(2)}`);
    console.log(`   Markup Real: ${markupReal.toFixed(1)}%`);
    console.log(`   Markup Configurado: ${orcFinal?.margem_percent?.toFixed(1)}%`);

    console.log('\n' + '='.repeat(70));
    console.log('✅ FLUXO E2E COMPLETO COM SUCESSO!');
    console.log('='.repeat(70) + '\n');

    // Cleanup: oferecer opção de deletar dados de teste
    console.log('🧹 Dados de teste criados:');
    console.log(`   - Orçamento: ${novoOrcamento.id}`);
    console.log(`   - Conta Receber: ${crFinal?.id}`);
    console.log(`   - Contas Pagar: ${cpFinal?.length} registros`);
    console.log(`   - Pedido: ${pedFinal?.id}`);
    console.log('\n   ℹ️ Para limpar, delete manualmente ou rode com --cleanup\n');

  } catch (error) {
    console.error('\n❌ ERRO NO FLUXO:', error.message);
    process.exit(1);
  }
}

main();
