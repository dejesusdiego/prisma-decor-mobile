/**
 * Verificar schema completo das tabelas via SQL
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tjwpqrlfhngibuwqodcn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqd3BxcmxmaG5naWJ1d3FvZGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyODU1NCwiZXhwIjoyMDgzOTA0NTU0fQ.fNRNdHBpxoy7dCxeQRJyDt4_SUY51u9gzU21UmSKmuI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verificarSchema(tabela) {
  console.log(`\n📋 Tabela: ${tabela}`);
  
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: tabela });
  
  if (error) {
    // Fallback: usar information_schema diretamente via SQL
    const { data: cols, error: colsErr } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', tabela)
      .eq('table_schema', 'public');
    
    if (colsErr) {
      console.log(`   ❌ Erro ao buscar schema: ${colsErr.message}`);
      return;
    }
    
    if (cols && cols.length > 0) {
      console.log(`   Colunas encontradas: ${cols.length}`);
      cols.forEach(c => console.log(`   - ${c.column_name} (${c.data_type})`));
    }
    return;
  }
  
  if (data) {
    console.log(`   Colunas: ${data.length}`);
    data.forEach(c => console.log(`   - ${c.column_name} (${c.data_type})`));
  }
}

async function listarTabelasProducao() {
  console.log('🔍 Buscando tabelas de produção no banco...\n');
  
  // Buscar todas as tabelas que podem estar relacionadas a produção
  const { data: tabelas, error } = await supabase
    .rpc('exec_sql', { 
      sql: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%pedido%' OR table_name LIKE '%producao%' OR table_name LIKE '%instalac%'`
    });
  
  if (error) {
    console.log('Não foi possível executar SQL diretamente, usando abordagem alternativa...');
    
    // Tentar inserir e ver o erro para descobrir as colunas
    const tabelas = ['pedidos', 'instalacoes'];
    
    for (const tabela of tabelas) {
      console.log(`\n📋 Verificando estrutura de: ${tabela}`);
      
      // Tentar insert com objeto vazio para ver as colunas obrigatórias
      const { error: insertErr } = await supabase
        .from(tabela)
        .insert({})
        .select();
      
      if (insertErr) {
        console.log(`   Erro (esperado): ${insertErr.message}`);
        console.log(`   Hint: ${insertErr.hint || 'nenhum'}`);
        console.log(`   Details: ${insertErr.details || 'nenhum'}`);
      }
    }
    return;
  }
  
  console.log('Tabelas encontradas:', tabelas);
}

async function inserirPedidoTeste() {
  console.log('\n🧪 Tentando inserir pedido de teste para descobrir colunas...');
  
  // Primeiro tentar com campos mínimos
  const { data, error } = await supabase
    .from('pedidos')
    .insert({
      organization_id: '11111111-1111-1111-1111-111111111111'
    })
    .select();
  
  if (error) {
    console.log(`\n❌ Erro de insert: ${error.message}`);
    
    // O erro pode indicar quais campos são obrigatórios
    if (error.message.includes('violates not-null')) {
      console.log('   → Existem campos obrigatórios faltando');
    }
  } else if (data) {
    console.log('✅ Pedido inserido com sucesso!');
    console.log('   Colunas do registro:', Object.keys(data[0]));
    
    // Limpar
    await supabase.from('pedidos').delete().eq('id', data[0].id);
    console.log('   (Registro de teste removido)');
  }
}

async function main() {
  console.log('🔍 Investigando estrutura das tabelas de Produção...\n');
  console.log('='.repeat(60));
  
  await listarTabelasProducao();
  await inserirPedidoTeste();
  
  console.log('\n' + '='.repeat(60));
}

main();
