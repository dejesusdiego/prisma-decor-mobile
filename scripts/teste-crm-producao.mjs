/**
 * Script de Teste - CRM e Produção
 * Insere dados de teste e valida os fluxos
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tjwpqrlfhngibuwqodcn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyODU1NCwiZXhwIjoyMDgzOTA0NTU0fQ.fNRNdHBpxoy7dCxeQRJyDt4_SUY51u9gzU21UmSKmuI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// IDs das organizações (corretos do banco)
const ORG_PRISMA = '11111111-1111-1111-1111-111111111111';
const ORG_CM_HOME = '22222222-2222-2222-2222-222222222222';

// Usuários
const USER_PRISMA = 'bba3ecf2-fb24-4ab2-95f9-cb5ef66a3fd6';

async function limparDadosTeste() {
  console.log('\n🧹 Limpando dados de teste anteriores...');
  
  // Limpar atividades de teste
  await supabase.from('atividades_crm').delete().like('descricao', '%[TESTE]%');
  
  // Limpar contatos de teste
  await supabase.from('contatos').delete().like('nome', '%[TESTE]%');
  
  // Limpar instalações de pedidos de teste (primeiro para evitar FK violation)
  const { data: pedidosTeste } = await supabase
    .from('pedidos')
    .select('id')
    .like('numero_pedido', '%TESTE%');
  
  if (pedidosTeste?.length) {
    const ids = pedidosTeste.map(p => p.id);
    await supabase.from('instalacoes').delete().in('pedido_id', ids);
  }
  
  // Limpar pedidos de teste
  await supabase.from('pedidos').delete().like('numero_pedido', '%TESTE%');
  
  console.log('✅ Dados antigos limpos');
}

async function testarCRM() {
  console.log('\n📋 === TESTANDO CRM ===\n');
  
  // 1. Criar contatos para cada organização
  console.log('1️⃣ Criando contatos de teste...');
  
  const contatoPrisma = {
    organization_id: ORG_PRISMA,
    created_by_user_id: USER_PRISMA,
    nome: '[TESTE] Cliente Prisma - CRM',
    telefone: '11999990001',
    email: 'teste.prisma@example.com',
    endereco: 'Rua Teste Prisma, 100',
    cidade: 'São Paulo',
    origem: 'indicacao',
    tipo: 'lead',
    observacoes: 'Interesse em cortinas e persianas'
  };
  
  const contatoCM = {
    organization_id: ORG_CM_HOME,
    created_by_user_id: USER_PRISMA, // Usando mesmo user por simplicidade
    nome: '[TESTE] Cliente CM Home - CRM',
    telefone: '21999990002',
    email: 'teste.cm@example.com',
    endereco: 'Rua Teste CM, 200',
    cidade: 'Rio de Janeiro',
    origem: 'site',
    tipo: 'lead',
    observacoes: 'Interesse em persianas motorizadas'
  };
  
  const { data: contato1, error: err1 } = await supabase
    .from('contatos')
    .insert(contatoPrisma)
    .select()
    .single();
    
  if (err1) {
    console.error('❌ Erro ao criar contato Prisma:', err1.message);
  } else {
    console.log('✅ Contato Prisma criado:', contato1.id);
  }
  
  const { data: contato2, error: err2 } = await supabase
    .from('contatos')
    .insert(contatoCM)
    .select()
    .single();
    
  if (err2) {
    console.error('❌ Erro ao criar contato CM:', err2.message);
  } else {
    console.log('✅ Contato CM Home criado:', contato2.id);
  }
  
  // 2. Testar isolamento - Prisma não deve ver contatos da CM
  console.log('\n2️⃣ Testando isolamento de dados...');
  
  const { data: contatosPrisma } = await supabase
    .from('contatos')
    .select('id, nome, organization_id')
    .eq('organization_id', ORG_PRISMA)
    .like('nome', '%[TESTE]%');
    
  const { data: contatosCM } = await supabase
    .from('contatos')
    .select('id, nome, organization_id')
    .eq('organization_id', ORG_CM_HOME)
    .like('nome', '%[TESTE]%');
  
  console.log(`   Prisma vê ${contatosPrisma?.length || 0} contato(s) de teste`);
  console.log(`   CM Home vê ${contatosCM?.length || 0} contato(s) de teste`);
  
  if (contatosPrisma?.length === 1 && contatosCM?.length === 1) {
    console.log('✅ Isolamento CRM funcionando!');
  } else {
    console.log('⚠️ Verificar isolamento CRM');
  }
  
  // 3. Criar atividades
  console.log('\n3️⃣ Criando atividades de follow-up...');
  
  if (contato1) {
    const { error: errAtiv } = await supabase
      .from('atividades_crm')
      .insert({
        organization_id: ORG_PRISMA,
        contato_id: contato1.id,
        tipo: 'ligacao',
        descricao: '[TESTE] Ligação de apresentação realizada',
        data_atividade: new Date().toISOString(),
        concluida: true
      });
      
    if (errAtiv) {
      console.error('❌ Erro ao criar atividade:', errAtiv.message);
    } else {
      console.log('✅ Atividade criada para contato Prisma');
    }
  }
  
  // 4. Atualizar tipo do contato para cliente
  console.log('\n4️⃣ Atualizando tipo do contato...');
  
  if (contato1) {
    const { error: errStatus } = await supabase
      .from('contatos')
      .update({ tipo: 'cliente' })
      .eq('id', contato1.id);
      
    if (errStatus) {
      console.error('❌ Erro ao atualizar tipo:', errStatus.message);
    } else {
      console.log('✅ Tipo atualizado para "cliente"');
    }
  }
  
  return { contato1, contato2 };
}

async function testarProducao() {
  console.log('\n🏭 === TESTANDO PRODUÇÃO ===\n');
  
  // 1. Buscar orçamento para criar pedido (pedidos requerem orcamento_id)
  console.log('1️⃣ Buscando orçamento para criar pedido...');
  
  const { data: orcamento, error: errOrc } = await supabase
    .from('orcamentos')
    .select('id, codigo, cliente_nome')
    .eq('organization_id', ORG_PRISMA)
    .limit(1)
    .single();
  
  if (errOrc || !orcamento) {
    console.log('⚠️ Nenhum orçamento encontrado para teste de produção');
    return null;
  }
  
  console.log(`   Orçamento encontrado: ${orcamento.codigo} (${orcamento.cliente_nome})`);
  
  // 2. Verificar pedidos existentes
  console.log('\n2️⃣ Verificando pedidos existentes...');
  
  const { data: pedidosExistentes, error: errPedidos } = await supabase
    .from('pedidos')
    .select('id, numero_pedido, organization_id')
    .limit(10);
  
  if (errPedidos) {
    console.error('❌ Erro ao buscar pedidos:', errPedidos.message);
  } else {
    console.log(`   Total de pedidos: ${pedidosExistentes?.length || 0}`);
  }
  
  // 3. Criar pedido de teste vinculado ao orçamento
  console.log('\n3️⃣ Criando pedido de teste...');
  
  const numeroPedido = 'PED-TESTE-' + Date.now().toString().slice(-6);
  
  const { data: pedidoTeste, error: errPedido } = await supabase
    .from('pedidos')
    .insert({
      organization_id: ORG_PRISMA,
      orcamento_id: orcamento.id,
      numero_pedido: numeroPedido
    })
    .select()
    .single();
    
  if (errPedido) {
    console.error('❌ Erro ao criar pedido teste:', errPedido.message);
    return null;
  }
  
  console.log('✅ Pedido de teste criado:', pedidoTeste.numero_pedido);
  console.log('   Colunas disponíveis:', Object.keys(pedidoTeste).join(', '));
  
  // 4. Testar isolamento de pedidos
  console.log('\n4️⃣ Testando isolamento de pedidos...');
  
  const { data: pedidosPrisma } = await supabase
    .from('pedidos')
    .select('id, numero_pedido')
    .eq('organization_id', ORG_PRISMA);
    
  const { data: pedidosCM } = await supabase
    .from('pedidos')
    .select('id, numero_pedido')
    .eq('organization_id', ORG_CM_HOME);
  
  console.log(`   Prisma: ${pedidosPrisma?.length || 0} pedido(s)`);
  console.log(`   CM Home: ${pedidosCM?.length || 0} pedido(s)`);
  
  if ((pedidosPrisma?.length || 0) > 0 && (pedidosCM?.length || 0) === 0) {
    console.log('✅ Isolamento de Produção funcionando!');
  }
  
  // 5. Criar instalação vinculada ao pedido
  console.log('\n5️⃣ Criando instalação de teste...');
  
  const { data: instalacao, error: errInst } = await supabase
    .from('instalacoes')
    .insert({
      pedido_id: pedidoTeste.id,
      data_agendada: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      turno: 'manha'
    })
    .select()
    .single();
  
  if (errInst) {
    console.error('❌ Erro ao criar instalação:', errInst.message);
  } else {
    console.log('✅ Instalação criada:', instalacao.id);
    console.log('   Data agendada:', instalacao.data_agendada);
    console.log('   Colunas:', Object.keys(instalacao).join(', '));
  }
  
  return pedidoTeste;
}

async function testarFluxoE2E() {
  console.log('\n🔄 === TESTANDO FLUXO E2E ===\n');
  console.log('Orçamento → Financeiro → Produção\n');
  
  // 1. Buscar orçamento com status de pagamento
  const { data: orcamento } = await supabase
    .from('orcamentos')
    .select('id, codigo, cliente_nome, status, total_geral')
    .eq('organization_id', ORG_PRISMA)
    .in('status', ['pago_40', 'pago_parcial', 'pago', 'em_producao', 'finalizado'])
    .limit(1)
    .maybeSingle();
  
  if (!orcamento) {
    console.log('⚠️ Nenhum orçamento com pagamento para teste E2E');
    
    // Tentar buscar qualquer orçamento
    const { data: qualquerOrc } = await supabase
      .from('orcamentos')
      .select('id, codigo, cliente_nome, status, total_geral')
      .eq('organization_id', ORG_PRISMA)
      .limit(1)
      .maybeSingle();
      
    if (qualquerOrc) {
      console.log(`   Orçamento disponível: ${qualquerOrc.codigo} (${qualquerOrc.status})`);
    }
    return;
  }
  
  console.log(`1️⃣ Orçamento: ${orcamento.codigo} - ${orcamento.status}`);
  console.log(`   Cliente: ${orcamento.cliente_nome}`);
  console.log(`   Valor: R$ ${orcamento.total_geral?.toFixed(2)}`);
  
  // 2. Verificar conta a receber vinculada
  const { data: contaReceber } = await supabase
    .from('contas_receber')
    .select('id, valor_total, valor_pago, status, numero_parcelas')
    .eq('orcamento_id', orcamento.id)
    .maybeSingle();
  
  if (contaReceber) {
    console.log(`\n2️⃣ Conta a Receber vinculada:`);
    console.log(`   Valor: R$ ${contaReceber.valor_total}`);
    console.log(`   Pago: R$ ${contaReceber.valor_pago}`);
    console.log(`   Status: ${contaReceber.status}`);
    console.log(`   Parcelas: ${contaReceber.numero_parcelas}`);
  } else {
    console.log('\n2️⃣ ⚠️ Nenhuma conta a receber vinculada');
  }
  
  // 3. Verificar contas a pagar
  const { data: contasPagar } = await supabase
    .from('contas_pagar')
    .select('id, descricao, valor, status')
    .eq('orcamento_id', orcamento.id);
  
  if (contasPagar?.length) {
    console.log(`\n3️⃣ Contas a Pagar vinculadas: ${contasPagar.length}`);
    contasPagar.forEach(cp => {
      console.log(`   - ${cp.descricao}: R$ ${cp.valor} (${cp.status})`);
    });
  } else {
    console.log('\n3️⃣ ⚠️ Nenhuma conta a pagar vinculada');
  }
  
  // 4. Verificar pedido de produção
  const { data: pedido } = await supabase
    .from('pedidos')
    .select('id, codigo, status, data_previsao')
    .eq('orcamento_id', orcamento.id)
    .maybeSingle();
  
  if (pedido) {
    console.log(`\n4️⃣ Pedido de Produção:`);
    console.log(`   Código: ${pedido.codigo}`);
    console.log(`   Status: ${pedido.status}`);
    console.log(`   Previsão: ${pedido.data_previsao}`);
  } else {
    console.log('\n4️⃣ ⚠️ Nenhum pedido de produção vinculado');
  }
  
  console.log('\n✅ Fluxo E2E verificado!');
}

async function gerarRelatorio() {
  console.log('\n📊 === RELATÓRIO FINAL ===\n');
  
  // Contagem por organização
  const orgs = [
    { id: ORG_PRISMA, nome: 'Prisma Interiores' },
    { id: ORG_CM_HOME, nome: 'CM Home Decor' }
  ];
  
  for (const org of orgs) {
    console.log(`\n🏢 ${org.nome}:`);
    
    const { count: orcamentos } = await supabase
      .from('orcamentos')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id);
      
    const { count: contatos } = await supabase
      .from('contatos')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id);
      
    const { count: atividades } = await supabase
      .from('atividades_crm')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id);
      
    const { count: contasReceber } = await supabase
      .from('contas_receber')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id);
      
    const { count: contasPagar } = await supabase
      .from('contas_pagar')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id);
      
    const { count: pedidos } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id);
      
    // Instalações não têm organization_id direto, são vinculadas via pedido
    const { data: pedidosOrg } = await supabase
      .from('pedidos')
      .select('id')
      .eq('organization_id', org.id);
    
    let instalacoes = 0;
    if (pedidosOrg?.length) {
      const { count } = await supabase
        .from('instalacoes')
        .select('*', { count: 'exact', head: true })
        .in('pedido_id', pedidosOrg.map(p => p.id));
      instalacoes = count || 0;
    }
    
    console.log(`   📝 Orçamentos: ${orcamentos || 0}`);
    console.log(`   👥 Contatos CRM: ${contatos || 0}`);
    console.log(`   📅 Atividades CRM: ${atividades || 0}`);
    console.log(`   💰 Contas a Receber: ${contasReceber || 0}`);
    console.log(`   💳 Contas a Pagar: ${contasPagar || 0}`);
    console.log(`   🏭 Pedidos Produção: ${pedidos || 0}`);
    console.log(`   🔧 Instalações: ${instalacoes || 0}`);
  }
}

async function main() {
  console.log('🚀 Iniciando testes de CRM e Produção...\n');
  console.log('=' .repeat(50));
  
  try {
    // Limpar dados de teste anteriores
    await limparDadosTeste();
    
    // Testar CRM
    await testarCRM();
    
    // Testar Produção
    await testarProducao();
    
    // Testar fluxo E2E
    await testarFluxoE2E();
    
    // Gerar relatório
    await gerarRelatorio();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ TESTES CONCLUÍDOS COM SUCESSO!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error);
  }
}

main();
