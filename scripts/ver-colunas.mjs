/**
 * Ver colunas exatas das tabelas
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tjwpqrlfhngibuwqodcn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyODU1NCwiZXhwIjoyMDgzOTA0NTU0fQ.fNRNdHBpxoy7dCxeQRJyDt4_SUY51u9gzU21UmSKmuI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verColunas(tabela) {
  console.log(`\n📋 ${tabela}:`);
  
  // Tentar inserir registro mínimo e ver o que retorna
  const { data, error } = await supabase
    .from(tabela)
    .insert({
      organization_id: '11111111-1111-1111-1111-111111111111',
      created_by_user_id: 'bba3ecf2-fb24-4ab2-95f9-cb5ef66a3fd6',
      numero_pedido: 'TESTE-' + Date.now(),
      nome: 'TESTE-' + Date.now(),
      pedido_id: '00000000-0000-0000-0000-000000000000'
    })
    .select();
  
  if (error) {
    // O erro pode revelar quais colunas existem/não existem
    console.log(`   Erro: ${error.message}`);
    if (error.details) console.log(`   Detalhes: ${error.details}`);
  } else if (data && data[0]) {
    console.log(`   ✅ Colunas:`, Object.keys(data[0]).join(', '));
    // Limpar
    await supabase.from(tabela).delete().eq('id', data[0].id);
  }
}

async function main() {
  console.log('🔍 Descobrindo colunas das tabelas...\n');
  
  // Contatos - já sabemos as colunas, vamos testar insert
  console.log('📋 Testando INSERT em contatos:');
  const { data: contato, error: errContato } = await supabase
    .from('contatos')
    .insert({
      organization_id: '11111111-1111-1111-1111-111111111111',
      created_by_user_id: 'bba3ecf2-fb24-4ab2-95f9-cb5ef66a3fd6',
      nome: '[TESTE] Verificação ' + Date.now(),
      telefone: '11999999999',
      tipo: 'lead'
    })
    .select()
    .single();
  
  if (errContato) {
    console.log(`   ❌ Erro: ${errContato.message}`);
  } else {
    console.log(`   ✅ Contato criado! Colunas:`, Object.keys(contato).join(', '));
    await supabase.from('contatos').delete().eq('id', contato.id);
    console.log(`   (Removido)`);
  }
  
  // Pedidos - verificar se existe coluna status
  console.log('\n📋 Testando INSERT em pedidos (mínimo):');
  const { data: pedido, error: errPedido } = await supabase
    .from('pedidos')
    .insert({
      organization_id: '11111111-1111-1111-1111-111111111111',
      numero_pedido: 'VER-' + Date.now()
    })
    .select()
    .single();
  
  if (errPedido) {
    console.log(`   ❌ Erro: ${errPedido.message}`);
    if (errPedido.details) console.log(`   Detalhes: ${errPedido.details}`);
  } else {
    console.log(`   ✅ Pedido criado! Colunas:`, Object.keys(pedido).join(', '));
    await supabase.from('pedidos').delete().eq('id', pedido.id);
    console.log(`   (Removido)`);
  }
}

main();
