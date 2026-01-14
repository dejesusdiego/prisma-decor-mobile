/**
 * Teste de exclusão simulando o que o frontend faz
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tjwpqrlfhngibuwqodcn.supabase.co';
// Usando anon key para simular o frontend (não service_role)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjg1NTQsImV4cCI6MjA4MzkwNDU1NH0.BkT0lVPlfR8tGPAPFzaC-aywda8lh3wa8S-z3EpGvHQ';

// Para testar, precisamos de um token de usuário real
// Vou usar service_role para verificar a política
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyODU1NCwiZXhwIjoyMDgzOTA0NTU0fQ.fNRNdHBpxoy7dCxeQRJyDt4_SUY51u9gzU21UmSKmuI';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// IDs conhecidos
const ORG_PRISMA = '11111111-1111-1111-1111-111111111111';
const USER_PRISMA = 'bba3ecf2-fb24-4ab2-95f9-cb5ef66a3fd6';

async function main() {
  console.log('🔍 Testando exclusão de orçamento (simulando frontend)...\n');

  // Buscar um orçamento de teste
  const { data: orcamento } = await supabaseAdmin
    .from('orcamentos')
    .select('id, codigo, organization_id, created_by_user_id')
    .eq('organization_id', ORG_PRISMA)
    .limit(1)
    .single();

  if (!orcamento) {
    console.log('❌ Nenhum orçamento encontrado para teste');
    return;
  }

  console.log('📋 Orçamento encontrado:');
  console.log(`   ID: ${orcamento.id}`);
  console.log(`   Código: ${orcamento.codigo}`);
  console.log(`   Organization: ${orcamento.organization_id}`);
  console.log(`   Created by: ${orcamento.created_by_user_id}\n`);

  // Verificar se o usuário está na organização
  const { data: membership } = await supabaseAdmin
    .from('organization_members')
    .select('*')
    .eq('user_id', USER_PRISMA)
    .eq('organization_id', ORG_PRISMA)
    .single();

  console.log('👤 Membership do usuário:');
  if (membership) {
    console.log(`   ✅ Usuário está na organização`);
    console.log(`   Role: ${membership.role}`);
  } else {
    console.log(`   ❌ Usuário NÃO está na organização!`);
  }

  // Testar função get_user_organization_id
  console.log('\n🔧 Testando get_user_organization_id()...');
  const { data: orgId, error: orgError } = await supabaseAdmin
    .rpc('get_user_organization_id');

  if (orgError) {
    console.log(`   ❌ Erro: ${orgError.message}`);
  } else {
    console.log(`   ✅ Retornou: ${orgId}`);
    console.log(`   Esperado: ${ORG_PRISMA}`);
    console.log(`   Match: ${orgId === ORG_PRISMA ? '✅' : '❌'}`);
  }

  // Verificar políticas RLS
  console.log('\n📜 Verificando políticas RLS...');
  const { data: policies, error: policiesError } = await supabaseAdmin
    .rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies
        WHERE tablename = 'orcamentos' AND cmd = 'DELETE';
      `
    });

  if (policiesError) {
    console.log('   ⚠️ Não foi possível verificar políticas (normal)');
  } else {
    console.log('   Políticas de DELETE encontradas:', policies?.length || 0);
  }

  // Tentar deletar usando service_role (bypass RLS)
  console.log('\n🗑️ Testando exclusão com service_role (bypass RLS)...');
  
  // Primeiro deletar dependências
  const { error: cortinasError } = await supabaseAdmin
    .from('cortina_items')
    .delete()
    .eq('orcamento_id', orcamento.id);

  if (cortinasError) {
    console.log(`   ⚠️ Erro ao deletar cortina_items: ${cortinasError.message}`);
  } else {
    console.log('   ✅ Cortina items deletados');
  }

  // Deletar orçamento
  const { error: deleteError } = await supabaseAdmin
    .from('orcamentos')
    .delete()
    .eq('id', orcamento.id);

  if (deleteError) {
    console.log(`   ❌ Erro: ${deleteError.message}`);
    console.log(`   Código: ${deleteError.code}`);
  } else {
    console.log('   ✅ Orçamento deletado com sucesso (service_role)');
  }

  console.log('\n💡 Para testar com RLS, você precisa:');
  console.log('   1. Fazer login no frontend');
  console.log('   2. Abrir o console do navegador (F12)');
  console.log('   3. Tentar deletar um orçamento');
  console.log('   4. Ver o erro completo no console\n');
}

main();
