/**
 * Teste simples de conexão com Supabase
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tjwpqrlfhngibuwqodcn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyODU1NCwiZXhwIjoyMDgzOTA0NTU0fQ.fNRNdHBpxoy7dCxeQRJyDt4_SUY51u9gzU21UmSKmuI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('🔌 Testando conexão com Supabase...\n');
  
  // Teste 1: Leitura simples
  console.log('1️⃣ Teste de leitura (organizations):');
  const { data: orgs, error: errOrgs } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(5);
  
  if (errOrgs) {
    console.log('❌ Erro:', errOrgs.message);
  } else {
    console.log('✅ Organizações encontradas:', orgs?.length || 0);
    orgs?.forEach(o => console.log(`   - ${o.name} (${o.id})`));
  }
  
  // Teste 2: Leitura de orçamentos
  console.log('\n2️⃣ Teste de leitura (orcamentos):');
  const { data: orcamentos, error: errOrc } = await supabase
    .from('orcamentos')
    .select('id, codigo, status, organization_id')
    .limit(5);
  
  if (errOrc) {
    console.log('❌ Erro:', errOrc.message);
  } else {
    console.log('✅ Orçamentos encontrados:', orcamentos?.length || 0);
    orcamentos?.forEach(o => console.log(`   - ${o.codigo}: ${o.status}`));
  }
  
  // Teste 3: Verificar contatos CRM
  console.log('\n3️⃣ Teste de leitura (crm_contatos):');
  const { data: contatos, error: errContatos } = await supabase
    .from('crm_contatos')
    .select('id, nome, organization_id')
    .limit(5);
  
  if (errContatos) {
    console.log('❌ Erro:', errContatos.message);
  } else {
    console.log('✅ Contatos encontrados:', contatos?.length || 0);
    contatos?.forEach(c => console.log(`   - ${c.nome}`));
  }
  
  // Teste 4: Inserção simples
  console.log('\n4️⃣ Teste de escrita (crm_contatos):');
  const { data: novoContato, error: errInsert } = await supabase
    .from('crm_contatos')
    .insert({
      organization_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      nome: 'Teste Conexão ' + Date.now(),
      telefone: '11999999999',
      status: 'lead',
      origem: 'teste'
    })
    .select()
    .single();
  
  if (errInsert) {
    console.log('❌ Erro de escrita:', errInsert.message);
    console.log('   Detalhes:', errInsert);
  } else {
    console.log('✅ Contato criado:', novoContato.id);
    
    // Limpar
    await supabase.from('crm_contatos').delete().eq('id', novoContato.id);
    console.log('   (Contato de teste removido)');
  }
  
  console.log('\n✅ Teste de conexão concluído!');
}

main();
